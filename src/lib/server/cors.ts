import { NextResponse, type NextRequest } from "next/server";

/**
 * Apply CORS headers to API responses.
 * Allows GET and OPTIONS requests from any origin for public API endpoints.
 */
export function corsMiddleware(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin") ?? "*";

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, X-Request-Id, Authorization");
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}

/** Handle CORS preflight requests. */
export function handleCorsPreflight(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Request-Id, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
