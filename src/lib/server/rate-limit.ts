/**
 * In-memory rate limiter for API routes.
 *
 * Uses a sliding-window approach: each IP gets `maxRequests` tokens per
 * `windowMs`. Once exhausted, requests return 429 until the window slides.
 *
 * Production note: replace with Redis-based limiter (e.g. Upstash) when
 * running across multiple instances.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/** Periodic cleanup — remove expired entries every 5 minutes. */
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export interface RateLimitOptions {
  /** Maximum number of requests allowed in the window. */
  maxRequests: number;
  /** Window duration in milliseconds. */
  windowMs: number;
  /** Optional key prefix for namespacing (e.g. per-route). */
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check whether a request identified by `key` (typically IP) is rate-limited.
 * Returns metadata for setting `X-RateLimit-*` headers.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  cleanup();
  const { maxRequests, windowMs, keyPrefix = "rl" } = options;
  const fullKey = `${keyPrefix}:${key}`;
  const now = Date.now();

  const entry = store.get(fullKey);
  if (!entry || now > entry.resetAt) {
    // Fresh window
    store.set(fullKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  entry.count += 1;
  const remaining = Math.max(0, maxRequests - entry.count);
  return {
    allowed: entry.count <= maxRequests,
    remaining,
    resetAt: entry.resetAt,
  };
}

/** Reset the rate limit store (for testing). */
export function resetRateLimitStore(): void {
  store.clear();
}

/**
 * Extract a stable client identifier from request headers.
 * Falls back to IP when x-forwarded-for is unavailable (e.g. dev).
 */
export function getClientId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for may contain multiple IPs; use the first (client).
    return forwarded.split(",")[0]!.trim();
  }
  // Fallback: use x-real-ip or a hash of user-agent + accept-language
  const realIp = request.headers.get("x-real-ip");
  return realIp ?? "unknown";
}
