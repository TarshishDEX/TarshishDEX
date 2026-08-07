import { getHorizonServer } from "@/lib/stellar/horizon";
import type { PoolSummary, LiquidityPool } from "@/lib/stellar/pool-types";
import type { StellarAsset } from "@/lib/stellar/types";

/** Fetch all liquidity pools for a pair from Horizon. */
export async function fetchLiquidityPools(
  base: StellarAsset,
  counter: StellarAsset
): Promise<LiquidityPool[]> {
  const server = getHorizonServer();
  const response = await server
    .liquidityPools()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .forAssets([base.code, counter.code] as any)
    .limit(10)
    .call();
  return response.records.map((pool) => ({
    id: pool.id,
    feeBp: pool.fee_bp,
    totalShares: pool.total_shares,
    totalTrustlines: String(pool.total_trustlines),
    reserves: pool.reserves.map((r) => ({
      asset: String((r as unknown as { code?: string; asset?: string }).code ?? (r as unknown as { asset: string }).asset),
      amount: r.amount,
    })),
  }));
}

/** Build a pool summary from a raw Horizon pool record. */
export function buildPoolSummary(pool: LiquidityPool): PoolSummary | null {
  if (pool.reserves.length < 2) return null;
  const baseReserve = Number(pool.reserves[0].amount);
  const counterReserve = Number(pool.reserves[1].amount);
  if (baseReserve <= 0 || counterReserve <= 0) return null;
  return {
    id: pool.id,
    base: { code: pool.reserves[0].asset.split(":")[0] || "unknown" },
    counter: { code: pool.reserves[1].asset.split(":")[0] || "unknown" },
    feeBp: pool.feeBp,
    baseReserve,
    counterReserve,
    midPrice: counterReserve / baseReserve,
    volume24h: 0,
    tvl: baseReserve + counterReserve,
  };
}
