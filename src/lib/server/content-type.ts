/**
 * Content-Type negotiation and validation utilities.
 */

/** Common content types used in API responses. */
export const CONTENT_TYPES = {
  JSON: "application/json; charset=utf-8",
  HTML: "text/html; charset=utf-8",
  PLAIN: "text/plain; charset=utf-8",
  CSV: "text/csv; charset=utf-8",
  EVENT_STREAM: "text/event-stream",
} as const;

/**
 * Check if the request accepts a given content type.
 * Basic implementation — for production consider a full content negotiation library.
 */
export function acceptsContentType(request: Request, contentType: string): boolean {
  const accept = request.headers.get("accept");
  if (!accept) return true;
  if (accept === "*/*") return true;
  return accept.includes(contentType.split(";")[0]!);
}

/** Set the Content-Type header on a Response. */
export function setContentType(response: Response, contentType: string): Response {
  const headers = new Headers(response.headers);
  headers.set("Content-Type", contentType);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
