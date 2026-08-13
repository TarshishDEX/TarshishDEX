import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock rate-limit module
vi.mock("@/lib/server/rate-limit", () => ({
  getClientId: vi.fn(() => "test-client-127.0.0.1"),
  checkRateLimit: vi.fn(() => ({
    allowed: true,
    remaining: 99,
    resetAt: Date.now() + 60_000,
  })),
}));

describe("middleware", () => {
  let middleware: typeof import("@/middleware").middleware;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("@/middleware");
    middleware = mod.middleware;
  });

  function createRequest(path: string, headers?: Record<string, string>): NextRequest {
    const url = new URL(`http://localhost:3000${path}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new NextRequest(url, headers ? ({ headers } as any) : undefined);
  }

  it("passes through non-API routes", () => {
    const request = createRequest("/swap");
    const response = middleware(request);
    // For non-API routes, NextResponse.next() is returned without custom headers
    expect(response.status).toBe(200);
  });

  it("applies rate limit headers on API routes", () => {
    const request = createRequest("/api/assets?limit=10");
    const response = middleware(request);

    expect(response.headers.get("X-RateLimit-Limit")).toBe("100");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("99");
    expect(response.headers.get("X-RateLimit-Reset")).toBeDefined();
  });

  it("sets X-Request-Id on API responses", () => {
    const request = createRequest("/api/health");
    const response = middleware(request);
    expect(response.headers.get("X-Request-Id")).toBeDefined();
  });

  it("reuses existing X-Request-Id from request", () => {
    const requestId = "existing-req-id-123";
    const request = createRequest("/api/assets", {
      "x-request-id": requestId,
    });
    const response = middleware(request);
    expect(response.headers.get("X-Request-Id")).toBe(requestId);
  });

  it("sets security headers on API responses", () => {
    const request = createRequest("/api/market/stats");
    const response = middleware(request);

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("Permissions-Policy")).toBeDefined();
  });

  it("sets Content-Security-Policy header", () => {
    const request = createRequest("/api/market/candles?base=XLM&counter=USDC&resolution=1h");
    const response = middleware(request);
    const csp = response.headers.get("Content-Security-Policy");
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("connect-src");
  });

  it("sets CORS headers on API responses", () => {
    const request = createRequest("/api/swap/quote?sell_asset=XLM&buy_asset=USDC&amount=100");
    const response = middleware(request);

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, OPTIONS");
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain("Content-Type");
  });

  it("sets HSTS header in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();

    const mod = await import("@/middleware");
    const request = createRequest("/api/health");
    const response = mod.middleware(request);

    expect(response.headers.get("Strict-Transport-Security")).toContain("max-age=63072000");
    expect(response.headers.get("Strict-Transport-Security")).toContain("includeSubDomains");
    expect(response.headers.get("Strict-Transport-Security")).toContain("preload");

    vi.stubEnv("NODE_ENV", "test");
  });

  it("does not set HSTS in non-production", () => {
    const request = createRequest("/api/health");
    const response = middleware(request);
    expect(response.headers.get("Strict-Transport-Security")).toBeNull();
  });

  it("returns 429 when rate limited", async () => {
    const rateLimitMock = await import("@/lib/server/rate-limit");
    vi.mocked(rateLimitMock.checkRateLimit).mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 30_000,
    });

    vi.resetModules();
    const mod = await import("@/middleware");
    const request = createRequest("/api/assets");
    const response = mod.middleware(request);

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toContain("Too many requests");
    expect(response.headers.get("Retry-After")).toBeDefined();
  });

  it("calls non-API routes with NextResponse.next", () => {
    const request = createRequest("/");
    const response = middleware(request);
    // Should pass through without modification
    expect(response.status).toBe(200);
  });

  it("handles deep API paths", () => {
    const request = createRequest("/api/trades/GABC123XYZ");
    const response = middleware(request);
    expect(response.headers.get("X-Request-Id")).toBeDefined();
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});
