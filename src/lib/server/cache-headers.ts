/**
 * Cache-Control header builders for API responses.
 * Helps CDNs and browsers cache appropriately based on data freshness.
 */

interface CachePolicy {
  maxAgeSec: number;
  staleWhileRevalidateSec?: number;
  staleIfErrorSec?: number;
  isPublic?: boolean;
}

/**
 * Build a Cache-Control header value from a policy.
 * Uses stale-while-revalidate for data that can be served slightly stale
 * while a background refresh happens.
 */
export function buildCacheControl(policy: CachePolicy): string {
  const directives: string[] = [];

  directives.push(policy.isPublic !== false ? "public" : "private");
  directives.push(`max-age=${policy.maxAgeSec}`);

  if (policy.staleWhileRevalidateSec) {
    directives.push(`stale-while-revalidate=${policy.staleWhileRevalidateSec}`);
  }

  if (policy.staleIfErrorSec) {
    directives.push(`stale-if-error=${policy.staleIfErrorSec}`);
  }

  return directives.join(", ");
}

/** Short-lived cache for market data that changes frequently. */
export const MARKET_DATA_CACHE: CachePolicy = {
  maxAgeSec: 15,
  staleWhileRevalidateSec: 30,
  staleIfErrorSec: 60,
  isPublic: true,
};

/** Medium cache for asset catalog data (changes infrequently). */
export const ASSET_CATALOG_CACHE: CachePolicy = {
  maxAgeSec: 60,
  staleWhileRevalidateSec: 120,
  staleIfErrorSec: 300,
  isPublic: true,
};

/** Long cache for health checks. */
export const HEALTH_CACHE: CachePolicy = {
  maxAgeSec: 30,
  isPublic: true,
};

/** No caching for user-specific data. */
export const NO_CACHE: CachePolicy = {
  maxAgeSec: 0,
  isPublic: false,
};
