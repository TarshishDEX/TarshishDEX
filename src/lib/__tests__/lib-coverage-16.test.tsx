import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";

const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

// =========================================================================
// routing.ts mocks (shared by the routing test)
// =========================================================================

const { fetchOrderbookMock, simulateFillMock, strictSendPathsMock } = vi.hoisted(() => ({
  fetchOrderbookMock: vi.fn(),
  simulateFillMock: vi.fn(),
  strictSendPathsMock: vi.fn(),
}));

vi.mock("@/lib/stellar/orderbook", () => ({ fetchOrderbook: fetchOrderbookMock }));
vi.mock("@/lib/stellar/simulation", () => ({
  simulateOrderbookFill: simulateFillMock,
  computePriceImpact: (_a: number, _m: number | null) => 0.5,
  computeMinReceived: (o: string, s: number) => (Number(o) * (1 - s / 100)).toString(),
  estimateSwapFeeXlm: (h: number) => (0.01 * h).toFixed(7),
  buildWarnings: () => [] as string[],
}));
vi.mock("@/lib/stellar/horizon", () => ({
  getHorizonServer: () => ({ strictSendPaths: strictSendPathsMock }),
}));
vi.mock("@/lib/stellar/asset", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stellar/asset")>();
  return { ...actual };
});

import { findBestRoute } from "@/lib/stellar/routing";

const XLM = { code: "XLM", isNative: true };
const AQUA = { code: "AQUA", issuer: "GDJKIC7KGFJPZ7O4STRZTOASB4R73WRW2V3DVULSFITPYD6FZBLXE5QZ" };

// =========================================================================
// routing.ts — bridge first leg not fully filled
// =========================================================================

describe("routing bridge first-leg fill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchOrderbookMock.mockReset();
    simulateFillMock.mockReset();
    strictSendPathsMock.mockReset();
    strictSendPathsMock.mockReturnValue({ call: vi.fn().mockResolvedValue({ records: [] }) });
  });

  it("skips the bridge candidate when the first leg is not fully filled", async () => {
    fetchOrderbookMock.mockImplementation((sell: unknown, buy: unknown) => {
      const tag = `${(sell as { code?: string }).code ?? "?"}->${(buy as { code?: string }).code ?? "?"}`;
      return Promise.resolve({ bids: [], asks: [], midPrice: 1, tag });
    });
    simulateFillMock.mockImplementation((_amountIn: string, orderbook: unknown) => {
      if ((orderbook as { tag?: string }).tag === "XLM->USDC") {
        return { output: "5", avgPrice: 0.5, fullyFilled: false };
      }
      return { output: "9", avgPrice: 0.9, fullyFilled: true };
    });
    const route = await findBestRoute(XLM, AQUA, "10");
    expect(route).not.toBeNull();
    expect(route?.method).toBe("direct");
  });

  it("handles null bridge mid prices", async () => {
    fetchOrderbookMock.mockImplementation(() =>
      Promise.resolve({ bids: [], asks: [], midPrice: null })
    );
    simulateFillMock.mockReturnValue({ output: "9", avgPrice: 0.9, fullyFilled: true });
    const route = await findBestRoute(XLM, AQUA, "10");
    expect(route).not.toBeNull();
    expect(route?.method).toBe("direct");
  });

  it("picks the best Horizon strict-send path", async () => {
    strictSendPathsMock.mockReturnValue({
      call: vi.fn().mockResolvedValue({
        records: [
          { destination_amount: "5", path: [] },
          { destination_amount: "9", path: [] },
          { destination_amount: "4", path: [] },
        ],
      }),
    });
    fetchOrderbookMock.mockImplementation(() =>
      Promise.resolve({ bids: [], asks: [], midPrice: 1 })
    );
    simulateFillMock.mockReturnValue({ output: "5", avgPrice: 0.5, fullyFilled: true });
    const route = await findBestRoute(XLM, AQUA, "10");
    expect(route?.method).toBe("path-finding");
    expect(route?.outputAmount).toBe("9");
  });
});

// =========================================================================
// graceful-shutdown — timeout + SIGTERM wrapper
// =========================================================================

import { registerGracefulShutdown } from "@/lib/server/graceful-shutdown";

describe("graceful-shutdown timeout + SIGTERM", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("rejects and exits cleanly when onShutdown times out", async () => {
    vi.useFakeTimers();
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const handlers: Record<string, () => void> = {};
    const onSpy = vi.spyOn(process, "on").mockImplementation((() => process) as never);
    vi.mocked(onSpy).mockImplementation(((event: string, cb: () => void) => {
      handlers[event] = cb;
      return process;
    }) as never);

    registerGracefulShutdown({
      timeoutMs: 1000,
      onShutdown: () => new Promise<void>(() => {}),
    });
    const pending = handlers["SIGINT"]!();
    await vi.advanceTimersByTimeAsync(1000);
    await pending;
    expect(errorSpy).toHaveBeenCalledWith("[shutdown] Error during shutdown:", expect.anything());
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("invokes the SIGTERM wrapper handler", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    vi.spyOn(console, "log").mockImplementation(() => {});
    const handlers: Record<string, () => void> = {};
    const onSpy = vi.spyOn(process, "on").mockImplementation((() => process) as never);
    vi.mocked(onSpy).mockImplementation(((event: string, cb: () => void) => {
      handlers[event] = cb;
      return process;
    }) as never);

    registerGracefulShutdown({});
    await handlers["SIGTERM"]!();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});

// =========================================================================
// use-window-focus — focus / blur handlers
// =========================================================================

import { useWindowFocus } from "@/lib/hooks/use-window-focus";

describe("useWindowFocus", () => {
  it("tracks window focus and blur", () => {
    const { result } = renderHook(() => useWindowFocus());
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(result.current).toBe(true);
    act(() => {
      window.dispatchEvent(new Event("blur"));
    });
    expect(result.current).toBe(false);
  });
});

// =========================================================================
// use-document-visibility — visibilitychange handler
// =========================================================================

import { useDocumentVisibility } from "@/lib/hooks/use-document-visibility";

describe("useDocumentVisibility", () => {
  it("updates when the visibility changes", () => {
    const { result } = renderHook(() => useDocumentVisibility());
    act(() => {
      Object.defineProperty(document, "visibilityState", {
        value: "hidden",
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current).toBe("hidden");
  });
});

// =========================================================================
// useEffectOnce — ran guard
// =========================================================================

import { useEffectOnce } from "@/lib/hooks/use-effect-once";

describe("useEffectOnce", () => {
  it("does not re-run when the effect identity changes", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ fn }) => useEffectOnce(fn), {
      initialProps: { fn: first },
    });
    expect(first).toHaveBeenCalledTimes(1);
    rerender({ fn: second });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });
});

// =========================================================================
// use-intersection-observer — empty entry guard
// =========================================================================

import { useIntersectionObserver } from "@/lib/hooks/use-intersection-observer";

describe("useIntersectionObserver empty entry", () => {
  let callback: (entries: IntersectionObserverEntry[]) => void = () => {};
  class MockIntersectionObserver {
    constructor(cb: (entries: IntersectionObserverEntry[]) => void) {
      callback = cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ignores an empty observer entry", () => {
    function Component() {
      const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>();
      return (
        <div ref={ref} data-testid="target">
          {isIntersecting ? "visible" : "hidden"}
        </div>
      );
    }
    render(<Component />);
    expect(screen.getByText("hidden")).toBeTruthy();
    act(() => {
      callback([]);
    });
    expect(screen.getByText("hidden")).toBeTruthy();
  });
});

// =========================================================================
// use-on-click-outside — click inside the ref
// =========================================================================

import { useOnClickOutside } from "@/lib/hooks/use-on-click-outside";

describe("useOnClickOutside inside click", () => {
  it("does not fire when the click is inside the attached ref", () => {
    const handler = vi.fn();
    const div = document.createElement("div");
    document.body.appendChild(div);
    const inner = document.createElement("span");
    div.appendChild(inner);
    const ref = { current: div };
    renderHook(() => useOnClickOutside(ref, handler));
    act(() => {
      inner.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(div);
  });
});

// =========================================================================
// use-token-balance — invalid public key guard
// =========================================================================

import { useTokenBalance } from "@/lib/hooks/use-token-balance";

describe("useTokenBalance invalid key", () => {
  it("returns null from the queryFn when the address is invalid", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    renderHook(() => useTokenBalance("not-a-key", { code: "USDC", issuer: VALID_ADDRESS }), {
      wrapper,
    });
    const query = qc
      .getQueryCache()
      .findAll()
      .find((q) => Array.isArray(q.queryKey) && q.queryKey[0] === "token-balance");
    expect(query).toBeTruthy();
    const fn = query!.options.queryFn as unknown as () => Promise<unknown>;
    expect(await fn()).toBeNull();
  });
});

// =========================================================================
// queries.ts — missing inputs guard
// =========================================================================

import { useSwapQuote } from "@/lib/stellar/queries";

describe("useSwapQuote missing inputs", () => {
  it("returns null from the queryFn when inputs are missing", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    renderHook(() => useSwapQuote(null, null, "", 1), { wrapper });
    const query = qc
      .getQueryCache()
      .findAll()
      .find((q) => Array.isArray(q.queryKey) && q.queryKey[0] === "swap-quote");
    expect(query).toBeTruthy();
    const fn = query!.options.queryFn as unknown as () => Promise<unknown>;
    expect(await fn()).toBeNull();
  });
});

// =========================================================================
// limit-order-queries — failed fetch throws
// =========================================================================

import { usePaginatedLimitOrders, useUserLimitOrders } from "@/lib/stellar/limit-order-queries";

describe("usePaginatedLimitOrders fetch failure", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("throws when the orders fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => usePaginatedLimitOrders(null), { wrapper });
    await vi.waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("returns [] from the queryFn when there is no address", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    renderHook(() => useUserLimitOrders(null), { wrapper });
    const query = qc
      .getQueryCache()
      .findAll()
      .find((q) => Array.isArray(q.queryKey) && q.queryKey[0] === "limit-orders");
    expect(query).toBeTruthy();
    const fn = query!.options.queryFn as unknown as () => Promise<unknown>;
    expect(await fn()).toEqual([]);
  });
});

// =========================================================================
// use-copy-to-clipboard — execCommand fallback timer
// =========================================================================

import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";

describe("useCopyToClipboard fallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("sets copied then resets via the fallback path", async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    document.execCommand = vi.fn(() => true) as never;
    const { result } = renderHook(() => useCopyToClipboard());
    let success = false;
    await act(async () => {
      success = await result.current.copy("text");
    });
    expect(success).toBe(true);
    expect(result.current.copied).toBe(true);
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(result.current.copied).toBe(false);
  });
});

// =========================================================================
// logger — LOG_LEVEL env var
// =========================================================================

describe("logger LOG_LEVEL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("applies a valid LOG_LEVEL from the environment", async () => {
    vi.resetModules();
    vi.stubEnv("LOG_LEVEL", "info");
    const { logger } = await import("@/lib/server/logger");
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    logger.debug("suppressed");
    logger.info("shown");
    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalled();
  });

  it("uses info level in production", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    const { logger } = await import("@/lib/server/logger");
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    logger.debug("suppressed");
    logger.info("shown");
    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalled();
  });

  it("suppresses warn and info at error level", async () => {
    vi.resetModules();
    vi.stubEnv("LOG_LEVEL", "error");
    const { logger } = await import("@/lib/server/logger");
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.info("suppressed");
    logger.warn("suppressed");
    logger.error("shown");
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });
});

// =========================================================================
// wallet-kit — SSR availability check
// =========================================================================

import { isWalletAvailable } from "@/lib/stellar/wallet-kit";

describe("isWalletAvailable SSR", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when there is no window", async () => {
    vi.stubGlobal("window", undefined);
    expect(await isWalletAvailable()).toBe(false);
  });
});

// =========================================================================
// theme — SSR snapshot (no window/document)
// =========================================================================

import { ThemeProvider } from "@/lib/theme";

describe("ThemeProvider SSR", () => {
  it("defaults to dark theme and skips DOM apply without window/document", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const html = renderToString(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>
    );
    expect(html).toContain("child");
  });
});
