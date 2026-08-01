import { describe, expect, it } from "vitest";
import {
  buildWarnings,
  computeMinReceived,
  computePriceImpact,
  simulateOrderbookFill,
} from "@/lib/stellar/simulation";
import type { OrderbookData, StellarAsset } from "@/lib/stellar/types";

const base: StellarAsset = { code: "XLM", isNative: true };
const counter: StellarAsset = { code: "USDC", issuer: "GISS" };

function makeOrderbook(asks: Array<[number, number]>): OrderbookData {
  return {
    base,
    counter,
    bids: [{ price: 0.9, amount: 100, value: 90 }],
    asks: asks.map(([price, amount]) => ({ price, amount, value: price * amount })),
    bestBid: 0.9,
    bestAsk: asks[0]?.[0] ?? null,
    midPrice: asks[0] ? (0.9 + asks[0][0]) / 2 : null,
    spreadPct: null,
  };
}

describe("simulateOrderbookFill", () => {
  it("fills an order fully within one level", () => {
    const ob = makeOrderbook([[1, 1000]]);
    const result = simulateOrderbookFill("10", ob);
    expect(result).not.toBeNull();
    expect(result!.output).toBe("10");
    expect(result!.fullyFilled).toBe(true);
    expect(result!.avgPrice).toBe(1);
  });

  it("walks multiple levels for larger orders", () => {
    const ob = makeOrderbook([
      [1, 10],
      [1.5, 10],
    ]);
    const result = simulateOrderbookFill("15", ob);
    expect(result!.output).toBe("17.5"); // 10*1 + 5*1.5
    expect(result!.fullyFilled).toBe(true);
  });

  it("reports partial fill when depth is insufficient", () => {
    const ob = makeOrderbook([[1, 5]]);
    const result = simulateOrderbookFill("10", ob);
    expect(result!.fullyFilled).toBe(false);
    expect(result!.output).toBe("5");
  });

  it("returns null when there are no asks", () => {
    const ob = makeOrderbook([]);
    expect(simulateOrderbookFill("10", ob)).toBeNull();
  });
});

describe("computePriceImpact", () => {
  it("computes impact relative to mid price", () => {
    // mid = 1.0, executed at 0.95 → 5% impact
    expect(computePriceImpact(0.95, 1.0)).toBeCloseTo(5, 5);
  });

  it("returns 0 when mid is unavailable", () => {
    expect(computePriceImpact(0.95, null)).toBe(0);
  });
});

describe("computeMinReceived", () => {
  it("applies slippage tolerance", () => {
    expect(computeMinReceived("100", 1)).toBe("99");
    expect(computeMinReceived("100", 0.5)).toBe("99.5");
    expect(computeMinReceived("100", 0)).toBe("100");
  });
});

describe("buildWarnings", () => {
  it("flags no liquidity", () => {
    const warnings = buildWarnings(null, 0, 1);
    expect(warnings[0]).toContain("No liquidity");
  });

  it("flags high price impact and slippage breach", () => {
    const fill = { output: "95", avgPrice: 0.95, fullyFilled: true };
    const warnings = buildWarnings(fill, 2.5, 1);
    expect(warnings.some((w) => w.includes("High price impact"))).toBe(true);
    expect(warnings.some((w) => w.includes("exceeds your slippage tolerance"))).toBe(true);
  });

  it("flags partial fill", () => {
    const fill = { output: "5", avgPrice: 1, fullyFilled: false };
    const warnings = buildWarnings(fill, 0, 1);
    expect(warnings.some((w) => w.includes("partially fill"))).toBe(true);
  });
});
