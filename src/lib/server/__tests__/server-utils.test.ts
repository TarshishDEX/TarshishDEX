import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isBodyWithinLimit, MAX_JSON_BODY_SIZE, MAX_URLENCODED_BODY_SIZE } from "../body-limit";
import {
  sanitizeString,
  isValidStellarIdentifier,
  parseNumericParam,
  truncateString,
} from "../sanitize";
import { deduplicate, clearDedupCache } from "../dedup-requests";
import { buildErrorResponse, ErrorCode } from "../api-error";
import { NextResponse } from "next/server";
import { apiHandler } from "../api-handler";

// ─── body-limit ───────────────────────────────────────────────────────

describe("isBodyWithinLimit", () => {
  it("returns true when Content-Length is null", () => {
    expect(isBodyWithinLimit(null)).toBe(true);
  });

  it("returns true when Content-Length is within limit", () => {
    expect(isBodyWithinLimit("500", 1000)).toBe(true);
  });

  it("returns true when Content-Length equals limit", () => {
    expect(isBodyWithinLimit("1048576")).toBe(true);
  });

  it("returns false when Content-Length exceeds limit", () => {
    expect(isBodyWithinLimit("2000000", 1000)).toBe(false);
  });

  it("returns false when Content-Length is NaN", () => {
    expect(isBodyWithinLimit("not-a-number")).toBe(false);
  });

  it("defaults to MAX_JSON_BODY_SIZE when no maxSize provided", () => {
    expect(isBodyWithinLimit(String(MAX_JSON_BODY_SIZE + 1))).toBe(false);
  });

  it("accepts content at exactly MAX_JSON_BODY_SIZE", () => {
    expect(isBodyWithinLimit(String(MAX_JSON_BODY_SIZE))).toBe(true);
  });
});

describe("body-limit constants", () => {
  it("MAX_JSON_BODY_SIZE is 1MB", () => {
    expect(MAX_JSON_BODY_SIZE).toBe(1_048_576);
  });

  it("MAX_URLENCODED_BODY_SIZE is 256KB", () => {
    expect(MAX_URLENCODED_BODY_SIZE).toBe(262_144);
  });
});

// ─── sanitize ──────────────────────────────────────────────────────────

describe("sanitizeString", () => {
  it("returns empty string for null", () => {
    expect(sanitizeString(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(sanitizeString(undefined)).toBe("");
  });

  it("returns empty string for non-strings", () => {
    expect(sanitizeString(42)).toBe("");
    expect(sanitizeString({})).toBe("");
    expect(sanitizeString(true)).toBe("");
  });

  it("strips HTML tags", () => {
    expect(sanitizeString("<script>alert('xss')</script>")).toBe("alert(xss)");
  });

  it("strips dangerous characters", () => {
    expect(sanitizeString('<div class="foo">&amp;</div>')).toBe("amp;");
  });

  it("trims whitespace", () => {
    expect(sanitizeString("  hello world  ")).toBe("hello world");
  });

  it("preserves safe text", () => {
    expect(sanitizeString("XLM:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN")).toBe(
      "XLM:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
  });
});

describe("isValidStellarIdentifier", () => {
  it("accepts a valid Stellar public key", () => {
    expect(
      isValidStellarIdentifier("GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN")
    ).toBe(true);
  });

  it("accepts alphanumeric asset codes", () => {
    expect(isValidStellarIdentifier("USDC")).toBe(true);
    expect(isValidStellarIdentifier("XLM")).toBe(true);
  });

  it("accepts dashes and underscores", () => {
    expect(isValidStellarIdentifier("my-asset_code")).toBe(true);
  });

  it("rejects strings with slashes", () => {
    expect(isValidStellarIdentifier("foo/bar")).toBe(false);
  });

  it("rejects strings with angle brackets", () => {
    expect(isValidStellarIdentifier("<script>")).toBe(false);
  });

  it("rejects strings longer than 128 chars", () => {
    expect(isValidStellarIdentifier("A".repeat(129))).toBe(false);
  });

  it("accepts strings at exactly 128 chars", () => {
    expect(isValidStellarIdentifier("A".repeat(128))).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isValidStellarIdentifier("")).toBe(false);
  });
});

describe("parseNumericParam", () => {
  it("parses valid positive number strings", () => {
    expect(parseNumericParam("42")).toBe(42);
  });

  it("parses zero", () => {
    expect(parseNumericParam("0")).toBe(0);
  });

  it("returns null for negative numbers", () => {
    expect(parseNumericParam("-5")).toBeNull();
  });

  it("returns null for non-strings", () => {
    expect(parseNumericParam(42)).toBeNull();
    expect(parseNumericParam(null)).toBeNull();
  });

  it("returns null for non-numeric strings", () => {
    expect(parseNumericParam("abc")).toBeNull();
  });

  it("returns null for Infinity strings", () => {
    expect(parseNumericParam("Infinity")).toBeNull();
  });

  it("handles decimal numbers", () => {
    expect(parseNumericParam("3.14")).toBe(3.14);
  });
});

describe("truncateString", () => {
  it("truncates a string to the given length", () => {
    expect(truncateString("hello world", 5)).toBe("hello");
  });

  it("returns the string unchanged if shorter than maxLength", () => {
    expect(truncateString("hi", 10)).toBe("hi");
  });

  it("returns empty string when truncating to 0", () => {
    expect(truncateString("hello", 0)).toBe("");
  });
});

// ─── dedup-requests ────────────────────────────────────────────────────

describe("deduplicate", () => {
  beforeEach(() => {
    clearDedupCache();
  });

  afterEach(() => {
    clearDedupCache();
  });

  it("returns the result of the function", async () => {
    const result = await deduplicate("key1", async () => 42);
    expect(result).toBe(42);
  });

  it("deduplicates concurrent calls with the same key", async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      return "result";
    };

    const results = await Promise.all([
      deduplicate("shared-key", fn),
      deduplicate("shared-key", fn),
    ]);

    expect(results[0]).toBe("result");
    expect(results[1]).toBe("result");
    expect(callCount).toBe(1);
  });

  it("does not deduplicate different keys", async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      return callCount;
    };

    const results = await Promise.all([deduplicate("key-a", fn), deduplicate("key-b", fn)]);
    expect(results).toHaveLength(2);
    expect(callCount).toBe(2);
  });

  it("allows subsequent calls after TTL expires", async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      return callCount;
    };

    const first = await deduplicate("key-ttl", fn, 10);
    expect(first).toBe(1);

    // Wait for TTL to expire
    await new Promise((r) => setTimeout(r, 20));
    const second = await deduplicate("key-ttl", fn, 10);
    expect(second).toBe(2);
  });

  it("clearDedupCache removes all entries", async () => {
    await deduplicate("key1", async () => 1);
    clearDedupCache();
    let callCount = 0;
    const result = await deduplicate("key1", async () => {
      callCount++;
      return 2;
    });
    expect(callCount).toBe(1);
    expect(result).toBe(2);
  });
});

// ─── api-error ─────────────────────────────────────────────────────────

describe("buildErrorResponse", () => {
  it("returns an object with error, code, and errorId", () => {
    const resp = buildErrorResponse("TEST_CODE", 400, "Something went wrong");
    expect(resp.error).toBe("Something went wrong");
    expect(resp.code).toBe("TEST_CODE");
    expect(resp.errorId).toBeTruthy();
    expect(typeof resp.errorId).toBe("string");
  });

  it("includes details when provided", () => {
    const details = [
      { field: "amount", message: "Must be positive" },
      { field: "base", message: "Invalid asset format" },
    ];
    const resp = buildErrorResponse(ErrorCode.VALIDATION_ERROR, 400, "Invalid params", details);
    expect(resp.details).toEqual(details);
  });

  it("does not include details when not provided", () => {
    const resp = buildErrorResponse("CODE", 500, "Error");
    expect(resp).not.toHaveProperty("details");
  });

  it("generates unique errorIds", () => {
    const a = buildErrorResponse("A", 400, "a");
    const b = buildErrorResponse("B", 400, "b");
    expect(a.errorId).not.toBe(b.errorId);
  });
});

describe("ErrorCode", () => {
  it("contains all 19 codes (16 active + 3 reserved)", () => {
    const keys = Object.keys(ErrorCode);
    expect(keys.length).toBe(19);
  });

  it("includes domain-specific codes for every API route category", () => {
    expect(ErrorCode.ASSET_FETCH_FAILED).toBe("ASSET_FETCH_FAILED");
    expect(ErrorCode.CANDLES_FETCH_FAILED).toBe("CANDLES_FETCH_FAILED");
    expect(ErrorCode.ORDERBOOK_FETCH_FAILED).toBe("ORDERBOOK_FETCH_FAILED");
    expect(ErrorCode.POOLS_FETCH_FAILED).toBe("POOLS_FETCH_FAILED");
    expect(ErrorCode.STATS_FETCH_FAILED).toBe("STATS_FETCH_FAILED");
    expect(ErrorCode.PORTFOLIO_FETCH_FAILED).toBe("PORTFOLIO_FETCH_FAILED");
    expect(ErrorCode.TRADES_FETCH_FAILED).toBe("TRADES_FETCH_FAILED");
    expect(ErrorCode.SWAP_QUOTE_FAILED).toBe("SWAP_QUOTE_FAILED");
    expect(ErrorCode.NO_VIABLE_ROUTE).toBe("NO_VIABLE_ROUTE");
    expect(ErrorCode.ORDERS_QUERY_FAILED).toBe("ORDERS_QUERY_FAILED");
    expect(ErrorCode.ORDERS_BUILD_FAILED).toBe("ORDERS_BUILD_FAILED");
    expect(ErrorCode.CONTRACT_NOT_DEPLOYED).toBe("CONTRACT_NOT_DEPLOYED");
  });

  it("includes transport-level and reserved codes", () => {
    expect(ErrorCode.BAD_REQUEST).toBe("BAD_REQUEST");
    expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCode.RATE_LIMITED).toBe("RATE_LIMITED");
    expect(ErrorCode.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
    expect(ErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ErrorCode.SERVICE_UNAVAILABLE).toBe("SERVICE_UNAVAILABLE");
  });
});

// ─── api-handler ───────────────────────────────────────────────────────

describe("apiHandler", () => {
  it("passes through a successful response", async () => {
    const handler = apiHandler(async () => {
      return NextResponse.json({ ok: true }, { status: 200 });
    });

    const req = new Request("https://example.com/api/test");
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("catches thrown errors and returns 500 with structured error", async () => {
    const handler = apiHandler(async () => {
      throw new Error("Database connection lost");
    });

    const req = new Request("https://example.com/api/test");
    const res = await handler(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.code).toBe("INTERNAL_ERROR");
    expect(body.error).toBe("Internal server error");
    expect(body.errorId).toBeTruthy();
    expect(res.headers.get("X-Request-Id")).toBeTruthy();
  });

  it("handles non-Error throws", async () => {
    const handler = apiHandler(async () => {
      throw "plain string error";
    });

    const req = new Request("https://example.com/api/test");
    const res = await handler(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe("INTERNAL_ERROR");
  });

  it("supports dynamic routes with params", async () => {
    const handler = apiHandler(
      async (_: Request, ctx: { params: Promise<{ address: string }> }) => {
        const { address } = await ctx.params;
        return NextResponse.json({ address }, { status: 200 });
      }
    );

    const req = new Request("https://example.com/api/test");
    const res = await handler(req, { params: Promise.resolve({ address: "GABC123" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.address).toBe("GABC123");
  });
});
