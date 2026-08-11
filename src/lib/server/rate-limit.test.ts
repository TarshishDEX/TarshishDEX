import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit, getClientId, resetRateLimitStore } from "@/lib/server/rate-limit";

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

describe("getClientId", () => {
  it("extracts first IP from x-forwarded-for", () => {
    const req = new Request("https://example.com/api/test", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientId(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("https://example.com/api/test", {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    expect(getClientId(req)).toBe("9.9.9.9");
  });

  it("returns unknown when no identifying headers", () => {
    const req = new Request("https://example.com/api/test");
    expect(getClientId(req)).toBe("unknown");
  });
});
