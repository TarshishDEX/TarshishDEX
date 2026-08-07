import { NextResponse, type NextRequest } from "next/server";

/**
 * Global middleware — applies security headers, CORS, and request
 * logging to all /api/* routes.
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;
  if (!url.startsWith("/api/")) return NextResponse.next();

  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Request-Id", requestId);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, X-Request-Id, Authorization");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  return response;
}

export const config = { matcher: "/api/:path*" };
