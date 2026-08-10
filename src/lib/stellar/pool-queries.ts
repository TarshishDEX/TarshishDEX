import { Asset } from "@stellar/stellar-sdk";
import { getHorizonServer } from "@/lib/stellar/horizon";
import type { PoolSummary, LiquidityPool } from "@/lib/stellar/pool-types";
import type { StellarAsset } from "@/lib/stellar/types";

function toSdkAssetForPool(a: StellarAsset): Asset {
  return a.isNative || (!a.issuer && a.code === "XLM")
    ? Asset.native()
    : new Asset(a.code, a.issuer ?? "");
}

/** Fetch all liquidity pools for a pair from Horizon. */
export async function fetchLiquidityPools(
  base: StellarAsset,
  counter: StellarAsset
): Promise<LiquidityPool[]> {
  const server = getHorizonServer();
  // Pass both base and counter assets to filter pools containing either asset.
  // This ensures we find pools regardless of which side was used as the primary filter.
  const response = await server
    .liquidityPools()
    .forAssets(toSdkAssetForPool(base), toSdkAssetForPool(counter))
    .limit(10)
    .call();
  return response.records.map((pool) => ({
    id: pool.id,
    feeBp: pool.fee_bp,
    totalShares: pool.total_shares,
    totalTrustlines: String(pool.total_trustlines),
    reserves: pool.reserves.map((r) => ({
      asset:
        "code" in (r as unknown as Record<string, unknown>)
          ? String((r as unknown as { code: string }).code)
          : String(r.asset),
      amount: r.amount,
    })),
  }));
}

/** Build a pool summary from a raw Horizon pool record. */
export function buildPoolSummary(pool: LiquidityPool): PoolSummary | null {
  if (pool.reserves.length < 2) return null;
  const r0 = pool.reserves[0]!;
  const r1 = pool.reserves[1]!;
  const baseReserve = Number(r0.amount);
  const counterReserve = Number(r1.amount);
  if (baseReserve <= 0 || counterReserve <= 0) return null;
  return {
    id: pool.id,
    base: { code: r0.asset.split(":")[0] || "unknown" },
    counter: { code: r1.asset.split(":")[0] || "unknown" },
    feeBp: pool.feeBp,
    baseReserve,
    counterReserve,
    midPrice: counterReserve / baseReserve,
    volume24h: 0,
    tvl: baseReserve + counterReserve,
  };
}
