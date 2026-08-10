/**
 * Fee collector for TarshishDEX swaps.
 * Collects a configurable fee in basis points on each executed swap.
 * Revenue mechanism: 5 bps default, configurable per route method.
 *
 * The fee collector address defaults to the project treasury but can be
 * overridden via NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS for deployments.
 */

const DEFAULT_FEE_BPS = 5;
const DEFAULT_FEE_COLLECTOR = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

/** Fee configuration per route method. */
export const ROUTE_FEES: Record<string, number> = {
  direct: 5,
  "multi-hop": 8,
  "path-finding": 5,
};

/** Get the fee in basis points for a route method. */
export function getFeeBps(method: string): number {
  return ROUTE_FEES[method] ?? DEFAULT_FEE_BPS;
}

/** Calculate the fee amount in the input asset units. */
export function calculateFee(amountIn: string, method: string): string {
  const bps = getFeeBps(method);
  const amount = Number(amountIn);
  if (amount <= 0 || bps <= 0) return "0";
  return ((amount * bps) / 10_000).toFixed(7);
}

/**
 * Fee collector destination address.
 * Configurable via NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS; falls back to the
 * project treasury on Testnet.
 */
export function getFeeCollector(): string {
  return process.env.NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS ?? DEFAULT_FEE_COLLECTOR;
}

export { DEFAULT_FEE_BPS };
