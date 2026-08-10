import { NextResponse, type NextRequest } from "next/server";

/**
 * Global middleware — applies security headers (CSP, HSTS, CORS, etc.) and
 * request tracing to all /api/* routes.
 *
 * Consolidates the previous split between middleware.ts and
 * lib/server/security.ts — all security headers live in one place now.
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;
  if (!url.startsWith("/api/")) return NextResponse.next();

  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const response = NextResponse.next();

  // ── Identity & tracing ────────────────────────────────────────────
  response.headers.set("X-Request-Id", requestId);

  // ── Security headers ──────────────────────────────────────────────
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://horizon-testnet.stellar.org https://horizon.stellar.org https://soroban-testnet.stellar.org https://soroban.stellar.org https://rpc-futurenet.stellar.org",
    ].join("; ")
  );

  // ── CORS (public API) ─────────────────────────────────────────────
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Request-Id, Authorization"
  );

  // ── HSTS (production only — HTTPS is assumed) ─────────────────────
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = { matcher: "/api/:path*" };
