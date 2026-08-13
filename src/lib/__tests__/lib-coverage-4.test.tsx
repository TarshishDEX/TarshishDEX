import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// =========================================================================
// debouncePromise (pure)
// =========================================================================
import { debouncePromise } from "@/lib/utils/debounce-promise";

describe("debouncePromise", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("debounces and resolves with the latest call", async () => {
    const fn = vi.fn(async (_signal: AbortSignal, value: number) => value * 2);
    const debounced = debouncePromise(fn, 100);

    // Earlier calls get their timers cleared and never resolve — only the
    // last call wins. Await only the final promise.
    void debounced(1);
    void debounced(2);
    const winner = debounced(3);

    await vi.advanceTimersByTimeAsync(100);
    await Promise.resolve();

    expect(await winner).toBe(6);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(expect.anything(), 3);
  });

  it("aborts the previous in-flight call", async () => {
    const signals: AbortSignal[] = [];
    const fn = vi.fn(async (signal: AbortSignal) => {
      signals.push(signal);
      await new Promise((r) => setTimeout(r, 200));
      return "done";
    });
    const debounced = debouncePromise(fn, 50);

    // First call fires fn(signal0) and starts its 200ms inner timer.
    void debounced();
    await vi.advanceTimersByTimeAsync(50);
    // Second call aborts signal0 before fn0 resolves.
    const winner = debounced();
    await vi.advanceTimersByTimeAsync(50);
    await vi.advanceTimersByTimeAsync(200);
    await Promise.resolve();

    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
    expect(await winner).toBe("done");
  });

  it("rejects when the function throws and the signal is not aborted", async () => {
    const fn = vi.fn(async (_signal: AbortSignal) => {
      throw new Error("boom");
    });
    const debounced = debouncePromise(fn, 50);
    const p = debounced();
    // Attach the rejection handler before timers fire so the rejection is
    // observed and never surfaces as an unhandled rejection.
    const assertion = expect(p).rejects.toThrow("boom");
    await vi.advanceTimersByTimeAsync(50);
    await assertion;
  });
});

// =========================================================================
// registerSW
// =========================================================================
import { registerSW } from "@/lib/sw-register";

describe("registerSW", () => {
  const originalNavigator = globalThis.navigator;

  it("returns early when serviceWorker is unavailable", () => {
    vi.stubGlobal(
      "navigator",
      Object.defineProperty({}, "serviceWorker", { value: undefined, configurable: true }),
    );
    expect(() => registerSW()).not.toThrow();
    vi.unstubAllGlobals();
  });

  it("registers the service worker on window load", async () => {
    const register = vi.fn().mockResolvedValue({ scope: "/" });
    const addEventListener = vi.fn((_event: string, cb: () => void) => {
      // Fire the load event immediately
      cb();
    });
    vi.stubGlobal(
      "navigator",
      Object.defineProperty({}, "serviceWorker", { value: { register }, configurable: true }),
    );
    vi.stubGlobal(
      "window",
      Object.defineProperty({}, "addEventListener", { value: addEventListener, configurable: true }),
    );
    vi.stubEnv("NODE_ENV", "test");

    registerSW();
    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
    vi.unstubAllGlobals();
  });

  it("logs when registration fails (dev only)", async () => {
    const register = vi.fn().mockRejectedValue(new Error("denied"));
    const addEventListener = vi.fn((_event: string, cb: () => void) => cb());
    vi.stubGlobal(
      "navigator",
      Object.defineProperty({}, "serviceWorker", { value: { register }, configurable: true }),
    );
    vi.stubGlobal(
      "window",
      Object.defineProperty({}, "addEventListener", { value: addEventListener, configurable: true }),
    );
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");

    registerSW();
    await vi.waitFor(() => expect(debugSpy).toHaveBeenCalled());
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
});

// =========================================================================
// live streaming helpers
// =========================================================================
const { getHorizonServerMock } = vi.hoisted(() => ({
  getHorizonServerMock: vi.fn(),
}));

vi.mock("@/lib/stellar/horizon", () => ({
  getHorizonServer: getHorizonServerMock,
}));

vi.mock("@/lib/stellar/asset", () => ({
  toSdkAsset: (a: { code: string; issuer?: string; isNative?: boolean }) => ({
    code: a.code,
    issuer: a.issuer,
    isNative: a.isNative,
  }),
}));

import { streamAccountOperations, streamTrades, streamTradesRecords } from "@/lib/stellar/live";

describe("stream helpers", () => {
  it("streamAccountOperations returns a close function", () => {
    const close = vi.fn();
    const stream = vi.fn().mockReturnValue(close);
    getHorizonServerMock.mockReturnValue({
      operations: () => ({ forAccount: () => ({ cursor: () => ({ stream }) }) }),
    });
    const onMessage = vi.fn();
    const result = streamAccountOperations("GABC", onMessage);
    expect(stream).toHaveBeenCalled();
    const opts = stream.mock.calls[0]?.[0];
    expect(opts).toHaveProperty("onmessage");
    opts.onmessage();
    expect(onMessage).toHaveBeenCalled();
    result();
    expect(close).toHaveBeenCalled();
  });

  it("streamTradesRecords passes records to onMessage", () => {
    const close = vi.fn();
    const stream = vi.fn().mockReturnValue(close);
    getHorizonServerMock.mockReturnValue({
      trades: () => ({ forAssetPair: () => ({ cursor: () => ({ stream }) }) }),
    });
    const onMessage = vi.fn();
    const record = { id: "trade-1" };
    streamTradesRecords({ code: "XLM", isNative: true }, { code: "USDC" }, onMessage);
    const opts = stream.mock.calls[0]?.[0];
    opts.onmessage(record);
    expect(onMessage).toHaveBeenCalledWith(record);
  });

  it("streamTrades wraps records to call onMessage", () => {
    const close = vi.fn();
    const stream = vi.fn().mockReturnValue(close);
    getHorizonServerMock.mockReturnValue({
      trades: () => ({ forAssetPair: () => ({ cursor: () => ({ stream }) }) }),
    });
    const onMessage = vi.fn();
    const result = streamTrades({ code: "XLM", isNative: true }, { code: "USDC" }, onMessage);
    const opts = stream.mock.calls[0]?.[0];
    opts.onmessage({ id: "x" });
    expect(onMessage).toHaveBeenCalled();
    result();
    expect(close).toHaveBeenCalled();
  });
});

// =========================================================================
// pool-queries
// =========================================================================
import { fetchLiquidityPools, buildPoolSummary } from "@/lib/stellar/pool-queries";

describe("pool-queries", () => {
  it("fetchLiquidityPools maps Horizon records", async () => {
    const call = vi.fn().mockResolvedValue({
      records: [
        {
          id: "pool-1",
          fee_bp: 30,
          total_shares: "1000",
          total_trustlines: 5,
          reserves: [{ asset: "XLM", amount: "500" }, { asset: "USDC:GA5Z", amount: "500" }],
        },
      ],
    });
    getHorizonServerMock.mockReturnValue({
      liquidityPools: () => ({ forAssets: () => ({ limit: () => ({ call }) }) }),
    });
    const pools = await fetchLiquidityPools(
      { code: "XLM", isNative: true },
      { code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" },
    );
    expect(pools).toHaveLength(1);
    expect(pools[0]?.id).toBe("pool-1");
    expect(pools[0]?.reserves[0]?.amount).toBe("500");
  });

  it("buildPoolSummary returns null with <2 reserves", () => {
    expect(buildPoolSummary({ id: "p", feeBp: 30, totalShares: "1", totalTrustlines: "1", reserves: [] })).toBeNull();
  });

  it("buildPoolSummary returns null with zero reserves", () => {
    expect(
      buildPoolSummary({
        id: "p",
        feeBp: 30,
        totalShares: "1",
        totalTrustlines: "1",
        reserves: [{ asset: "XLM", amount: "0" }, { asset: "USDC:GA5Z", amount: "10" }],
      }),
    ).toBeNull();
  });

  it("buildPoolSummary computes midPrice and tvl", () => {
    const summary = buildPoolSummary({
      id: "p",
      feeBp: 30,
      totalShares: "1",
      totalTrustlines: "1",
      reserves: [{ asset: "XLM", amount: "100" }, { asset: "USDC:GA5Z", amount: "200" }],
    });
    expect(summary).not.toBeNull();
    expect(summary?.midPrice).toBe(2);
    expect(summary?.tvl).toBe(300);
    expect(summary?.feeBp).toBe(30);
  });
});

// =========================================================================
// limit-order query hooks
// =========================================================================
import { useUserLimitOrders, usePaginatedLimitOrders } from "@/lib/stellar/limit-order-queries";

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "QueryWrapper";
  return Wrapper;
}

describe("limit-order query hooks", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ orders: [{ id: 1, base: "XLM" }] }),
      }),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("useUserLimitOrders stays disabled without an address", async () => {
    const { result } = renderHook(() => useUserLimitOrders(null), { wrapper: makeWrapper() });
    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("useUserLimitOrders fetches orders for an address", async () => {
    const { result } = renderHook(() => useUserLimitOrders("GABC"), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.data).toEqual([{ id: 1, base: "XLM" }]));
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/orders?user=GABC");
  });

  it("useUserLimitOrders throws when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: vi.fn() }),
    );
    const { result } = renderHook(() => useUserLimitOrders("GABC"), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("usePaginatedLimitOrders passes cursor param when set", async () => {
    const { result } = renderHook(() => usePaginatedLimitOrders(7, 20), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.data).toBeDefined());
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(url).toBe("/api/orders?limit=20&cursor=7");
  });

  it("usePaginatedLimitOrders omits cursor when null", async () => {
    const { result } = renderHook(() => usePaginatedLimitOrders(null), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.data).toBeDefined());
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(url).toBe("/api/orders?limit=20");
  });
});
