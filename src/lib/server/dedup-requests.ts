/**
 * Request deduplication utility.
 * Prevents duplicate in-flight API calls for the same parameters
 * by returning a shared promise for identical concurrent requests.
 */

const inflight = new Map<string, Promise<unknown>>();

/**
 * Deduplicate an async function call by key.
 * If a call with the same key is already in-flight, returns the
 * existing promise instead of starting a new one.
 */
export async function deduplicate<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs = 30_000
): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => {
    setTimeout(() => inflight.delete(key), ttlMs);
  });

  inflight.set(key, promise);
  return promise;
}

/** Clear all deduplication entries. Useful in tests. */
export function clearDedupCache(): void {
  inflight.clear();
}
