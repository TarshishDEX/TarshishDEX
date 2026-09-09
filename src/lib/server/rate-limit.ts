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

/** Default per-IP API limit — shared with the edge middleware. */
export const DEFAULT_API_RATE_LIMIT = { maxRequests: 100, windowMs: 60_000 } as const;

/**
 * Stricter limit for expensive quote endpoints. Computing a quote hits
 * Horizon path-finding plus several orderbooks, so quote routes are
 * throttled harder than the default API limit.
 */
export const STRICTER_QUOTE_RATE_LIMIT = { maxRequests: 30, windowMs: 60_000 } as const;

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

import { shortHash } from "@/lib/utils/hash";

/**
 * Extract a stable client identifier from request headers.
 *
 * `x-forwarded-for` is entirely client-controlled — an attacker can send
 * any value, so its FIRST entry (the previous behaviour) is trivially
 * spoofable and lets anyone rotate identifiers to bypass rate limits.
 *
 * The identifier is built from the most trustworthy source available:
 * 1. `x-real-ip` — set/overwritten by the hosting proxy (Vercel, nginx)
 *    with the true client IP; client-supplied values do not survive it.
 * 2. The RIGHTMOST entry of `x-forwarded-for` — the one appended by the
 *    proxy closest to the server (Vercel appends the real client IP to
 *    the end of any client-supplied list), so left-side spoofing cannot
 *    change the identifier.
 * 3. A stable hash of user-agent + accept-language so limits still bind
 *    *something* per client when no proxy headers exist (local dev).
 */
export function getClientId(request: Request): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const entries = forwarded
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    const proxied = entries[entries.length - 1];
    if (proxied) return proxied;
  }

  const ua = request.headers.get("user-agent") ?? "";
  const lang = request.headers.get("accept-language") ?? "";
  if (!ua && !lang) return "unknown";
  return shortHash(`${ua}|${lang}`);
}
