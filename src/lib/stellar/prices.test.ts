import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFetchOrderbook, mockTradeAggregation, mockAssets } = vi.hoisted(() => ({
  mockFetchOrderbook: vi.fn(),
  mockTradeAggregation: vi.fn(),
  mockAssets: vi.fn(),
}));

vi.mock("@/lib/stellar/orderbook", () => ({
  fetchOrderbook: mockFetchOrderbook,
}));

vi.mock("@/lib/stellar/horizon", () => ({
  getHorizonServer: () => ({
    tradeAggregation: () => ({ limit: () => ({ call: mockTradeAggregation }) }),
    assets: () => ({ limit: () => ({ call: mockAssets }) }),
  }),
}));

// Dynamic imports to work with vi.mock hoisting
const pricesModule = await import("@/lib/stellar/prices");
const { getMarketStatsForTokens, getMarketStats, fetchCandles, fetchTopAssets } = pricesModule;

import type { OrderbookData, Token } from "@/lib/stellar/types";

const XLM: Token = { code: "XLM", name: "Lumen", decimals: 7, isNative: true };
const USDC: Token = {
  code: "USDC",
  name: "USD Coin",
  decimals: 7,
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};

// ── Helpers ────────────────────────────────────────────────────────────
function makeCandleRecord(overrides: Record<string, unknown> = {}) {
  return {
    timestamp: String(Date.now()),
    open: "10",
    high: "11",
    low: "9",
    close: "10.5",
    base_volume: "1000",
    counter_volume: "10000",
    trade_count: "5",
    ...overrides,
  };
}

function makeOrderbook(overrides: Partial<OrderbookData> = {}): OrderbookData {
  return {
    base: USDC,
    counter: XLM,
    bids: [{ price: 0.094, amount: 1000, value: 94 }],
    asks: [{ price: 0.096, amount: 1000, value: 96 }],
    bestBid: 0.094,
    bestAsk: 0.096,
    midPrice: 0.095,
    spreadPct: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── fetchCandles ────────────────────────────────────────────────────────
describe("fetchCandles", () => {
  it("maps Horizon trade aggregation records to Candle type", async () => {
    mockTradeAggregation.mockResolvedValue({
      records: [makeCandleRecord()],
    });

    const candles = await fetchCandles(XLM, USDC, Date.now() - 86_400_000, Date.now(), 3_600_000);
    expect(candles).toHaveLength(1);
    const c = candles[0]!;
    expect(c.open).toBe(10);
    expect(c.high).toBe(11);
    expect(c.low).toBe(9);
    expect(c.close).toBe(10.5);
    expect(c.volumeBase).toBe(1000);
    expect(c.volumeCounter).toBe(10000);
    expect(c.tradeCount).toBe(5);
    expect(typeof c.timestamp).toBe("number");
  });

  it("returns empty array when no records", async () => {
    mockTradeAggregation.mockResolvedValue({ records: [] });
    const candles = await fetchCandles(XLM, USDC, Date.now() - 86_400_000, Date.now());
    expect(candles).toEqual([]);
  });
});

// ── getMarketStats ──────────────────────────────────────────────────────
describe("getMarketStats", () => {
  it("returns XLM priced at 1 with no Horizon calls", async () => {
    const stats = await getMarketStats(XLM);
    expect(stats.token.code).toBe("XLM");
    expect(stats.priceInXlm).toBe(1);
    expect(stats.volume24hXlm).toBe(0);
    expect(stats.change24hPct).toBeNull();
    expect(stats.bestBid).toBeNull();
    expect(stats.bestAsk).toBeNull();
  });

  it("fetches price from orderbook for issued assets", async () => {
    mockFetchOrderbook.mockResolvedValue(
      makeOrderbook({ midPrice: 0.095, bestBid: 0.094, bestAsk: 0.096 })
    );
    mockTradeAggregation.mockResolvedValue({ records: [] });

    const stats = await getMarketStats(USDC);
    expect(stats.priceInXlm).toBe(0.095);
    expect(stats.bestBid).toBe(0.094);
    expect(stats.bestAsk).toBe(0.096);
  });

  it("handles missing orderbook gracefully", async () => {
    mockFetchOrderbook.mockRejectedValue(new Error("No market"));
    const stats = await getMarketStats(USDC);
    expect(stats.priceInXlm).toBeNull();
    expect(stats.volume24hXlm).toBe(0);
  });

  it("computes 24h volume and change from candles for issued assets", async () => {
    mockFetchOrderbook.mockResolvedValue(
      makeOrderbook({ midPrice: 0.1, bestBid: 0.099, bestAsk: 0.101 })
    );

    const now = Date.now();
    mockTradeAggregation.mockResolvedValue({
      records: [
        makeCandleRecord({
          timestamp: String(now - 86_400_000),
          open: "10",
          close: "12",
          counter_volume: "5000",
        }),
        makeCandleRecord({
          timestamp: String(now - 43_200_000),
          open: "12",
          close: "11",
          counter_volume: "3000",
        }),
      ],
    });

    const stats = await getMarketStats(USDC);
    expect(stats.volume24hXlm).toBe(8000); // 5000 + 3000
    // First open = 10, last close = 11 → (11-10)/10 * 100 = 10%
    expect(stats.change24hPct).toBeCloseTo(10, 5);
  });

  it("handles candle fetch failure gracefully", async () => {
    mockFetchOrderbook.mockResolvedValue(
      makeOrderbook({ midPrice: 0.1, bestBid: 0.099, bestAsk: 0.101 })
    );
    mockTradeAggregation.mockRejectedValue(new Error("Aggregation unavailable"));

    const stats = await getMarketStats(USDC);
    expect(stats.priceInXlm).toBe(0.1);
    expect(stats.volume24hXlm).toBe(0);
    expect(stats.change24hPct).toBeNull();
  });

  it("handles null midPrice from orderbook", async () => {
    mockFetchOrderbook.mockResolvedValue(
      makeOrderbook({ midPrice: null, bestBid: null, bestAsk: null, bids: [], asks: [] })
    );

    const stats = await getMarketStats(USDC);
    expect(stats.priceInXlm).toBeNull();
    expect(stats.volume24hXlm).toBe(0);
    expect(stats.change24hPct).toBeNull();
  });
});

// ── fetchTopAssets ──────────────────────────────────────────────────────
describe("fetchTopAssets", () => {
  it("maps Horizon assets to Tokens", async () => {
    mockAssets.mockResolvedValue({
      records: [
        {
          asset_code: "USDC",
          asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          asset_type: "credit_alphanum4",
        },
        {
          asset_code: "EURMTL",
          asset_issuer: "GACKTN5DAZGWXRWB2WLM6OPBDHAMT6SJNGLJZPQMEZBUR4JUGBX2UK7V",
          asset_type: "credit_alphanum4",
        },
      ],
    });

    const tokens = await fetchTopAssets(10);
    expect(tokens).toHaveLength(2);
    expect(tokens[0]!.code).toBe("USDC");
    expect(tokens[0]!.issuer).toBeDefined();
    expect(tokens[1]!.code).toBe("EURMTL");
  });

  it("handles native asset fallback for missing code", async () => {
    mockAssets.mockResolvedValue({
      records: [{ asset_type: "native" }],
    });

    const tokens = await fetchTopAssets(5);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]!.code).toBe("XLM");
  });
});

// ── getMarketStatsForTokens ─────────────────────────────────────────────
describe("getMarketStatsForTokens", () => {
  it("returns empty for no tokens", async () => {
    const result = await getMarketStatsForTokens([]);
    expect(result).toEqual([]);
  });

  it("collects stats when XLM is first (no Horizon needed)", async () => {
    mockFetchOrderbook.mockRejectedValue(new Error("Down"));
    const result = await getMarketStatsForTokens([XLM, USDC]);
    // XLM always succeeds (price = 1, no Horizon call)
    const xlmInResult = result.find((s) => s.token.code === "XLM");
    expect(xlmInResult).toBeDefined();
    expect(xlmInResult!.priceInXlm).toBe(1);
  });

  it("filters out rejected promises via allSettled", async () => {
    mockFetchOrderbook.mockRejectedValue(new Error("Down"));
    const result = await getMarketStatsForTokens([USDC]);
    expect(Array.isArray(result)).toBe(true);
  });
});
