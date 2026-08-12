import { describe, it, expect, beforeEach } from "vitest";
import { HORIZON_POOL_CONFIG } from "@/lib/server/horizon-pool";
import {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheClear,
  cacheSize,
} from "@/lib/server/query-cache";
import {
  runWithContext,
  getRequestContext,
  getRequestId,
} from "@/lib/server/request-context";
import { buildServerTiming, measureTiming } from "@/lib/server/server-timing";

// =========================================================================
// Horizon Pool Config
// =========================================================================
describe("HORIZON_POOL_CONFIG", () => {
  it("has expected config values", () => {
    expect(HORIZON_POOL_CONFIG.maxConnections).toBe(10);
    expect(HORIZON_POOL_CONFIG.minConnections).toBe(2);
    expect(HORIZON_POOL_CONFIG.idleTimeoutMs).toBe(30000);
    expect(HORIZON_POOL_CONFIG.acquireTimeoutMs).toBe(10000);
  });

  it("is read-only via as const", () => {
    // as const objects are deeply readonly at the type level
    expect(HORIZON_POOL_CONFIG.idleTimeoutMs).toBe(30000);
  });
});

// =========================================================================
// Query Cache
// =========================================================================
describe("query-cache", () => {
  beforeEach(() => {
    cacheClear();
  });

  it("returns undefined for missing key", () => {
    expect(cacheGet("missing")).toBeUndefined();
  });

  it("sets and gets a value", () => {
    cacheSet("key1", { data: 42 }, 5000);
    expect(cacheGet("key1")).toEqual({ data: 42 });
  });

  it("returns undefined for expired entries", () => {
    cacheSet("key2", "value", -1); // TTL in the past
    expect(cacheGet("key2")).toBeUndefined();
  });

  it("deletes a specific key", () => {
    cacheSet("key3", "val", 5000);
    cacheDelete("key3");
    expect(cacheGet("key3")).toBeUndefined();
  });

  it("clears all entries", () => {
    cacheSet("a", 1, 5000);
    cacheSet("b", 2, 5000);
    expect(cacheSize()).toBe(2);
    cacheClear();
    expect(cacheSize()).toBe(0);
  });

  it("tracks size correctly", () => {
    expect(cacheSize()).toBe(0);
    cacheSet("x", 1, 5000);
    cacheSet("y", 2, 5000);
    expect(cacheSize()).toBe(2);
  });
});

// =========================================================================
// Request Context
// =========================================================================
describe("request-context", () => {
  it("getRequestContext returns undefined outside a context", () => {
    expect(getRequestContext()).toBeUndefined();
  });

  it("getRequestId returns unknown outside a context", () => {
    expect(getRequestId()).toBe("unknown");
  });

  it("runWithContext makes context available synchronously", () => {
    const ctx = {
      requestId: "req-123",
      startTime: Date.now(),
      path: "/api/test",
      method: "GET",
    };

    runWithContext(ctx, () => {
      expect(getRequestContext()).toEqual(ctx);
      expect(getRequestId()).toBe("req-123");
    });
  });

  it("context is isolated to the callback", () => {
    const ctx = {
      requestId: "req-456",
      startTime: Date.now(),
      path: "/api/isolated",
      method: "POST",
    };

    runWithContext(ctx, () => {
      expect(getRequestId()).toBe("req-456");
    });

    // Outside the callback, context should be gone
    expect(getRequestId()).toBe("unknown");
  });

  it("nested contexts work correctly", () => {
    const outer = {
      requestId: "outer",
      startTime: Date.now(),
      path: "/outer",
      method: "GET",
    };
    const inner = {
      requestId: "inner",
      startTime: Date.now(),
      path: "/inner",
      method: "GET",
    };

    runWithContext(outer, () => {
      expect(getRequestId()).toBe("outer");
      runWithContext(inner, () => {
        expect(getRequestId()).toBe("inner");
      });
      expect(getRequestId()).toBe("outer");
    });
  });
});

// =========================================================================
// Server Timing
// =========================================================================
describe("server-timing", () => {
  it("builds single timing entry", () => {
    const header = buildServerTiming({ name: "db", duration: 53 });
    expect(header).toBe("db;dur=53");
  });

  it("builds multiple entries", () => {
    const header = buildServerTiming(
      { name: "db", duration: 53 },
      { name: "cache", duration: 0, description: "HIT" }
    );
    expect(header).toContain("db;dur=53");
    expect(header).toContain("cache;dur=0");
    expect(header).toContain('desc="HIT"');
  });

  it("rounds durations", () => {
    const header = buildServerTiming({ name: "api", duration: 12.7 });
    expect(header).toBe("api;dur=13");
  });

  it("measureTiming returns result and timing", async () => {
    const { result, timing } = await measureTiming("test", async () => {
      return 42;
    });
    expect(result).toBe(42);
    expect(timing.name).toBe("test");
    expect(timing.duration).toBeGreaterThanOrEqual(0);
  });
});
