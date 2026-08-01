import { describe, expect, it } from "vitest";
import { selectBestRoute } from "@/lib/stellar/routing";
import type { SwapRoute } from "@/lib/stellar/types";

function makeRoute(overrides: Partial<SwapRoute>): SwapRoute {
  return {
    path: [
      { code: "XLM", isNative: true },
      { code: "USDC", issuer: "GISS" },
    ],
    sourceAmount: "10",
    outputAmount: "9.5",
    executionPrice: 0.95,
    priceImpactPct: 0.5,
    minReceived: "9.4",
    feeEstimateXlm: "0.00002",
    slippagePct: 1,
    method: "direct",
    warnings: [],
    ...overrides,
  };
}

describe("selectBestRoute", () => {
  it("returns null for no routes", () => {
    expect(selectBestRoute([])).toBeNull();
  });

  it("picks the route with the highest output", () => {
    const direct = makeRoute({ outputAmount: "9.5", method: "direct" });
    const multiHop = makeRoute({
      outputAmount: "10.2",
      method: "multi-hop",
      path: [
        { code: "XLM", isNative: true },
        { code: "USDC", issuer: "GISS" },
        { code: "USDT", issuer: "GIS2" },
      ],
    });
    expect(selectBestRoute([direct, multiHop])).toBe(multiHop);
  });

  it("tie-breaks by fewer hops", () => {
    const direct = makeRoute({ outputAmount: "10", method: "direct" });
    const multiHop = makeRoute({
      outputAmount: "10",
      method: "multi-hop",
      path: [
        { code: "XLM", isNative: true },
        { code: "USDC", issuer: "GISS" },
        { code: "USDT", issuer: "GIS2" },
      ],
    });
    expect(selectBestRoute([multiHop, direct])).toBe(direct);
  });

  it("treats sub-epsilon float differences as ties", () => {
    // 1e-13 difference is below the 1e-12 epsilon → tie → fewer hops wins
    const a = makeRoute({ outputAmount: "10.0000000000001" });
    const b = makeRoute({
      outputAmount: "10",
      method: "multi-hop",
      path: [
        { code: "XLM", isNative: true },
        { code: "USDC", issuer: "GISS" },
        { code: "USDT", issuer: "GIS2" },
      ],
    });
    expect(selectBestRoute([a, b])).toBe(a);
  });
});
