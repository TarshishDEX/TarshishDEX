/**
 * Compression middleware configuration.
 * Next.js handles gzip/brotli automatically via the `compress` config
 * but this utility helps API routes apply compression conditionally.
 */

/** Minimum response size in bytes to apply compression. */
export const COMPRESSION_MIN_SIZE = 1024;

/** Content types that benefit from compression. */
export const COMPRESSIBLE_TYPES = [
  "application/json",
  "application/javascript",
  "text/css",
  "text/html",
  "text/plain",
  "text/xml",
  "application/xml",
];

/** Check if a response should be compressed based on content type and size. */
export function shouldCompress(contentType: string | null, contentLength: number): boolean {
  if (contentLength < COMPRESSION_MIN_SIZE) return false;
  if (!contentType) return false;
  return COMPRESSIBLE_TYPES.some((t) => contentType.startsWith(t));
}
