import { describe, it, expect } from "vitest";
import { getMarketStatsForTokens } from "@/lib/stellar/prices";
import type { MarketStats, Token } from "@/lib/stellar/types";

const XLM: Token = { code: "XLM", name: "Lumen", decimals: 7, isNative: true };
const USDC: Token = {
  code: "USDC",
  name: "USD Coin",
  decimals: 7,
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};

function makeStats(token: Token, overrides: Partial<MarketStats> = {}): MarketStats {
  return {
    token,
    priceInXlm: 10,
    volume24hXlm: 1000,
    change24hPct: 2.5,
    bestBid: 9.9,
    bestAsk: 10.1,
    ...overrides,
  };
}

describe("getMarketStatsForTokens", () => {
  it("returns empty array for no tokens", async () => {
    const result = await getMarketStatsForTokens([]);
    expect(result).toEqual([]);
  });

  it("collects stats for multiple tokens", async () => {
    // This calls the real getMarketStats which hits Horizon.
    // In CI without Horizon, it will return empty results gracefully.
    const result = await getMarketStatsForTokens([XLM, USDC]);
    // XLM should always return stats (priced at 1)
    const xlmStat = result.find((s) => s.token.code === "XLM");
    expect(xlmStat).toBeDefined();
    if (xlmStat) {
      expect(xlmStat.priceInXlm).toBe(1);
    }
  });
});
