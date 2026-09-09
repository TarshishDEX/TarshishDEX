import BigNumber from "bignumber.js";
import { getHorizonServer } from "@/lib/stellar/horizon";
import { fromSdkAsset, toSdkAsset } from "@/lib/stellar/asset";
import type { OrderbookData, OrderbookLevel, StellarAsset } from "@/lib/stellar/types";

/** Horizon orderbook levels expose price + amount; value is derived. */
interface HorizonLevel {
  price: string;
  amount: string;
}

function toLevel(level: HorizonLevel): OrderbookLevel {
  const price = Number(level.price);
  const amount = Number(level.amount);
  return { price, amount, value: price * amount };
}

/**
 * TTL for cached orderbook snapshots (ms). Kept short — the SSE stream
 * invalidates live views — but long enough to dedupe the repeated fetches
 * that routing performs for the same pair in one quote computation.
 */
const ORDERBOOK_CACHE_TTL_MS = 3_000;

interface OrderbookCacheEntry {
  promise: Promise<OrderbookData>;
  expiresAt: number;
}

const orderbookCache = new Map<string, OrderbookCacheEntry>();

function cacheKey(selling: StellarAsset, buying: StellarAsset, limit: number): string {
  return `${selling.code}:${selling.issuer ?? ""}:${buying.code}:${buying.issuer ?? ""}:${limit}`;
}

/** Clear the in-memory orderbook cache (tests / forced refresh). */
export function clearOrderbookCache(): void {
  orderbookCache.clear();
}

/** Fetch and normalize the orderbook for a base/counter pair. */
export async function fetchOrderbook(
  selling: StellarAsset,
  buying: StellarAsset,
  limit = 50
): Promise<OrderbookData> {
  const key = cacheKey(selling, buying, limit);
  const now = Date.now();
  const cached = orderbookCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  // Cache the promise, not just the result, so concurrent callers (routing
  // evaluates direct + bridge legs in parallel) share a single Horizon call.
  const promise = fetchOrderbookUncached(selling, buying, limit);
  orderbookCache.set(key, { promise, expiresAt: now + ORDERBOOK_CACHE_TTL_MS });
  try {
    return await promise;
  } catch (error) {
    // Never cache failures — drop the entry so the next call retries.
    orderbookCache.delete(key);
    throw error;
  }
}

async function fetchOrderbookUncached(
  selling: StellarAsset,
  buying: StellarAsset,
  limit: number
): Promise<OrderbookData> {
  const server = getHorizonServer();
  const response = await server
    .orderbook(toSdkAsset(selling), toSdkAsset(buying))
    .limit(limit)
    .call();

  const bids = response.bids.map(toLevel);
  const asks = response.asks.map(toLevel);

  const bestBid = bids.length > 0 ? bids[0]!.price : null;
  const bestAsk = asks.length > 0 ? asks[0]!.price : null;
  const midPrice =
    bestBid !== null && bestAsk !== null
      ? Number(new BigNumber(bestBid.toString()).plus(bestAsk.toString()).dividedBy(2).toString())
      : null;
  const spreadPct =
    bestBid !== null && bestAsk !== null && bestBid > 0
      ? Number(
          new BigNumber(bestAsk.toString())
            .minus(bestBid.toString())
            .dividedBy(bestBid.toString())
            .times(100)
            .toString()
        )
      : null;

  return {
    base: fromSdkAsset(response.base),
    counter: fromSdkAsset(response.counter),
    bids,
    asks,
    bestBid,
    bestAsk,
    midPrice,
    spreadPct,
  };
}
