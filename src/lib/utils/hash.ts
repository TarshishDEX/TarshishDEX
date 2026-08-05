/**
 * Simple non-cryptographic hash functions for caching keys and
 * deterministic colors.
 */

/** djb2 hash — fast, non-cryptographic, good distribution. */
export function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0; // Force 32-bit
  }
  return hash >>> 0; // Unsigned 32-bit
}

/** Create a short hex hash of a string for cache key purposes. */
export function shortHash(str: string, length = 8): string {
  return Math.abs(djb2(str)).toString(16).padStart(length, "0").slice(0, length);
}

/** Combine multiple strings into a stable cache key. */
export function cacheKey(...parts: string[]): string {
  return parts.map((p) => p || "_").join("::");
}
