import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/server/logger";

/**
 * Simple in-memory rate limiter keyed by IP + route prefix.
 * Production should replace this with a Redis-backed store, but for a
 * self-hosted DEX frontend the in-memory approach is sufficient and adds
 * zero external dependencies.
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60s so the map doesn't grow unbounded.
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

/**
 * Rate-limit API routes. Defaults:
 *  - 60 requests per 60 seconds for general API endpoints
 *  - 10 requests per 60 seconds for swap/quote (the most expensive route)
 */
export function rateLimitMiddleware(request: NextRequest) {
  cleanup();

  const path = request.nextUrl.pathname;
  const isSwapQuote = path === "/api/swap/quote";
  const maxRequests = isSwapQuote ? 10 : 60;
  const windowMs = 60_000;

  // Derive a client key from X-Forwarded-For or the connecting IP.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";
  const key = `${ip}:${path}`;

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return NextResponse.next();
  }

  entry.count++;
  if (entry.count > maxRequests) {
    logger.warn("rate limit exceeded", { ip, path, count: entry.count });
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)),
          "X-RateLimit-Limit": String(maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(maxRequests));
  response.headers.set("X-RateLimit-Remaining", String(maxRequests - entry.count));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
  return response;
}
