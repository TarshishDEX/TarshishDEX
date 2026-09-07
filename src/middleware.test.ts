import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { resetRateLimitStore } from "@/lib/server/rate-limit";

/**
 * Rate-limiter middleware tests — exercises the REAL in-memory limiter
 * through the Next.js middleware, covering the acceptance criteria from
 * issue #50: pass-through under the limit, 429 over the limit, window
 * expiry, per-IP separation, and the dedicated API bucket.
 */

function createRequest(path: string, headers?: Record<string, string>): NextRequest {
  const url = new URL(`http://localhost:3000${path}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextRequest(url, headers ? ({ headers } as any) : undefined);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  resetRateLimitStore();
});

describe("middleware rate limiting", () => {
  it("passes non-API routes through without rate-limit headers", () => {
    const response = middleware(createRequest("/swap"));

    expect(response.status).toBe(200);
    expect(response.headers.get("X-RateLimit-Limit")).toBeNull();
  });

  it("allows requests under the limit and attaches rate-limit headers", () => {
    const response = middleware(createRequest("/api/health"));

    expect(response.status).toBe(200);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("100");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("99");
    expect(response.headers.get("X-RateLimit-Reset")).toBeDefined();
    expect(response.headers.get("X-Request-Id")).toBeDefined();
  });

  it("returns 429 with Retry-After once the limit is exhausted", async () => {
    // Exhaust the 100 req/min API bucket for this client.
    for (let i = 0; i < 100; i++) {
      const response = middleware(createRequest("/api/health"));
      expect(response.status).toBe(200);
    }

    const blocked = middleware(createRequest("/api/health"));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeDefined();
    expect(blocked.headers.get("X-RateLimit-Limit")).toBe("100");
    expect(blocked.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(blocked.headers.get("X-RateLimit-Reset")).toBeDefined();

    const body = await blocked.json();
    expect(body.error).toContain("Too many requests");
  });

  it("tracks different IPs independently via x-forwarded-for", () => {
    for (let i = 0; i < 100; i++) {
      expect(
        middleware(createRequest("/api/health", { "x-forwarded-for": "1.1.1.1" })).status
      ).toBe(200);
    }

    // The 101st request from 1.1.1.1 is blocked…
    expect(middleware(createRequest("/api/health", { "x-forwarded-for": "1.1.1.1" })).status).toBe(
      429
    );

    // …while a different IP still has its full allowance.
    const other = middleware(createRequest("/api/health", { "x-forwarded-for": "2.2.2.2" }));
    expect(other.status).toBe(200);
    expect(other.headers.get("X-RateLimit-Remaining")).toBe("99");
  });

  it("resets the window after expiry", () => {
    for (let i = 0; i < 100; i++) {
      middleware(createRequest("/api/health"));
    }
    expect(middleware(createRequest("/api/health")).status).toBe(429);

    // Slide past the 60s window — the bucket refills.
    vi.advanceTimersByTime(61_000);

    const response = middleware(createRequest("/api/health"));
    expect(response.status).toBe(200);
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("99");
  });

  it("shares one API bucket across all /api routes for a client", () => {
    // Burn most of the allowance across different endpoints…
    for (let i = 0; i < 99; i++) {
      middleware(createRequest("/api/assets"));
    }
    // …the last allowance is consumed by a different endpoint…
    expect(middleware(createRequest("/api/swap/quote")).status).toBe(200);
    // …and the bucket is now exhausted regardless of the route.
    expect(middleware(createRequest("/api/health")).status).toBe(429);
  });
});
