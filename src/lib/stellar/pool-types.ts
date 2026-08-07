import type { StellarAsset } from "@/lib/stellar/types";

/** A Stellar liquidity pool entry from Horizon. */
export interface LiquidityPool {
  id: string;
  feeBp: number;
  totalShares: string;
  totalTrustlines: number;
  reserves: PoolReserve[];
}

export interface PoolReserve {
  asset: string;
  amount: string;
}

/** Simplified pool for display purposes. */
export interface PoolSummary {
  id: string;
  base: StellarAsset;
  counter: StellarAsset;
  feeBp: number;
  baseReserve: number;
  counterReserve: number;
  midPrice: number | null;
  volume24h: number;
  tvl: number;
}

/** A swap route that uses liquidity pools (from Horizon path-finding). */
export interface PoolRoute {
  pools: string[];
  path: StellarAsset[];
  output: string;
  avgPrice: number;
}
