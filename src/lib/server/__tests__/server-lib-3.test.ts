import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NO_CACHE, SHORT_CACHE, MEDIUM_CACHE, LONG_CACHE, ETAG_HEADER, IF_NONE_MATCH } from "@/lib/server/cache-headers";
import { CONTENT_TYPES, acceptsContentType, setContentType } from "@/lib/server/content-type";
import { corsMiddleware, handleCorsPreflight } from "@/lib/server/cors";
import { paginateWithCursor, encodeCursor, decodeCursor } from "@/lib/server/cursor-pagination";
import { registerGracefulShutdown } from "@/lib/server/graceful-shutdown";
import { applySecurityHeaders, applyCacheHeaders } from "@/lib/server/response-headers";

// =========================================================================
// Cache Headers
// =========================================================================
describe("cache-headers", () => {
  it("exports cache policy constants", () => {
    expect(NO_CACHE).toContain("no-store");
    expect(SHORT_CACHE).toContain("max-age=5");
    expect(MEDIUM_CACHE).toContain("max-age=60");
    expect(LONG_CACHE).toContain("max-age=3600");
  });

  it("exports header name constants", () => {
    expect(ETAG_HEADER).toBe("ETag");
    expect(IF_NONE_MATCH).toBe("If-None-Match");
  });

  it("includes stale-while-revalidate in cache policies", () => {
    expect(SHORT_CACHE).toContain("stale-while-revalidate");
    expect(MEDIUM_CACHE).toContain("stale-while-revalidate");
    expect(LONG_CACHE).toContain("stale-while-revalidate");
  });
});

// =========================================================================
// Content Type
// =========================================================================
describe("content-type", () => {
  it("exports content type constants", () => {
    expect(CONTENT_TYPES.JSON).toContain("application/json");
    expect(CONTENT_TYPES.CSV).toContain("text/csv");
    expect(CONTENT_TYPES.EVENT_STREAM).toBe("text/event-stream");
  });

  it("accepts when no accept header present", () => {
    const request = new Request("http://localhost/api");
    expect(acceptsContentType(request, CONTENT_TYPES.JSON)).toBe(true);
  });

  it("accepts wildcard", () => {
    const request = new Request("http://localhost/api", {
      headers: { accept: "*/*" },
    });
    expect(acceptsContentType(request, CONTENT_TYPES.JSON)).toBe(true);
  });

  it("accepts matching content type", () => {
    const request = new Request("http://localhost/api", {
      headers: { accept: "application/json" },
    });
    expect(acceptsContentType(request, CONTENT_TYPES.JSON)).toBe(true);
  });

  it("rejects non-matching content type", () => {
    const request = new Request("http://localhost/api", {
      headers: { accept: "text/html" },
    });
    expect(acceptsContentType(request, CONTENT_TYPES.JSON)).toBe(false);
  });

  it("setContentType sets the header", () => {
    const response = new Response("{}", { status: 200 });
    const updated = setContentType(response, CONTENT_TYPES.JSON);
    expect(updated.headers.get("Content-Type")).toBe(CONTENT_TYPES.JSON);
  });

  it("setContentType preserves body and status", async () => {
    const response = new Response("hello", { status: 201, statusText: "Created" });
    const updated = setContentType(response, CONTENT_TYPES.PLAIN);
    expect(updated.status).toBe(201);
    expect(updated.statusText).toBe("Created");
    await expect(updated.text()).resolves.toBe("hello");
  });
});

// =========================================================================
// CORS
// =========================================================================
describe("cors", () => {
  it("corsMiddleware sets headers with origin", () => {
    const request = new Request("http://localhost/api", {
      headers: { origin: "https://example.com" },
    });
    const response = new Response(null, { status: 200 });
    const result = corsMiddleware(request as never, response as never);
    expect(result.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
    expect(result.headers.get("Access-Control-Allow-Methods")).toBe("GET, OPTIONS");
  });

  it("corsMiddleware defaults origin to *", () => {
    const request = new Request("http://localhost/api");
    const response = new Response(null, { status: 200 });
    const result = corsMiddleware(request as never, response as never);
    expect(result.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("handleCorsPreflight returns 204 with CORS headers", () => {
    const result = handleCorsPreflight();
    expect(result.status).toBe(204);
    expect(result.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(result.headers.get("Access-Control-Max-Age")).toBe("86400");
  });
});

// =========================================================================
// Cursor Pagination
// =========================================================================
describe("cursor-pagination", () => {
  const items = [
    { id: "a" },
    { id: "b" },
    { id: "c" },
    { id: "d" },
    { id: "e" },
  ];

  it("returns first page without cursor", () => {
    const page = paginateWithCursor(items, null, 2);
    expect(page.items).toHaveLength(2);
    expect(page.items[0]?.id).toBe("a");
    expect(page.nextCursor).toBe("b");
    expect(page.hasMore).toBe(true);
  });

  it("paginates from cursor", () => {
    const page = paginateWithCursor(items, "b", 2);
    expect(page.items[0]?.id).toBe("c");
    expect(page.items[1]?.id).toBe("d");
  });

  it("returns null cursor on last page", () => {
    const page = paginateWithCursor(items, "d", 2);
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toBeNull();
    expect(page.hasMore).toBe(false);
  });

  it("handles unknown cursor gracefully", () => {
    const page = paginateWithCursor(items, "zzz", 2);
    // findIndex returns -1, so startIndex = 0
    expect(page.items[0]?.id).toBe("a");
  });

  it("handles empty items", () => {
    const page = paginateWithCursor([], null, 10);
    expect(page.items).toHaveLength(0);
    expect(page.nextCursor).toBeNull();
    expect(page.hasMore).toBe(false);
  });

  it("encodes and decodes cursors round-trip", () => {
    const original = "item-id-42";
    const encoded = encodeCursor(original);
    expect(encoded).not.toBe(original);
    expect(decodeCursor(encoded)).toBe(original);
  });
});

// =========================================================================
// Graceful Shutdown
// =========================================================================
describe("graceful-shutdown", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers SIGTERM and SIGINT handlers", () => {
    const onSpy = vi.spyOn(process, "on").mockImplementation(() => process);
    registerGracefulShutdown();
    expect(onSpy).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith("SIGINT", expect.any(Function));
  });

  it("calls onShutdown and exits on signal", async () => {
    const onShutdown = vi.fn().mockResolvedValue(undefined);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    const onSpy = vi.spyOn(process, "on").mockImplementation((() => process) as never);

    // Capture the registered handler and invoke it
    let handler: (() => Promise<void>) | undefined;
    vi.mocked(onSpy).mockImplementation(
      ((_event: string | symbol, cb: (...args: unknown[]) => void) => {
        handler = cb as () => Promise<void>;
        return process;
      }) as never
    );

    registerGracefulShutdown({ onShutdown });
    expect(handler).toBeDefined();
    await handler!();
    expect(onShutdown).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("handles onShutdown errors gracefully", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    const onSpy = vi.spyOn(process, "on").mockImplementation((() => process) as never);
    let handler: (() => Promise<void>) | undefined;
    vi.mocked(onSpy).mockImplementation(
      ((_event: string | symbol, cb: (...args: unknown[]) => void) => {
        handler = cb as () => Promise<void>;
        return process;
      }) as never
    );

    registerGracefulShutdown({
      onShutdown: () => Promise.reject(new Error("boom")),
    });
    await handler!();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});

// =========================================================================
// Response Headers
// =========================================================================
describe("response-headers", () => {
  it("applySecurityHeaders adds security headers", () => {
    const response = new Response(null, { status: 200 });
    const updated = applySecurityHeaders(response);
    expect(updated.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(updated.headers.get("X-Frame-Options")).toBe("DENY");
    expect(updated.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("applySecurityHeaders preserves body and status", async () => {
    const response = new Response("data", { status: 404 });
    const updated = applySecurityHeaders(response);
    expect(updated.status).toBe(404);
    await expect(updated.text()).resolves.toBe("data");
  });

  it("applyCacheHeaders sets Cache-Control", () => {
    const response = new Response(null, { status: 200 });
    const updated = applyCacheHeaders(response, 300);
    expect(updated.headers.get("Cache-Control")).toBe(
      "public, max-age=300, s-maxage=300"
    );
  });

  it("applyCacheHeaders preserves status", () => {
    const response = new Response(null, { status: 503 });
    const updated = applyCacheHeaders(response, 60);
    expect(updated.status).toBe(503);
  });
});
