import { describe, it, expect } from "vitest";

// ── content-type.ts ─────────────────────────────────────────────────────
import { CONTENT_TYPES, acceptsContentType, setContentType } from "@/lib/server/content-type";

describe("content-type", () => {
  it("has standard content types", () => {
    expect(CONTENT_TYPES.JSON).toContain("application/json");
    expect(CONTENT_TYPES.HTML).toContain("text/html");
    expect(CONTENT_TYPES.EVENT_STREAM).toBe("text/event-stream");
    expect(CONTENT_TYPES.CSV).toContain("text/csv");
  });

  it("acceptsContentType returns true when no Accept header", () => {
    const req = new Request("http://localhost/test");
    expect(acceptsContentType(req, "application/json")).toBe(true);
  });

  it("acceptsContentType returns true for wildcard", () => {
    const req = new Request("http://localhost/test", {
      headers: { Accept: "*/*" },
    });
    expect(acceptsContentType(req, "application/json")).toBe(true);
  });

  it("acceptsContentType matches specific type", () => {
    const req = new Request("http://localhost/test", {
      headers: { Accept: "application/json" },
    });
    expect(acceptsContentType(req, "application/json")).toBe(true);
    expect(acceptsContentType(req, "text/html")).toBe(false);
  });

  it("acceptsContentType strips charset for matching", () => {
    const req = new Request("http://localhost/test", {
      headers: { Accept: "application/json, text/html" },
    });
    expect(acceptsContentType(req, "application/json; charset=utf-8")).toBe(true);
  });

  it("setContentType adds content-type header to response", () => {
    const res = new Response("hello");
    const updated = setContentType(res, "application/json");
    expect(updated.headers.get("Content-Type")).toBe("application/json");
  });
});

// ── cursor-pagination.ts ────────────────────────────────────────────────
import {
  paginateWithCursor,
  encodeCursor,
  decodeCursor,
} from "@/lib/server/cursor-pagination";

describe("cursor-pagination", () => {
  const items = [
    { id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }, { id: "e" },
  ];

  it("paginates first page without cursor", () => {
    const page = paginateWithCursor(items, null, 2);
    expect(page.items).toEqual([{ id: "a" }, { id: "b" }]);
    expect(page.nextCursor).toBe("b");
    expect(page.hasMore).toBe(true);
  });

  it("paginates second page with cursor", () => {
    const page = paginateWithCursor(items, "b", 2);
    expect(page.items).toEqual([{ id: "c" }, { id: "d" }]);
    expect(page.nextCursor).toBe("d");
    expect(page.hasMore).toBe(true);
  });

  it("returns null nextCursor on last page", () => {
    const page = paginateWithCursor(items, "d", 2);
    expect(page.items).toEqual([{ id: "e" }]);
    expect(page.nextCursor).toBeNull();
    expect(page.hasMore).toBe(false);
  });

  it("handles cursor not found by starting from beginning", () => {
    const page = paginateWithCursor(items, "z", 2);
    // cursor not found -> startIndex = findIndex(-1) + 1 = 0, returns first page
    expect(page.items).toEqual([{ id: "a" }, { id: "b" }]);
    expect(page.nextCursor).toBe("b");
  });

  it("handles empty items array", () => {
    const page = paginateWithCursor([], null, 2);
    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
    expect(page.hasMore).toBe(false);
  });

  it("encodeCursor and decodeCursor round-trip", () => {
    const original = "item-42";
    const encoded = encodeCursor(original);
    expect(encoded).not.toBe(original);
    expect(decodeCursor(encoded)).toBe(original);
  });
});

// ── circuit-breaker.ts ───────────────────────────────────────────────────
import {
  withCircuitBreaker,
  resetCircuitBreaker,
} from "@/lib/server/circuit-breaker";

describe("circuit-breaker", () => {
  it("executes function when circuit is closed", async () => {
    resetCircuitBreaker("test-closed");
    const result = await withCircuitBreaker("test-closed", async () => "ok", {
      threshold: 3,
      timeoutMs: 1000,
    });
    expect(result).toBe("ok");
  });

  it("throws last error after threshold exceeded", async () => {
    resetCircuitBreaker("test-threshold");
    const badFn = async () => {
      throw new Error("service down");
    };

    // Fail 3 times (threshold of 3)
    for (let i = 0; i < 3; i++) {
      await expect(
        withCircuitBreaker("test-threshold", badFn, {
          threshold: 3,
          timeoutMs: 1000,
        })
      ).rejects.toThrow("service down");
    }

    // 4th call should fail fast with circuit open
    await expect(
      withCircuitBreaker("test-threshold", badFn, {
        threshold: 3,
        timeoutMs: 1000,
      })
    ).rejects.toThrow('Circuit breaker "test-threshold" is open');
  });

  it("recovers after timeout expires", async () => {
    resetCircuitBreaker("test-recover");
    const badFn = async () => {
      throw new Error("down");
    };

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(
        withCircuitBreaker("test-recover", badFn, { threshold: 3, timeoutMs: 1 })
      ).rejects.toThrow("down");
    }

    // Wait for timeout
    await new Promise((r) => setTimeout(r, 10));

    // Circuit should be half-open now, and since fn succeeds, reset to closed
    const result = await withCircuitBreaker(
      "test-recover",
      async () => "recovered",
      { threshold: 3, timeoutMs: 1 }
    );
    expect(result).toBe("recovered");
  });
});
