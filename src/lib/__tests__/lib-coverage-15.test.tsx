import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

// =========================================================================
// routing.ts — bridge not-fully-filled + bridge fetch failure
// =========================================================================

const { fetchOrderbookMock, simulateFillMock, strictSendPathsMock, loggerWarnMock } = vi.hoisted(
  () => ({
    fetchOrderbookMock: vi.fn(),
    simulateFillMock: vi.fn(),
    strictSendPathsMock: vi.fn(),
    loggerWarnMock: vi.fn(),
  })
);

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
vi.mock("@/lib/server/logger", () => ({
  logger: { warn: loggerWarnMock, info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { findBestRoute } from "@/lib/stellar/routing";

const XLM = { code: "XLM", isNative: true };
const USDC = { code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" };
const AQUA = { code: "AQUA", issuer: "GDJKIC7KGFJPZ7O4STRZTOASB4R73WRW2V3DVULSFITPYD6FZBLXE5QZ" };

function makeOrderbook(midPrice: number) {
  return { bids: [], asks: [], midPrice };
}

describe("routing bridge failure branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchOrderbookMock.mockReset();
    simulateFillMock.mockReset();
    strictSendPathsMock.mockReset();
    strictSendPathsMock.mockReturnValue({ call: vi.fn().mockResolvedValue({ records: [] }) });
  });

  it("returns a null bridge candidate when the first leg is not fully filled", async () => {
    // Direct route fills fully; the XLM->USDC bridge leg reports not-fully-filled.
    fetchOrderbookMock.mockResolvedValue(makeOrderbook(1));
    simulateFillMock.mockImplementation((amountIn: string, orderbook: unknown) => {
      const isBridgeLeg = (orderbook as { counter?: { code?: string } })?.counter?.code === "USDC";
      if (isBridgeLeg) {
        return { output: "5", avgPrice: 0.5, fullyFilled: false };
      }
      return { output: "9", avgPrice: 0.9, fullyFilled: true };
    });
    const route = await findBestRoute(XLM, AQUA, "10");
    // The direct route still wins; the bridge candidate was skipped.
    expect(route).not.toBeNull();
    expect(route?.method).toBe("direct");
  });

  it("survives a bridge orderbook fetch failure", async () => {
    simulateFillMock.mockReturnValue({ output: "9", avgPrice: 0.9, fullyFilled: true });
    // Direct fetch works; bridge fetches (buying USDC) fail.
    fetchOrderbookMock.mockImplementation((_sell: unknown, buy: unknown) => {
      if ((buy as { code?: string }).code === "USDC") {
        return Promise.reject(new Error("bridge down"));
      }
      return Promise.resolve(makeOrderbook(1));
    });
    const route = await findBestRoute(XLM, AQUA, "10");
    expect(loggerWarnMock).toHaveBeenCalledWith(
      "routing: bridge route fetch failed",
      expect.anything()
    );
    expect(route).not.toBeNull();
  });
});

// =========================================================================
// limit-order.ts — catch branches return fallbacks
// =========================================================================

vi.mock("@/lib/soroban/config", () => ({
  getLimitOrderContractId: () => "CLIMIT...",
  getTradingPreferencesContractId: () => "CTRADE...",
  getSorobanRpcServer: () => ({
    simulateTransaction: vi.fn().mockRejectedValue(new Error("rpc down")),
  }),
}));

vi.mock("server-only", () => ({}));

import {
  queryUserOrders,
  buildPlaceOrderTx,
  buildCancelOrExecuteTx,
} from "@/lib/soroban/limit-order";

describe("limit-order client catch branches", () => {
  it("returns an empty list when user-order fetch fails", async () => {
    expect(await queryUserOrders(VALID_ADDRESS)).toEqual([]);
  });

  it("returns null when building a place-order tx fails", async () => {
    expect(await buildPlaceOrderTx(VALID_ADDRESS, "XLM", "USDC", 1, 10, 0, "buy")).toBeNull();
  });

  it("returns null when building a cancel tx fails", async () => {
    expect(await buildCancelOrExecuteTx(VALID_ADDRESS, 1)).toBeNull();
  });
});

// =========================================================================
// trading-preferences.ts — read/write failure paths
// =========================================================================

import {
  readContractVersion,
  readPreferenceCount,
  writeTradingPreferences,
} from "@/lib/soroban/trading-preferences";

describe("trading-preferences failure paths", () => {
  it("returns null when the version read fails", async () => {
    expect(await readContractVersion()).toBeNull();
  });

  it("returns null when the preference count read fails", async () => {
    expect(await readPreferenceCount()).toBeNull();
  });

  it("returns a failed result when the write fails", async () => {
    const result = await writeTradingPreferences(VALID_ADDRESS, {
      max_slippage_bps: 100,
      routing_mode: "auto",
      allowed_assets: [],
    });
    expect(result).toEqual({ ok: false, reason: "failed" });
  });
});

// =========================================================================
// wallet-kit.ts — fire subscribed events
// =========================================================================

describe("wallet-kit subscribed events", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("forwards STATE_UPDATED and DISCONNECT events to callbacks", async () => {
    const handlers: Record<string, (event?: { payload?: unknown }) => void> = {};
    const on = vi.fn((type: string, handler: (event?: { payload?: unknown }) => void) => {
      handlers[type] = handler;
      return () => undefined;
    });
    vi.doMock("@creit.tech/stellar-wallets-kit", () => ({
      StellarWalletsKit: {
        init: vi.fn(),
        on,
        authModal: vi.fn(),
        disconnect: vi.fn(),
      },
      KitEventType: { STATE_UPDATED: "state_updated", DISCONNECT: "disconnect" },
      Networks: { TESTNET: "testnet", PUBLIC: "public" },
    }));
    vi.doMock("@creit.tech/stellar-wallets-kit/modules/utils", () => ({
      defaultModules: () => [],
    }));
    vi.doMock("@/lib/stellar/config", () => ({
      getActiveNetwork: () => ({
        name: "testnet",
        passphrase: "Test SDF Network ; September 2015",
      }),
    }));
    const onStateUpdated = vi.fn();
    const onDisconnect = vi.fn();
    const kit = await import("@/lib/stellar/wallet-kit");
    await kit.subscribeWalletEvents({ onStateUpdated, onDisconnect });
    act(() => {
      handlers["state_updated"]?.({ payload: { address: "GADDR", networkPassphrase: "pass" } });
      handlers["disconnect"]?.();
    });
    expect(onStateUpdated).toHaveBeenCalledWith("GADDR", "pass");
    expect(onDisconnect).toHaveBeenCalled();
  });
});

// =========================================================================
// sw-register.ts — dev logging on success
// =========================================================================

import { registerSW } from "@/lib/sw-register";

describe("sw-register", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("logs registration in development mode", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const registerMock = vi.fn().mockResolvedValue({ scope: "/" });
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register: registerMock },
      configurable: true,
    });
    const listeners: Record<string, () => void> = {};
    const addSpy = vi.spyOn(window, "addEventListener").mockImplementation(((
      type: string,
      cb: EventListenerOrEventListenerObject
    ) => {
      listeners[type] = cb as () => void;
    }) as typeof window.addEventListener);
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    registerSW();
    listeners["load"]?.();
    await vi.waitFor(() => expect(debugSpy).toHaveBeenCalledWith("[sw] registered", "/"));
    expect(registerMock).toHaveBeenCalledWith("/sw.js", { scope: "/" });
    addSpy.mockRestore();
  });
});

// =========================================================================
// use-local-storage-value.ts — getItem throws
// =========================================================================

import { useLocalStorageValue } from "@/lib/hooks/use-local-storage-value";

describe("useLocalStorageValue storage failure", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to the initial value when getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage denied");
    });
    const { result } = renderHook(() => useLocalStorageValue("lsv-k", "fallback"));
    expect(result.current[0]).toBe("fallback");
  });
});

// =========================================================================
// use-media-query.ts — server snapshot
// =========================================================================

import { renderToString } from "react-dom/server";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

describe("useMediaQuery server snapshot", () => {
  it("returns false during SSR", () => {
    function Probe() {
      const matches = useMediaQuery("(min-width: 768px)");
      return <span data-testid="mq">{String(matches)}</span>;
    }
    const html = renderToString(<Probe />);
    expect(html).toContain("false");
  });
});

// =========================================================================
// wallet-store.ts — useWallet hook body
// =========================================================================

import { useWallet } from "@/lib/stellar/wallet-store";

describe("wallet-store useWallet hook", () => {
  it("binds the zustand store to a hook", () => {
    const { result } = renderHook(() => useWallet());
    expect(result.current).toBeDefined();
    expect(typeof result.current.connect).toBe("function");
    expect(typeof result.current.disconnect).toBe("function");
  });
});
