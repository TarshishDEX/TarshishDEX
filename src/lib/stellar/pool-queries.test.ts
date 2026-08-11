import { describe, it, expect } from "vitest";
import { buildPoolSummary } from "@/lib/stellar/pool-queries";
import type { LiquidityPool } from "@/lib/stellar/pool-types";

function makePool(overrides: Partial<LiquidityPool> = {}): LiquidityPool {
  return {
    id: "pool-1",
    feeBp: 30,
    totalShares: "1000",
    totalTrustlines: "50",
    reserves: [
      { asset: "XLM:native", amount: "10000.0" },
      { asset: "USDC:GA5Z...", amount: "1250.0" },
    ],
    ...overrides,
  };
}

describe("buildPoolSummary", () => {
  it("builds a summary from a valid pool", () => {
    const summary = buildPoolSummary(makePool());
    expect(summary).not.toBeNull();
    expect(summary!.id).toBe("pool-1");
    expect(summary!.feeBp).toBe(30);
    expect(summary!.baseReserve).toBe(10000);
    expect(summary!.counterReserve).toBe(1250);
    expect(summary!.midPrice).toBe(0.125); // 1250/10000
    expect(summary!.tvl).toBe(11250);
  });

  it("extracts asset codes from reserve asset strings", () => {
    const summary = buildPoolSummary(makePool());
    expect(summary!.base.code).toBe("XLM");
    expect(summary!.counter.code).toBe("USDC");
  });

  it("returns null when fewer than 2 reserves", () => {
    const pool = makePool({
      reserves: [{ asset: "XLM:native", amount: "10000.0" }],
    });
    expect(buildPoolSummary(pool)).toBeNull();
  });

  it("returns null when base reserve is zero", () => {
    const pool = makePool({
      reserves: [
        { asset: "XLM:native", amount: "0" },
        { asset: "USDC:GA5Z...", amount: "1250.0" },
      ],
    });
    expect(buildPoolSummary(pool)).toBeNull();
  });

  it("returns null when counter reserve is negative", () => {
    const pool = makePool({
      reserves: [
        { asset: "XLM:native", amount: "10000.0" },
        { asset: "USDC:GA5Z...", amount: "-1250.0" },
      ],
    });
    expect(buildPoolSummary(pool)).toBeNull();
  });

  it("handles asset strings without colon separator", () => {
    const pool = makePool({
      reserves: [
        { asset: "native", amount: "10000.0" },
        { asset: "USDC", amount: "1250.0" },
      ],
    });
    const summary = buildPoolSummary(pool);
    expect(summary!.counter.code).toBe("USDC");
  });

  it("sets volume24h to 0 (placeholder)", () => {
    const summary = buildPoolSummary(makePool());
    expect(summary!.volume24h).toBe(0);
  });
});
