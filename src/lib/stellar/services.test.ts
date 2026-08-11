import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCall = vi.fn();
const mockStream = vi.fn();

vi.mock("@/lib/stellar/horizon", () => ({
  getHorizonServer: () => ({
    assets: () => ({
      limit: () => ({ forCode: () => ({ forIssuer: () => ({ call: mockCall }) }), call: mockCall }),
    }),
    operations: () => ({
      forAccount: () => ({ cursor: () => ({ stream: mockStream }) }),
    }),
    trades: () => ({
      forAssetPair: () => ({ cursor: () => ({ stream: mockStream }) }),
    }),
    liquidityPools: () => ({
      forAssets: () => ({ limit: () => ({ call: mockCall }) }),
    }),
  }),
}));

// ── catalog.ts ───────────────────────────────────────────────────────────
import { fetchAssetCatalog } from "@/lib/stellar/catalog";

describe("fetchAssetCatalog", () => {
  beforeEach(() => vi.clearAllMocks());

  const makeRecord = (overrides: Record<string, unknown> = {}) => ({
    asset_code: "USDC",
    asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    accounts: {
      authorized: 100,
      authorized_to_maintain_liabilities: 50,
      unauthorized: 10,
    },
    balances: {
      authorized: "1000000.0",
      authorized_to_maintain_liabilities: "500000.0",
      unauthorized: "10000.0",
    },
    num_claimable_balances: 5,
    num_liquidity_pools: 3,
    flags: {
      auth_required: false,
      auth_revocable: true,
      auth_immutable: false,
    },
    ...overrides,
  });

  it("fetches and maps asset catalog", async () => {
    mockCall.mockResolvedValue({ records: [makeRecord()] });
    const results = await fetchAssetCatalog(10);
    expect(results).toHaveLength(1);
    expect(results[0]!.token.code).toBe("USDC");
    expect(results[0]!.supply).toBeGreaterThan(0);
    expect(results[0]!.accounts).toBe(160);
    expect(results[0]!.trustlines).toBe(168); // 160 + 5 + 3
    expect(results[0]!.flags.authRevocable).toBe(true);
  });

  it("handles empty response", async () => {
    mockCall.mockResolvedValue({ records: [] });
    const results = await fetchAssetCatalog();
    expect(results).toEqual([]);
  });
});

// ── live.ts ──────────────────────────────────────────────────────────────
import { streamAccountOperations, streamTrades } from "@/lib/stellar/live";

describe("live streams", () => {
  beforeEach(() => vi.clearAllMocks());

  it("streamAccountOperations returns close function", () => {
    const closeFn = () => {};
    mockStream.mockReturnValue(closeFn);
    const result = streamAccountOperations("GSOURCE", () => {});
    expect(result).toBe(closeFn);
  });

  it("streamTrades returns close function", () => {
    const closeFn = () => {};
    mockStream.mockReturnValue(closeFn);
    const result = streamTrades(
      { code: "XLM", isNative: true },
      { code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" },
      () => {}
    );
    expect(result).toBe(closeFn);
  });
});

// ── pool-queries.ts ──────────────────────────────────────────────────────
import { buildPoolSummary } from "@/lib/stellar/pool-queries";
import type { LiquidityPool } from "@/lib/stellar/pool-types";

describe("buildPoolSummary", () => {
  const makePool = (): LiquidityPool => ({
    id: "pool-1",
    feeBp: 30,
    totalShares: "1000",
    totalTrustlines: "50",
    reserves: [
      { asset: "XLM", amount: "100000.0000000" },
      { asset: "USDC:GISS", amount: "9500.0000000" },
    ],
  });

  it("builds pool summary from reserves", () => {
    const summary = buildPoolSummary(makePool());
    expect(summary).not.toBeNull();
    expect(summary!.id).toBe("pool-1");
    expect(summary!.feeBp).toBe(30);
    expect(summary!.baseReserve).toBe(100000);
    expect(summary!.counterReserve).toBe(9500);
    expect(summary!.midPrice).toBeCloseTo(0.095, 5);
    expect(summary!.tvl).toBe(109500);
  });

  it("returns null for pools with < 2 reserves", () => {
    const pool = makePool();
    pool.reserves = [{ asset: "XLM", amount: "100" }];
    expect(buildPoolSummary(pool)).toBeNull();
  });

  it("returns null for zero reserves", () => {
    const pool = makePool();
    pool.reserves[0]!.amount = "0";
    expect(buildPoolSummary(pool)).toBeNull();
  });
});

// ── config.ts (additional tests) ────────────────────────────────────────
import { NETWORKS } from "@/lib/stellar/config";

describe("NETWORKS config", () => {
  it("has testnet and public entries", () => {
    expect(NETWORKS.testnet.name).toBe("testnet");
    expect(NETWORKS.public.name).toBe("public");
  });

  it("both networks have required URLs", () => {
    for (const net of [NETWORKS.testnet, NETWORKS.public]) {
      expect(net.horizonUrl).toContain("https://");
      expect(net.rpcUrl).toContain("https://");
      expect(net.passphrase).toBeTruthy();
    }
  });
});
