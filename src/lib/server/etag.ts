/**
 * ETag generation and validation utilities.
 * Enables conditional requests (304 Not Modified) for API responses.
 */

/**
 * Generate a weak ETag from a value.
 * Uses a simple hash approach — for production, consider a proper
 * hashing function like SHA-256 for larger payloads.
 */
export function generateETag(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `W/"${Math.abs(hash).toString(36)}"`;
}

/**
 * Check if an ETag matches the If-None-Match request header.
 * Returns true if the content hasn't changed (304 should be returned).
 */
export function etagMatches(etag: string, ifNoneMatch: string | null): boolean {
  if (!ifNoneMatch) return false;
  // Support both weak and strong ETags
  const normalized = ifNoneMatch.replace(/^W\//, "");
  const normalizedEtag = etag.replace(/^W\//, "");
  return normalized === normalizedEtag || ifNoneMatch === "*";
}
