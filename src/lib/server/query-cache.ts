/**
 * Simple in-memory query cache for server-side API routes.
 * Caches Horizon responses with a TTL to reduce redundant RPC calls.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/** Store a value in the cache with a TTL in milliseconds. */
export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/** Retrieve a value from the cache. Returns null if expired or missing. */
export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

/** Invalidate a specific cache key. */
export function cacheInvalidate(keyPattern: string): void {
  for (const key of store.keys()) {
    if (key.includes(keyPattern)) store.delete(key);
  }
}

/** Clear the entire cache. */
export function cacheClear(): void {
  store.clear();
}

/** Get cache stats for monitoring. */
export function cacheStats(): { size: number; keys: string[] } {
  return { size: store.size, keys: Array.from(store.keys()) };
}

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) store.delete(key);
  }
}, 60_000).unref?.();
