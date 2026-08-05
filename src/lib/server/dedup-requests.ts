/**
 * In-flight request deduplication.
 * When multiple identical requests arrive concurrently (e.g. same swap quote),
 * only one is forwarded to Horizon; the others wait for and share the result.
 */

const inFlight = new Map<string, Promise<unknown>>();

/**
 * Execute `fn` and deduplicate concurrent calls with the same key.
 * If a request with the same key is already in-flight, the promise is
 * shared. The map entry is cleaned up after the promise settles.
 */
export async function deduplicateByKey<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs = 5_000
): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fn();
  inFlight.set(key, promise);

  // Auto-cleanup after TTL or resolution
  const cleanup = () => {
    if (inFlight.get(key) === promise) {
      inFlight.delete(key);
    }
  };

  setTimeout(cleanup, ttlMs);

  try {
    const result = await promise;
    cleanup();
    return result;
  } catch (error) {
    cleanup();
    throw error;
  }
}

/** Get the number of currently in-flight deduplicated requests. */
export function getInflightCount(): number {
  return inFlight.size;
}
