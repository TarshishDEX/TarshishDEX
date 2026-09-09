import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchOrderbook, clearOrderbookCache } from "@/lib/stellar/orderbook";

// Mock Horizon server
const mockOrderbookCall = vi.fn();
vi.mock("@/lib/stellar/horizon", () => ({
  getHorizonServer: () => ({
    orderbook: () => ({
      limit: () => ({
        call: mockOrderbookCall,
      }),
    }),
  }),
}));

// Mock asset conversion
vi.mock("@/lib/stellar/asset", () => ({
  toSdkAsset: (a: { code: string; issuer?: string }) =>
    a.issuer ? `${a.code}:${a.issuer}` : `native:${a.code}`,
  fromSdkAsset: (a: unknown) => a,
}));

const XLM = { code: "XLM", isNative: true };
const USDC = { code: "USDC", issuer: "GA5Z..." };

function mockResponse(
  bids: Array<{ price: string; amount: string }>,
  asks: Array<{ price: string; amount: string }>
) {
  return { bids, asks, base: XLM, counter: USDC };
}

beforeEach(() => {
  vi.clearAllMocks();
  clearOrderbookCache();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("fetchOrderbook", () => {
  it("returns normalized orderbook with bids and asks", async () => {
    mockOrderbookCall.mockResolvedValue(
      mockResponse([{ price: "0.125", amount: "1000" }], [{ price: "0.126", amount: "500" }])
    );

    const result = await fetchOrderbook(XLM, USDC, 50);

    expect(result.bids).toHaveLength(1);
    expect(result.bids[0]!.price).toBe(0.125);
    expect(result.bids[0]!.amount).toBe(1000);
    expect(result.bids[0]!.value).toBe(125); // price * amount
    expect(result.asks).toHaveLength(1);
    expect(result.asks[0]!.price).toBe(0.126);
  });

  it("computes midPrice as average of best bid and ask", async () => {
    mockOrderbookCall.mockResolvedValue(
      mockResponse([{ price: "0.100", amount: "1000" }], [{ price: "0.200", amount: "500" }])
    );

    const result = await fetchOrderbook(XLM, USDC);
    expect(result.midPrice).toBe(0.15);
  });

  it("returns null midPrice when no bids", async () => {
    mockOrderbookCall.mockResolvedValue(mockResponse([], [{ price: "0.126", amount: "500" }]));

    const result = await fetchOrderbook(XLM, USDC);
    expect(result.midPrice).toBeNull();
  });

  it("returns null midPrice when no asks", async () => {
    mockOrderbookCall.mockResolvedValue(mockResponse([{ price: "0.125", amount: "1000" }], []));

    const result = await fetchOrderbook(XLM, USDC);
    expect(result.midPrice).toBeNull();
  });

  it("computes spreadPct correctly", async () => {
    mockOrderbookCall.mockResolvedValue(
      mockResponse([{ price: "0.100", amount: "1000" }], [{ price: "0.105", amount: "500" }])
    );

    const result = await fetchOrderbook(XLM, USDC);
    expect(result.spreadPct).toBeCloseTo(5, 1); // (0.105-0.100)/0.100*100 = 5%
  });

  it("returns null spread when no bids", async () => {
    mockOrderbookCall.mockResolvedValue(mockResponse([], [{ price: "0.105", amount: "500" }]));

    const result = await fetchOrderbook(XLM, USDC);
    expect(result.spreadPct).toBeNull();
  });

  it("returns null spread when bestBid is 0", async () => {
    mockOrderbookCall.mockResolvedValue(
      mockResponse([{ price: "0", amount: "1000" }], [{ price: "0.105", amount: "500" }])
    );

    const result = await fetchOrderbook(XLM, USDC);
    expect(result.spreadPct).toBeNull();
  });

  it("returns correct bestBid and bestAsk", async () => {
    mockOrderbookCall.mockResolvedValue(
      mockResponse(
        [
          { price: "0.130", amount: "100" },
          { price: "0.125", amount: "1000" },
        ],
        [
          { price: "0.135", amount: "200" },
          { price: "0.140", amount: "300" },
        ]
      )
    );

    const result = await fetchOrderbook(XLM, USDC);
    expect(result.bestBid).toBe(0.13); // highest bid
    expect(result.bestAsk).toBe(0.135); // lowest ask
  });

  it("handles empty orderbook gracefully", async () => {
    mockOrderbookCall.mockResolvedValue(mockResponse([], []));

    const result = await fetchOrderbook(XLM, USDC);
    expect(result.bids).toHaveLength(0);
    expect(result.asks).toHaveLength(0);
    expect(result.bestBid).toBeNull();
    expect(result.bestAsk).toBeNull();
    expect(result.midPrice).toBeNull();
    expect(result.spreadPct).toBeNull();
  });
});

describe("fetchOrderbook caching", () => {
  it("dedupes concurrent calls for the same pair (single Horizon request)", async () => {
    mockOrderbookCall.mockResolvedValue(mockResponse([], []));

    const [a, b] = await Promise.all([fetchOrderbook(XLM, USDC), fetchOrderbook(XLM, USDC)]);
    expect(a).toEqual(b);
    expect(mockOrderbookCall).toHaveBeenCalledTimes(1);
  });

  it("serves a cached snapshot for repeated calls within the TTL", async () => {
    mockOrderbookCall.mockResolvedValue(mockResponse([], []));

    await fetchOrderbook(XLM, USDC);
    await fetchOrderbook(XLM, USDC);
    await fetchOrderbook(XLM, USDC);
    expect(mockOrderbookCall).toHaveBeenCalledTimes(1);
  });

  it("refetches once the TTL expires", async () => {
    vi.useFakeTimers();
    mockOrderbookCall.mockResolvedValue(mockResponse([], []));

    await fetchOrderbook(XLM, USDC);
    vi.advanceTimersByTime(3_100); // past ORDERBOOK_CACHE_TTL_MS (3000)
    await fetchOrderbook(XLM, USDC);
    expect(mockOrderbookCall).toHaveBeenCalledTimes(2);
  });

  it("does not cache failures — the next call retries", async () => {
    mockOrderbookCall.mockRejectedValueOnce(new Error("Horizon 500"));
    mockOrderbookCall.mockResolvedValueOnce(mockResponse([], []));

    await expect(fetchOrderbook(XLM, USDC)).rejects.toThrow("Horizon 500");
    const result = await fetchOrderbook(XLM, USDC);
    expect(result.bids).toHaveLength(0);
    expect(mockOrderbookCall).toHaveBeenCalledTimes(2);
  });

  it("caches different pairs separately", async () => {
    mockOrderbookCall.mockResolvedValue(mockResponse([], []));

    const BTC = { code: "BTC", issuer: "GA5Z..." };
    await fetchOrderbook(XLM, USDC);
    await fetchOrderbook(XLM, BTC);
    await fetchOrderbook(XLM, USDC);
    expect(mockOrderbookCall).toHaveBeenCalledTimes(2);
  });
});
