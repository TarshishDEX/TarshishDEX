import { describe, it, expect, vi, beforeEach } from "vitest";

// =========================================================================
// Mocks — routing engine and rate limiter are stubbed; the route handler,
// Zod validation, and NextRequest plumbing are exercised for real.
// =========================================================================
const { findBestRouteMock, checkRateLimitMock, getClientIdMock } = vi.hoisted(() => ({
  findBestRouteMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
  getClientIdMock: vi.fn(),
}));

vi.mock("@/lib/stellar/routing", () => ({
  findBestRoute: findBestRouteMock,
}));

vi.mock("@/lib/server/rate-limit", () => ({
  checkRateLimit: checkRateLimitMock,
  getClientId: getClientIdMock,
  resetRateLimitStore: vi.fn(),
  STRICTER_QUOTE_RATE_LIMIT: { maxRequests: 30, windowMs: 60_000 },
}));

vi.mock("@/lib/server/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { GET } from "@/app/api/swap/quote/route";

const USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

function makeRequest(url: string): Request {
  return new Request(url);
}

beforeEach(() => {
  vi.clearAllMocks();
  checkRateLimitMock.mockReturnValue({
    allowed: true,
    remaining: 29,
    resetAt: Date.now() + 60_000,
  });
  getClientIdMock.mockReturnValue("1.2.3.4");
  findBestRouteMock.mockResolvedValue({
    path: [
      { code: "XLM", isNative: true },
      { code: "USDC", issuer: USDC_ISSUER },
    ],
    sourceAmount: "100",
    outputAmount: "98.5",
    executionPrice: 0.985,
    priceImpactPct: 0.5,
    minReceived: "97.5",
    feeEstimateXlm: "0.01",
    slippagePct: 1,
    method: "direct",
    warnings: [],
  });
});

describe("GET /api/swap/quote (integration)", () => {
  it("returns 200 with the expected route shape for a valid pair", async () => {
    const res = await GET(
      makeRequest(
        `http://localhost/api/swap/quote?input=XLM&output=USDC:${USDC_ISSUER}&amount=100&slippage=1`
      )
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      method: "direct",
      sourceAmount: "100",
      outputAmount: "98.5",
      minReceived: "97.5",
      slippagePct: 1,
    });
    expect(body.path).toHaveLength(2);
    expect(body.path[0]!.code).toBe("XLM");
    expect(body.path[1]!.code).toBe("USDC");
    expect(findBestRouteMock).toHaveBeenCalledTimes(1);
  });

  it("returns 400 for an invalid asset (missing issuer)", async () => {
    const res = await GET(
      makeRequest(`http://localhost/api/swap/quote?input=XLM&output=USDC&amount=100`)
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(findBestRouteMock).not.toHaveBeenCalled();
  });

  it("returns 400 for a malformed issuer", async () => {
    const res = await GET(
      makeRequest(`http://localhost/api/swap/quote?input=XLM&output=USDC:not-a-key&amount=100`)
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when amount is missing", async () => {
    const res = await GET(
      makeRequest(`http://localhost/api/swap/quote?input=XLM&output=USDC:${USDC_ISSUER}`)
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(findBestRouteMock).not.toHaveBeenCalled();
  });

  it("returns 400 for a negative amount", async () => {
    const res = await GET(
      makeRequest(`http://localhost/api/swap/quote?input=XLM&output=USDC:${USDC_ISSUER}&amount=-5`)
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(findBestRouteMock).not.toHaveBeenCalled();
  });

  it("returns 400 for a zero amount", async () => {
    const res = await GET(
      makeRequest(`http://localhost/api/swap/quote?input=XLM&output=USDC:${USDC_ISSUER}&amount=0`)
    );

    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when input equals output (no viable route)", async () => {
    findBestRouteMock.mockResolvedValue(null);
    const res = await GET(
      makeRequest(`http://localhost/api/swap/quote?input=XLM&output=XLM&amount=100`)
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("NO_VIABLE_ROUTE");
  });

  it("returns 429 when the stricter quote rate limit is hit", async () => {
    checkRateLimitMock.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 30_000,
    });

    const res = await GET(
      makeRequest(`http://localhost/api/swap/quote?input=XLM&output=USDC:${USDC_ISSUER}&amount=100`)
    );

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeDefined();
    expect(findBestRouteMock).not.toHaveBeenCalled();
  });

  it("returns 502 when the routing engine fails", async () => {
    findBestRouteMock.mockRejectedValue(new Error("horizon down"));

    const res = await GET(
      makeRequest(`http://localhost/api/swap/quote?input=XLM&output=USDC:${USDC_ISSUER}&amount=100`)
    );

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.code).toBe("SWAP_QUOTE_FAILED");
  });
});
