import type { Horizon } from "@stellar/stellar-sdk";
import { getHorizonServer } from "@/lib/stellar/horizon";
import { toSdkAsset } from "@/lib/stellar/asset";
import type { StellarAsset } from "@/lib/stellar/types";

/**
 * Real-time Horizon event streams (SSE). Each helper returns a close
 * function so React effects can clean up cleanly. The SDK's `.stream()`
 * call returns exactly that close function.
 */

/** Stream new operations for an account. Returns a close function. */
export function streamAccountOperations(address: string, onMessage: () => void): () => void {
  const server = getHorizonServer();
  return server
    .operations()
    .forAccount(address)
    .cursor("now")
    .stream({ onmessage: () => onMessage() });
}

/** Stream new trades for a base/counter pair, passing each record. Returns a close function. */
export function streamTradesRecords(
  base: StellarAsset,
  counter: StellarAsset,
  onMessage: (record: Horizon.ServerApi.TradeRecord) => void
): () => void {
  const server = getHorizonServer();
  return server
    .trades()
    .forAssetPair(toSdkAsset(base), toSdkAsset(counter))
    .cursor("now")
    .stream({ onmessage: onMessage });
}

/** Stream new trades for a base/counter pair. Returns a close function. */
export function streamTrades(
  base: StellarAsset,
  counter: StellarAsset,
  onMessage: () => void
): () => void {
  return streamTradesRecords(base, counter, () => onMessage());
}
