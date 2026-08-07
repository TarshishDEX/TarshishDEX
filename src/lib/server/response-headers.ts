/**
 * Response header utilities.
 * Applies security and performance headers consistently across API routes.
 */

/**
 * Apply standard security headers to a Response.
 * Returns the same Response with headers appended.
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Apply performance headers for CDN and browser caching.
 */
export function applyCacheHeaders(response: Response, maxAge: number): Response {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", `public, max-age=${maxAge}, s-maxage=${maxAge}`);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
