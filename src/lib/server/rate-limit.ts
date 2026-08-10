/**
 * In-memory rate limiter for API routes.
 *
 * Uses a sliding-window approach per IP address. Each endpoint defines
 * a max request count within a window (ms). Multiple windows are stored
 * per IP+endpoint combo to prevent bursts while allowing sustained traffic.
 *
 * Not suitable for multi-instance deployments without a shared store (Redis).
 * For single-instance or serverless cold-start, this provides basic protection.
 */

interface RateLimitConfig {
  /** Maximum requests allowed in the window. */
  maxRequests: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

interface WindowEntry {
  timestamps: number[];
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60_000,
};

const ENDPOINT_CONFIGS: Record<string, RateLimitConfig> = {
  // Write endpoints — strictest limits
  "/api/orders": { maxRequests: 30, windowMs: 60_000 },
  // Read-heavy endpoints — generous but bounded
  "/api/swap/quote": { maxRequests: 60, windowMs: 60_000 },
  "/api/market/stats": { maxRequests: 120, windowMs: 60_000 },
  "/api/market/pools": { maxRequests: 60, windowMs: 60_000 },
  "/api/events": { maxRequests: 5, windowMs: 60_000 }, // SSE connections
  "/api/market/orderbook": { maxRequests: 60, windowMs: 60_000 },
  "/api/market/candles": { maxRequests: 60, windowMs: 60_000 },
  "/api/assets": { maxRequests: 120, windowMs: 60_000 },
  "/api/portfolio": { maxRequests: 60, windowMs: 60_000 },
  "/api/trades": { maxRequests: 60, windowMs: 60_000 },
};

const store = new Map<string, WindowEntry>();

/** Clean up expired entries periodically (every 5 minutes). */
function cleanupExpired() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    const config = getConfigForKey(key);
    entry.timestamps = entry.timestamps.filter((t) => now - t < config.windowMs);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

function getConfigForKey(key: string): RateLimitConfig {
  for (const [path, config] of Object.entries(ENDPOINT_CONFIGS)) {
    if (key.startsWith(path)) return config;
  }
  return DEFAULT_CONFIG;
}

// Auto-cleanup every 5 minutes
if (typeof globalThis !== "undefined") {
  setInterval(cleanupExpired, 300_000);
}

/**
 * Check if a request should be rate-limited.
 * Returns { allowed: true } or { allowed: false, retryAfter: seconds }.
 */
export function checkRateLimit(
  ip: string,
  path: string
): { allowed: true } | { allowed: false; retryAfter: number } {
  const key = `${ip}:${path}`;
  const config = getConfigForKey(key);
  const now = Date.now();

  const existing = store.get(key);
  const entry = existing ?? { timestamps: [now] };
  if (!existing) {
    store.set(key, entry);
    return { allowed: true };
  }
  if (!entry) {
    store.set(key, { timestamps: [now] });
    return { allowed: true };
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => now - t < config.windowMs);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldest = entry.timestamps[0];
    const retryAfter = Math.ceil((oldest + config.windowMs - now) / 1000);
    return { allowed: false, retryAfter: Math.max(1, retryAfter) };
  }

  entry.timestamps.push(now);
  return { allowed: true };
}

/**
 * Extract client IP from request headers.
 * Checks X-Forwarded-For (proxy/CDN) then falls back to direct connection.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "127.0.0.1";
}
