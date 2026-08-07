/**
 * Simple in-memory query cache with TTL.
 * Caches API responses to reduce Horizon/RPC load for frequently
 * accessed data that doesn't change rapidly.
 */

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Get a cached value by key. Returns undefined if not found or expired.
 */
export function cacheGet<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

/**
 * Set a cached value with a TTL in milliseconds.
 */
export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, { value, expiry: Date.now() + ttlMs });
}

/** Remove a specific key from the cache. */
export function cacheDelete(key: string): void {
  cache.delete(key);
}

/** Clear the entire cache. Useful in tests. */
export function cacheClear(): void {
  cache.clear();
}

/** Get the current cache size. */
export function cacheSize(): number {
  return cache.size;
}
