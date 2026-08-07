import { NextResponse, type NextRequest } from "next/server";

interface RateLimitStore {
  [ip: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute per IP

/** Clean up expired entries periodically. */
setInterval(() => {
  const now = Date.now();
  for (const key of Object.keys(store)) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 60_000);

/**
 * Apply rate limiting to API requests based on client IP.
 * Returns a 429 response if the limit is exceeded.
 */
export function rateLimitMiddleware(request: NextRequest): NextResponse | null {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();

  if (!store[ip] || store[ip].resetTime < now) {
    store[ip] = { count: 1, resetTime: now + WINDOW_MS };
    return null;
  }

  store[ip].count++;

  if (store[ip].count > MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", retryAfter: Math.ceil((store[ip].resetTime - now) / 1000) },
      { status: 429, headers: { "Retry-After": String(Math.ceil((store[ip].resetTime - now) / 1000)) } }
    );
  }

  return null;
}
