/**
 * Request body size limits.
 * Prevents memory exhaustion from oversized request payloads.
 */

/** Maximum JSON body size: 1MB. */
export const MAX_JSON_BODY_SIZE = 1_048_576;

/** Maximum URL-encoded body size: 256KB. */
export const MAX_URLENCODED_BODY_SIZE = 262_144;

/**
 * Check if a Content-Length header exceeds the configured limit.
 * Returns true if the body is within the limit.
 */
export function isBodyWithinLimit(
  contentLength: string | null,
  maxSize: number = MAX_JSON_BODY_SIZE
): boolean {
  if (!contentLength) return true; // No Content-Length — assume streaming
  const length = parseInt(contentLength, 10);
  return !isNaN(length) && length <= maxSize;
}
