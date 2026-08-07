import { createHash } from "crypto";

/**
 * Generate a weak ETag from response data for conditional requests.
 * Clients send If-None-Match with the last ETag they received; if the
 * data hasn't changed, we return 304 Not Modified.
 */

/**
 * Compute a SHA-256 based ETag for response data.
 * The ETag is a hex digest of the JSON-serialized data.
 */
export function computeETag(data: unknown): string {
  const json = typeof data === "string" ? data : JSON.stringify(data);
  return createHash("sha256").update(json).digest("hex").slice(0, 16);
}

/**
 * Check if the client's If-None-Match header matches the current ETag.
 * Returns true if we should send a 304 Not Modified response.
 */
export function isNotModified(request: Request, currentETag: string): boolean {
  const ifNoneMatch = request.headers.get("if-none-match");
  if (!ifNoneMatch) return false;

  // Handle multiple ETags in the header
  const tags = ifNoneMatch.split(",").map((t) => t.trim().replace(/^W\//, ""));
  return tags.includes(currentETag);
}

/**
 * Apply ETag and Cache-Control headers to a response.
 * Returns a 304 Not Modified if the client already has the latest version.
 */
export function applyETag(request: Request, response: Response, data: unknown): Response {
  const etag = computeETag(data);

  if (isNotModified(request, etag)) {
    return new Response(null, { status: 304, headers: response.headers });
  }

  response.headers.set("ETag", `"${etag}"`);
  return response;
}
