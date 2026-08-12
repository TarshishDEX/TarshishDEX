import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── cache-headers ──────────────────────────────────────────────────────

import { NO_CACHE, SHORT_CACHE, MEDIUM_CACHE, LONG_CACHE, ETAG_HEADER, IF_NONE_MATCH } from "@/lib/server/cache-headers";

describe("cache-headers", () => {
  it("NO_CACHE is a string", () => {
    expect(typeof NO_CACHE).toBe("string");
    expect(NO_CACHE).toContain("no-store");
  });

  it("SHORT_CACHE has 5s max-age", () => {
    expect(SHORT_CACHE).toContain("max-age=5");
  });

  it("MEDIUM_CACHE has 60s max-age", () => {
    expect(MEDIUM_CACHE).toContain("max-age=60");
  });

  it("LONG_CACHE has 3600s max-age", () => {
    expect(LONG_CACHE).toContain("max-age=3600");
  });

  it("ETAG_HEADER is the correct header name", () => {
    expect(ETAG_HEADER).toBe("ETag");
  });

  it("IF_NONE_MATCH is the correct header name", () => {
    expect(IF_NONE_MATCH).toBe("If-None-Match");
  });
});

// ── compression ────────────────────────────────────────────────────────

import { shouldCompress, COMPRESSIBLE_TYPES, COMPRESSION_MIN_SIZE } from "@/lib/server/compression";

describe("compression", () => {
  it("COMPRESSION_MIN_SIZE is 1024", () => {
    expect(COMPRESSION_MIN_SIZE).toBe(1024);
  });

  it("COMPRESSIBLE_TYPES includes json", () => {
    expect(COMPRESSIBLE_TYPES).toContain("application/json");
  });

  it("shouldCompress returns false for small payloads", () => {
    expect(shouldCompress("application/json", 500)).toBe(false);
  });

  it("shouldCompress returns true for large JSON", () => {
    expect(shouldCompress("application/json", 2000)).toBe(true);
  });

  it("shouldCompress returns false for null content type", () => {
    expect(shouldCompress(null, 2000)).toBe(false);
  });

  it("shouldCompress returns false for unsupported types", () => {
    expect(shouldCompress("image/png", 5000)).toBe(false);
  });

  it("shouldCompress handles exact boundary", () => {
    expect(shouldCompress("application/json", 1024)).toBe(true);
  });
});

// ── etag ───────────────────────────────────────────────────────────────

import { generateETag, etagMatches } from "@/lib/server/etag";

describe("etag", () => {
  it("generateETag returns a weak ETag", () => {
    const etag = generateETag({ hello: "world" });
    expect(etag).toMatch(/^W\/"/);
  });

  it("generateETag produces consistent output for same input", () => {
    const data = { a: 1, b: 2 };
    expect(generateETag(data)).toBe(generateETag(data));
  });

  it("generateETag produces different output for different input", () => {
    expect(generateETag({ a: 1 })).not.toBe(generateETag({ a: 2 }));
  });

  it("etagMatches returns false without if-none-match", () => {
    expect(etagMatches('W/"abc"', null)).toBe(false);
  });

  it("etagMatches returns true for exact match", () => {
    const etag = generateETag({ x: 1 });
    expect(etagMatches(etag, etag)).toBe(true);
  });

  it("etagMatches handles wildcard *", () => {
    expect(etagMatches('W/"xyz"', "*")).toBe(true);
  });

  it("etagMatches handles weak to strong conversion", () => {
    const etag = generateETag("data");
    const strong = etag.replace("W/", "");
    expect(etagMatches(etag, strong)).toBe(true);
  });
});

// ── request-timeout ────────────────────────────────────────────────────

import { createTimeoutSignal, withTimeout, DEFAULT_API_TIMEOUT_MS } from "@/lib/server/request-timeout";

describe("request-timeout", () => {
  it("DEFAULT_API_TIMEOUT_MS is 10 seconds", () => {
    expect(DEFAULT_API_TIMEOUT_MS).toBe(10_000);
  });

  it("createTimeoutSignal returns AbortSignal", () => {
    const signal = createTimeoutSignal(5000);
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  it("withTimeout resolves when promise resolves first", async () => {
    const result = await withTimeout(Promise.resolve("done"), 5000);
    expect(result).toBe("done");
  });

  it("withTimeout rejects on timeout", async () => {
    vi.useFakeTimers();
    const slow = new Promise((resolve) => setTimeout(() => resolve("late"), 10000));
    const promise = withTimeout(slow, 1000, "Too slow");
    vi.advanceTimersByTime(1100);
    await expect(promise).rejects.toThrow("Too slow");
    vi.useRealTimers();
  });
});
