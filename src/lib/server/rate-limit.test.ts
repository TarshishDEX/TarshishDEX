import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkRateLimit,
  DEFAULT_API_RATE_LIMIT,
  getClientId,
  resetRateLimitStore,
  STRICTER_QUOTE_RATE_LIMIT,
} from "@/lib/server/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    resetRateLimitStore();
  });

  it("allows first request", () => {
    const result = checkRateLimit("127.0.0.1", {
      maxRequests: 10,
      windowMs: 60_000,
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("allows requests up to the limit", () => {
    for (let i = 0; i < 4; i++) {
      const result = checkRateLimit("client-a", {
        maxRequests: 4,
        windowMs: 60_000,
      });
      expect(result.allowed).toBe(true);
    }
    // 5th request (1-indexed: the 4th window-hit) should be disallowed
    const blocked = checkRateLimit("client-a", {
      maxRequests: 4,
      windowMs: 60_000,
    });
    expect(blocked.allowed).toBe(false);
  });

  it("blocks requests exceeding the limit", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("127.0.0.1", { maxRequests: 3, windowMs: 60_000 });
    }
    const blocked = checkRateLimit("127.0.0.1", {
      maxRequests: 3,
      windowMs: 60_000,
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("127.0.0.1", { maxRequests: 3, windowMs: 60_000 });
    }
    // Advance time past the window
    vi.advanceTimersByTime(61_000);

    const result = checkRateLimit("127.0.0.1", {
      maxRequests: 3,
      windowMs: 60_000,
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("tracks different keys independently", () => {
    // Exhaust key A
    for (let i = 0; i < 3; i++) {
      checkRateLimit("ip-a", { maxRequests: 3, windowMs: 60_000 });
    }
    // Key B should still be allowed
    const result = checkRateLimit("ip-b", { maxRequests: 3, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("returns correct resetAt timestamp", () => {
    const result = checkRateLimit("127.0.0.2", {
      maxRequests: 10,
      windowMs: 30_000,
    });
    // resetAt should be approximately now + windowMs (allow small timer drift)
    const expectedMin = Date.now() + 29_000;
    const expectedMax = Date.now() + 31_000;
    expect(result.resetAt).toBeGreaterThanOrEqual(expectedMin);
    expect(result.resetAt).toBeLessThanOrEqual(expectedMax);
  });
});

describe("rate limit presets", () => {
  it("defines a stricter quote limit than the default API limit", () => {
    expect(STRICTER_QUOTE_RATE_LIMIT.maxRequests).toBeLessThan(DEFAULT_API_RATE_LIMIT.maxRequests);
    expect(STRICTER_QUOTE_RATE_LIMIT.windowMs).toBe(DEFAULT_API_RATE_LIMIT.windowMs);
  });

  it("enforces the stricter quote limit sooner", () => {
    // Exhaust the stricter quote preset for a client…
    for (let i = 0; i < STRICTER_QUOTE_RATE_LIMIT.maxRequests; i++) {
      expect(checkRateLimit("quote-client", STRICTER_QUOTE_RATE_LIMIT).allowed).toBe(true);
    }
    // …the next quote request is blocked…
    expect(checkRateLimit("quote-client", STRICTER_QUOTE_RATE_LIMIT).allowed).toBe(false);
    // …while the same client still has headroom under the default API limit.
    expect(checkRateLimit("quote-client", DEFAULT_API_RATE_LIMIT).allowed).toBe(true);
  });

  it("separates quote and default limit buckets via keyPrefix", () => {
    // Exhaust the strict quote bucket — the default bucket is untouched.
    for (let i = 0; i < STRICTER_QUOTE_RATE_LIMIT.maxRequests; i++) {
      checkRateLimit("client-x", { ...STRICTER_QUOTE_RATE_LIMIT, keyPrefix: "quote" });
    }
    expect(
      checkRateLimit("client-x", { ...STRICTER_QUOTE_RATE_LIMIT, keyPrefix: "quote" }).allowed
    ).toBe(false);
    expect(checkRateLimit("client-x", DEFAULT_API_RATE_LIMIT).allowed).toBe(true);
  });
});

describe("getClientId", () => {
  it("uses the rightmost entry of x-forwarded-for (proxy-appended, not client-spoofable)", () => {
    const req = new Request("https://example.com/api/test", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientId(req)).toBe("5.6.7.8");
  });

  it("ignores attacker-prefixed x-forwarded-for entries", () => {
    // A client appending fake addresses to the LEFT of the real one must
    // not change the identifier.
    const req = new Request("https://example.com/api/test", {
      headers: { "x-forwarded-for": "203.0.113.7, 198.51.100.9, 5.6.7.8" },
    });
    expect(getClientId(req)).toBe("5.6.7.8");
  });

  it("prefers x-real-ip (platform-set) over x-forwarded-for", () => {
    const req = new Request("https://example.com/api/test", {
      headers: {
        "x-real-ip": "9.9.9.9",
        "x-forwarded-for": "1.2.3.4",
      },
    });
    expect(getClientId(req)).toBe("9.9.9.9");
  });

  it("returns a stable hash when only UA headers exist", () => {
    const req = new Request("https://example.com/api/test", {
      headers: { "user-agent": "test-agent/1.0" },
    });
    const first = getClientId(req);
    const second = getClientId(
      new Request("https://example.com/api/test", {
        headers: { "user-agent": "test-agent/1.0" },
      })
    );
    expect(first).toMatch(/^[0-9a-f]{8}$/);
    expect(second).toBe(first);
  });

  it("returns unknown when no identifying headers", () => {
    const req = new Request("https://example.com/api/test");
    expect(getClientId(req)).toBe("unknown");
  });
});
