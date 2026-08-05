import { NextResponse, type NextRequest } from "next/server";
import { rateLimitMiddleware } from "@/lib/server/rate-limit";
import { logger } from "@/lib/server/logger";

/**
 * Next.js Edge middleware — applies rate limiting, security headers, and
 * CORS to all /api/* routes. Runs at the edge for minimal latency.
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;

  // Only apply middleware to API routes
  if (!url.startsWith("/api/")) {
    return NextResponse.next();
  }

  const start = Date.now();

  // Generate request ID using cryptographically secure random UUID
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  // Rate limit check
  const rateLimitResult = rateLimitMiddleware(request);
  if (rateLimitResult.status === 429) {
    return rateLimitResult;
  }

  // Build response with security headers
  const response = NextResponse.next();

  response.headers.set("X-Request-Id", requestId);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // CORS for API routes
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Request-Id, Authorization"
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  const elapsed = Date.now() - start;
  logger.debug("middleware processed", { path: url, elapsedMs: elapsed, reqId: requestId });

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
