import { describe, it, expect } from "vitest";
import type {
  StellarAsset,
  Token,
  OrderbookLevel,
  OrderbookData,
  OrderbookFill,
  SwapRoute,
  Candle,
  MarketStats,
} from "@/lib/stellar/types";

describe("Stellar types (compile-time shape verification)", () => {
  it("StellarAsset accepts native XLM", () => {
    const asset: StellarAsset = {
      code: "XLM",
      isNative: true,
    };
    expect(asset.code).toBe("XLM");
    expect(asset.isNative).toBe(true);
  });

  it("StellarAsset accepts issued token", () => {
    const asset: StellarAsset = {
      code: "USDC",
      issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    };
    expect(asset.code).toBe("USDC");
    expect(asset.issuer).toBeDefined();
  });

  it("Token extends StellarAsset with display metadata", () => {
    const token: Token = {
      code: "EURMTL",
      issuer: "GACKTN5DAZGWXRWB2WLM6OPBDHAMT6SJNGLJZPQMEZBUR4JUGBX2UK7V",
      name: "EURMTL",
      decimals: 7,
      icon: "https://example.com/eurmtl.png",
      domain: "eurmtl.me",
    };
    expect(token.name).toBe("EURMTL");
    expect(token.decimals).toBe(7);
    expect(token.icon).toBeDefined();
    expect(token.domain).toBe("eurmtl.me");
  });

  it("Token icon and domain are optional", () => {
    const token: Token = {
      code: "XLM",
      isNative: true,
      name: "Stellar Lumens",
      decimals: 7,
    };
    expect(token.icon).toBeUndefined();
    expect(token.domain).toBeUndefined();
  });

  it("OrderbookLevel holds price/amount/value", () => {
    const level: OrderbookLevel = {
      price: 0.12,
      amount: 5000,
      value: 600,
    };
    expect(level.price).toBeCloseTo(0.12);
    expect(level.amount).toBe(5000);
    expect(level.value).toBe(600);
  });

  it("OrderbookData contains bids/asks and computed fields", () => {
    const data: OrderbookData = {
      base: { code: "XLM", isNative: true },
      counter: { code: "USDC", issuer: "G..." },
      bids: [{ price: 0.11, amount: 1000, value: 110 }],
      asks: [{ price: 0.12, amount: 2000, value: 240 }],
      bestBid: 0.11,
      bestAsk: 0.12,
      midPrice: 0.115,
      spreadPct: 8.7,
    };
    expect(data.bids).toHaveLength(1);
    expect(data.asks).toHaveLength(1);
    expect(data.bestBid).toBe(0.11);
    expect(data.bestAsk).toBe(0.12);
    expect(data.midPrice).toBeCloseTo(0.115);
    expect(data.spreadPct).toBeCloseTo(8.7);
  });

  it("OrderbookFill indicates whether order was fully filled", () => {
    const fill: OrderbookFill = {
      output: "9500",
      avgPrice: 0.105,
      fullyFilled: true,
    };
    expect(fill.fullyFilled).toBe(true);
    expect(fill.output).toBe("9500");
  });

  it("OrderbookFill tracks partial fills", () => {
    const fill: OrderbookFill = {
      output: "4500",
      avgPrice: 0.11,
      fullyFilled: false,
    };
    expect(fill.fullyFilled).toBe(false);
  });

  it("SwapRoute has all routing metadata", () => {
    const route: SwapRoute = {
      path: [
        { code: "XLM", isNative: true },
        { code: "USDC", issuer: "G..." },
      ],
      sourceAmount: "100",
      outputAmount: "92.5",
      executionPrice: 0.925,
      priceImpactPct: 0.15,
      minReceived: "91.57",
      feeEstimateXlm: "0.00001",
      slippagePct: 1,
      method: "multi-hop",
      warnings: ["Low liquidity on second hop"],
    };
    expect(route.path).toHaveLength(2);
    expect(route.method).toBe("multi-hop");
    expect(route.warnings).toHaveLength(1);
    expect(route.priceImpactPct).toBe(0.15);
  });

  it("SwapRoute supports direct path", () => {
    const route: SwapRoute = {
      path: [
        { code: "XLM", isNative: true },
        { code: "USDC", issuer: "G..." },
      ],
      sourceAmount: "100",
      outputAmount: "93",
      executionPrice: 0.93,
      priceImpactPct: 0.05,
      minReceived: "92.07",
      feeEstimateXlm: "0.00001",
      slippagePct: 0.5,
      method: "direct",
      warnings: [],
    };
    expect(route.method).toBe("direct");
    expect(route.warnings).toHaveLength(0);
  });

  it("Candle matches OHLCV format", () => {
    const candle: Candle = {
      timestamp: 1700000000,
      open: 0.12,
      high: 0.125,
      low: 0.118,
      close: 0.122,
      volumeBase: 50000,
      volumeCounter: 6000,
      tradeCount: 42,
    };
    expect(candle.open).toBe(0.12);
    expect(candle.close).toBe(0.122);
    expect(candle.high).toBeGreaterThanOrEqual(candle.low);
    expect(candle.volumeBase).toBe(50000);
    expect(candle.tradeCount).toBe(42);
  });

  it("MarketStats holds token and price data", () => {
    const stats: MarketStats = {
      token: {
        code: "USDC",
        issuer: "G...",
        name: "USD Coin",
        decimals: 7,
      },
      priceInXlm: 10.5,
      volume24hXlm: 1500000,
      change24hPct: 2.3,
      bestBid: 10.49,
      bestAsk: 10.51,
    };
    expect(stats.priceInXlm).toBe(10.5);
    expect(stats.volume24hXlm).toBe(1500000);
    expect(stats.change24hPct).toBe(2.3);
    expect(stats.bestBid).toBeLessThan(stats.bestAsk!);
  });

  it("MarketStats handles null prices for unknown tokens", () => {
    const stats: MarketStats = {
      token: {
        code: "UNKNOWN",
        issuer: "G...",
        name: "Unknown Token",
        decimals: 7,
      },
      priceInXlm: null,
      volume24hXlm: 0,
      change24hPct: null,
      bestBid: null,
      bestAsk: null,
    };
    expect(stats.priceInXlm).toBeNull();
    expect(stats.bestBid).toBeNull();
    expect(stats.bestAsk).toBeNull();
  });
});
