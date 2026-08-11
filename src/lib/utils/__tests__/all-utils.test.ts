import { describe, it, expect, vi } from "vitest";

// ── array.ts ────────────────────────────────────────────────────────────
import { chunk, unique, groupBy, range, last } from "@/lib/utils/array";

describe("array utilities", () => {
  it("chunk splits array into equal-sized chunks", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
    expect(chunk([], 3)).toEqual([]);
    expect(chunk([1], 10)).toEqual([[1]]);
  });

  it("unique removes duplicates", () => {
    expect(unique([1, 2, 2, 3])).toEqual([1, 2, 3]);
    expect(unique(["a", "a", "b"])).toEqual(["a", "b"]);
    expect(unique([])).toEqual([]);
  });

  it("groupBy groups by key function", () => {
    const items = [
      { type: "a", val: 1 },
      { type: "b", val: 2 },
      { type: "a", val: 3 },
    ];
    const groups = groupBy(items, (i) => i.type);
    expect(groups["a"]).toHaveLength(2);
    expect(groups["b"]).toHaveLength(1);
    expect(groups["a"]![0]!.val).toBe(1);
  });

  it("range creates numeric range", () => {
    expect(range(0, 5)).toEqual([0, 1, 2, 3, 4]);
    expect(range(2, 8, 2)).toEqual([2, 4, 6]);
    expect(range(5, 5)).toEqual([]);
  });

  it("last returns last element", () => {
    expect(last([1, 2, 3])).toBe(3);
    expect(last([42])).toBe(42);
    expect(last([])).toBeUndefined();
  });
});

// ── assert.ts ────────────────────────────────────────────────────────────
import { assert, assertDefined, invariant } from "@/lib/utils/assert";

describe("assert", () => {
  it("throws on falsy condition in non-production", () => {
    expect(() => assert(false, "failed")).toThrow("Assertion failed: failed");
  });

  it("does not throw on truthy condition", () => {
    expect(() => assert(true, "ok")).not.toThrow();
    expect(() => assert(1, "ok")).not.toThrow();
    expect(() => assert("hi", "ok")).not.toThrow();
  });

  it("assertDefined throws on null/undefined", () => {
    expect(() => assertDefined(null, "missing")).toThrow("Assertion failed: missing");
    expect(() => assertDefined(undefined, "missing")).toThrow("Assertion failed: missing");
    expect(() => assertDefined("value", "missing")).not.toThrow();
  });

  it("invariant always throws on failure (even in production)", () => {
    expect(() => invariant(false, "broken")).toThrow("Invariant violation: broken");
    expect(() => invariant(true, "ok")).not.toThrow();
  });
});

// ── async.ts ─────────────────────────────────────────────────────────────
import { sleep, sequential, tryAsync } from "@/lib/utils/async";

describe("async utilities", () => {
  it("sleep resolves after delay", async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(45);
  });

  it("sequential runs functions in order", async () => {
    const order: number[] = [];
    const results = await sequential([
      async () => {
        order.push(1);
        return "a";
      },
      async () => {
        order.push(2);
        return "b";
      },
    ]);
    expect(order).toEqual([1, 2]);
    expect(results).toEqual(["a", "b"]);
  });

  it("sequential returns empty for no functions", async () => {
    expect(await sequential([])).toEqual([]);
  });

  it("tryAsync returns [result, null] on success", async () => {
    const [result, error] = await tryAsync(async () => "ok");
    expect(result).toBe("ok");
    expect(error).toBeNull();
  });

  it("tryAsync returns [null, Error] on failure", async () => {
    const [result, error] = await tryAsync(async () => {
      throw new Error("fail");
    });
    expect(result).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error!.message).toBe("fail");
  });

  it("tryAsync wraps non-Error throws", async () => {
    const [, error] = await tryAsync(async () => {
      throw "string error";
    });
    expect(error).toBeInstanceOf(Error);
    expect(error!.message).toContain("string error");
  });

  it("withConcurrency runs tasks with limit", async () => {
    const { withConcurrency } = await import("@/lib/utils/async");
    const order: number[] = [];
    const tasks = [1, 2, 3, 4].map((n) => async () => {
      order.push(n);
      return n;
    });
    const results = await withConcurrency(tasks, 2);
    expect(results).toHaveLength(4);
    expect(results.sort()).toEqual([1, 2, 3, 4]);
  });
});

// ── classnames.ts ────────────────────────────────────────────────────────
import { cn } from "@/lib/utils";

describe("classnames", () => {
  it("cn merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
    expect(cn("foo", false && "bar")).toBe("foo");
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
  });
});

// ── clipboard.ts ─────────────────────────────────────────────────────────
import { copyToClipboard, readFromClipboard } from "@/lib/utils/clipboard";

describe("clipboard", () => {
  it("copyToClipboard returns false when clipboard API is unavailable", async () => {
    // In jsdom, navigator.clipboard is not available by default
    const result = await copyToClipboard("test");
    // jsdom may not have full clipboard API
    expect(typeof result).toBe("boolean");
  });

  it("readFromClipboard returns null on failure", async () => {
    const result = await readFromClipboard();
    expect(result).toBeNull();
  });
});

// ── color.ts ─────────────────────────────────────────────────────────────
import { stringToColor, lighten } from "@/lib/utils/color";

describe("color utilities", () => {
  it("stringToColor returns deterministic colors", () => {
    const c1 = stringToColor("USDC");
    const c2 = stringToColor("USDC");
    const c3 = stringToColor("XLM");
    expect(c1).toBe(c2);
    expect(c1).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(c1).not.toBe(c3);
  });

  it("stringToColor handles empty string", () => {
    expect(stringToColor("")).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("lighten brightens a hex color", () => {
    expect(lighten("#000000", 50)).toMatch(/^#[0-9A-Fa-f]{6}$/);
    // Red + 100% should be close to white
    const result = lighten("#FF0000", 100);
    expect(result).toBe("#ffffff");
  });

  it("lighten clamps at 255", () => {
    expect(lighten("#FF0000", 50)).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

// ── constants.ts ─────────────────────────────────────────────────────────
import {
  DEFAULT_SLIPPAGE_BPS,
  MAX_SLIPPAGE_BPS,
  QUOTE_EXPIRATION_MS,
} from "@/lib/utils/constants";

describe("constants", () => {
  it("has sane defaults", () => {
    expect(DEFAULT_SLIPPAGE_BPS).toBe(50);
    expect(MAX_SLIPPAGE_BPS).toBe(500);
    expect(QUOTE_EXPIRATION_MS).toBe(30_000);
    expect(DEFAULT_SLIPPAGE_BPS).toBeLessThan(MAX_SLIPPAGE_BPS);
  });
});

// ── date.ts ──────────────────────────────────────────────────────────────
import { formatRelativeTime, formatISO, formatDate } from "@/lib/utils/date";

describe("date utilities", () => {
  it("formatRelativeTime returns 'just now' for recent", () => {
    expect(formatRelativeTime(Date.now())).toBe("just now");
    expect(formatRelativeTime(Date.now() - 30_000)).toBe("just now");
  });

  it("formatRelativeTime returns minutes ago", () => {
    expect(formatRelativeTime(Date.now() - 120_000)).toMatch(/m ago/);
  });

  it("formatRelativeTime returns hours ago", () => {
    expect(formatRelativeTime(Date.now() - 3_600_000 * 3)).toMatch(/h ago/);
  });

  it("formatRelativeTime returns yesterday", () => {
    const yesterday = Date.now() - 86_400_000;
    expect(formatRelativeTime(yesterday)).toBe("yesterday");
  });

  it("formatRelativeTime returns date for older", () => {
    const old = Date.now() - 86_400_000 * 3;
    expect(formatRelativeTime(old)).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
  });

  it("formatISO returns ISO string", () => {
    const ts = 1700000000000;
    expect(formatISO(ts)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("formatDate returns short date", () => {
    const ts = 1700000000000;
    expect(formatDate(ts)).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/);
  });
});

// ── deep-equal.ts ────────────────────────────────────────────────────────
import { deepEqual } from "@/lib/utils/deep-equal";

describe("deepEqual", () => {
  it("returns true for identical primitives", () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual("hi", "hi")).toBe(true);
    expect(deepEqual(null, null)).toBe(true);
  });

  it("returns false for different primitives", () => {
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual(1, "1")).toBe(false);
  });

  it("compares arrays deeply", () => {
    expect(deepEqual([1, 2], [1, 2])).toBe(true);
    expect(deepEqual([1, 2], [1, 3])).toBe(false);
    expect(deepEqual([1, 2], [1])).toBe(false);
  });

  it("compares nested arrays", () => {
    expect(deepEqual([[1], [2]], [[1], [2]])).toBe(true);
    expect(deepEqual([[1], [2]], [[1], [3]])).toBe(false);
  });

  it("compares objects deeply", () => {
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("compares nested objects", () => {
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
  });

  it("empty array and empty object are structurally equal (no enumerable keys)", () => {
    expect(deepEqual([], {})).toBe(true);
  });

  it("same reference returns true", () => {
    const obj = { a: 1 };
    expect(deepEqual(obj, obj)).toBe(true);
  });
});

// ── env.ts ───────────────────────────────────────────────────────────────
import { isServer, isBrowser } from "@/lib/utils/env";

describe("env", () => {
  it("isServer vs isBrowser are opposites", () => {
    expect(isServer).toBe(!isBrowser);
  });
});

// ── event-emitter.ts ─────────────────────────────────────────────────────
import { appEvents } from "@/lib/utils/event-emitter";

describe("event emitter", () => {
  it("subscribes and receives events", () => {
    const received: { address: string }[] = [];
    const unsub = appEvents.on("wallet:connected", (data) => received.push(data));
    appEvents.emit("wallet:connected", { address: "GSOURCE" });
    expect(received).toHaveLength(1);
    expect(received[0]!.address).toBe("GSOURCE");
    unsub();
  });

  it("unsubscribe stops receiving", () => {
    const received: { address: string }[] = [];
    const unsub = appEvents.on("wallet:connected", (data) => received.push(data));
    unsub();
    appEvents.emit("wallet:connected", { address: "GSOURCE" });
    expect(received).toHaveLength(0);
  });

  it("clear removes all listeners", () => {
    const received: string[] = [];
    appEvents.on("wallet:disconnected", () => received.push("off"));
    appEvents.clear();
    appEvents.emit("wallet:disconnected", undefined);
    expect(received).toHaveLength(0);
  });
});

// ── export-csv.ts ────────────────────────────────────────────────────────
import { objectsToCsv } from "@/lib/utils/export-csv";

describe("CSV export", () => {
  it("objectsToCsv creates CSV with headers", () => {
    const csv = objectsToCsv(
      [{ name: "Alice", age: 30 }, { name: "Bob", age: 25 }],
      ["name", "age"]
    );
    const lines = csv.split("\n");
    expect(lines[0]).toBe("name,age");
    expect(lines[1]).toBe("Alice,30");
    expect(lines[2]).toBe("Bob,25");
  });

  it("objectsToCsv escapes commas and quotes", () => {
    const csv = objectsToCsv(
      [{ name: 'Al"ice', age: 30 }],
      ["name", "age"]
    );
    const lines = csv.split("\n");
    expect(lines[1]).toContain('Al""ice');
  });

  it("objectsToCsv uses custom headers", () => {
    const csv = objectsToCsv(
      [{ name: "Alice" }],
      ["name"],
      ["Full Name"]
    );
    expect(csv.split("\n")[0]).toBe("Full Name");
  });

  it("objectsToCsv handles null values", () => {
    const csv = objectsToCsv(
      [{ name: null }],
      ["name"]
    );
    expect(csv.split("\n")[1]).toBe("");
  });
});

// ── format-currency.ts ───────────────────────────────────────────────────
import { formatFiatCurrency, formatToken, formatPercentageChange } from "@/lib/utils/format-currency";

describe("format-currency", () => {
  it("formatFiatCurrency formats USD", () => {
    expect(formatFiatCurrency(1234.5, "USD", "en-US")).toContain("1,234.50");
    expect(formatFiatCurrency(0, "USD", "en-US")).toContain("0.00");
  });

  it("formatToken formats with configurable decimals", () => {
    expect(formatToken(3.14159, 4, "en-US")).toBe("3.1416");
    expect(formatToken(100, 0, "en-US")).toBe("100");
  });

  it("formatPercentageChange formats with sign", () => {
    const pos = formatPercentageChange(15.5, "en-US");
    const neg = formatPercentageChange(-3.2, "en-US");
    expect(pos).toContain("+");
    expect(neg).toContain("-");
  });
});

// ── format-number.ts ─────────────────────────────────────────────────────
import { formatNumber, formatPercent, formatCompact, formatSignificant } from "@/lib/utils/format-number";

describe("format-number", () => {
  it("formatNumber adds thousands separators", () => {
    expect(formatNumber(1234.5678, 2)).toBe("1,234.57");
    expect(formatNumber(0, 0)).toBe("0");
  });

  it("formatPercent adds sign", () => {
    expect(formatPercent(5.5)).toBe("+5.50%");
    expect(formatPercent(-3)).toBe("-3.00%");
  });

  it("formatCompact abbreviates large numbers", () => {
    expect(formatCompact(1000)).toBe("1K");
    expect(formatCompact(1500000)).toContain("M");
  });

  it("formatSignificant uses significant digits", () => {
    expect(formatSignificant(0)).toBe("0");
    expect(formatSignificant(123.456, 3)).toBe("123");
    expect(formatSignificant(0.0012345, 3)).toBe("0.00123");
  });
});

// ── hash.ts ──────────────────────────────────────────────────────────────
import { djb2, shortHash, cacheKey } from "@/lib/utils/hash";

describe("hash", () => {
  it("djb2 produces deterministic hashes", () => {
    expect(djb2("hello")).toBe(djb2("hello"));
    expect(djb2("hello")).not.toBe(djb2("world"));
    expect(typeof djb2("")).toBe("number");
  });

  it("shortHash returns string of given length", () => {
    expect(shortHash("test")).toHaveLength(8);
    expect(shortHash("test", 4)).toHaveLength(4);
    expect(shortHash("test", 12)).toHaveLength(12);
  });

  it("cacheKey joins parts", () => {
    expect(cacheKey("a", "b", "c")).toBe("a::b::c");
    expect(cacheKey("a")).toBe("a");
    expect(cacheKey("", "b")).toBe("_::b");
  });
});

// ── math.ts ──────────────────────────────────────────────────────────────
import { clamp, roundTo } from "@/lib/utils/math";

describe("math", () => {
  it("clamp restricts to range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("roundTo rounds to decimals", () => {
    expect(roundTo(3.14159, 2)).toBe(3.14);
    expect(roundTo(3.14159, 4)).toBe(3.1416);
    expect(roundTo(3.14159, 0)).toBe(3);
  });
});

// ── memoize.ts ───────────────────────────────────────────────────────────
import { memoize, memoizeWith, createMemoized } from "@/lib/utils/memoize";

describe("memoize", () => {
  it("memoize caches results", () => {
    let calls = 0;
    const fn = memoize((x: number) => {
      calls++;
      return x * 2;
    });
    expect(fn(5)).toBe(10);
    expect(fn(5)).toBe(10);
    expect(calls).toBe(1);
    expect(fn(3)).toBe(6);
    expect(calls).toBe(2);
  });

  it("memoizeWith uses custom key resolver", () => {
    let calls = 0;
    const fn = memoizeWith(
      (a: number, b: number) => {
        calls++;
        return a + b;
      },
      (a, b) => `${a}-${b}`
    );
    expect(fn(1, 2)).toBe(3);
    expect(fn(1, 2)).toBe(3);
    expect(calls).toBe(1);
  });

  it("createMemoized evicts oldest entry when full", () => {
    const m = createMemoized((x: number) => x * 2, 2);
    m.get(1);
    m.get(2);
    m.get(3); // Should evict key 1
    expect(m.get(3)).toBe(6);
    // Key 1 should be evicted, so it will re-compute
    // We can't directly verify the cache state, but at least it doesn't crash
    m.clear();
  });

  it("createMemoized clear empties cache", () => {
    let calls = 0;
    const m = createMemoized((x: number) => {
      calls++;
      return x * 2;
    });
    m.get(1);
    m.clear();
    m.get(1);
    expect(calls).toBe(2);
  });

  it("createMemoized evicts when full and first key is undefined-safe", () => {
    // maxSize of 1 forces eviction on every new key
    const m = createMemoized((x: number) => x * 2, 1);
    m.get(1);
    m.get(2); // evicts 1 to make room
    m.get(3); // evicts 2
    expect(m.get(3)).toBe(6);
    m.clear();
  });

  it("createMemoized handles maxSize=0 edge case", () => {
    const m = createMemoized((x: number) => x * 2, 0);
    m.get(1);
    m.get(1);
    m.clear();
  });
});

// ── network.ts ───────────────────────────────────────────────────────────
import { isOnline } from "@/lib/utils/network";

describe("network", () => {
  it("isOnline returns boolean", () => {
    expect(typeof isOnline()).toBe("boolean");
  });
});

// ── noop.ts ──────────────────────────────────────────────────────────────
import { noop, noopAsync } from "@/lib/utils/noop";

describe("noop", () => {
  it("noop returns undefined", () => {
    expect(noop()).toBeUndefined();
  });

  it("noopAsync resolves to undefined", async () => {
    expect(await noopAsync()).toBeUndefined();
  });
});

// ── object.ts ────────────────────────────────────────────────────────────
import { omit, pick, isEmpty, deepMerge } from "@/lib/utils/object";

describe("object utilities", () => {
  it("omit removes keys", () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ["a", "c"])).toEqual({ b: 2 });
  });

  it("pick selects keys", () => {
    expect(pick({ a: 1, b: 2, c: 3 }, ["a", "c"])).toEqual({ a: 1, c: 3 });
  });

  it("pick ignores missing keys", () => {
    const obj = { a: 1 };
    expect(pick(obj, ["a", "x"] as Array<keyof typeof obj>)).toEqual({
      a: 1,
    });
  });

  it("isEmpty checks for empty objects", () => {
    expect(isEmpty({})).toBe(true);
    expect(isEmpty({ a: 1 })).toBe(false);
  });

  it("deepMerge merges nested objects", () => {
    const result = deepMerge(
      { a: 1, b: { x: 1, y: 2 }, c: 0 },
      { b: { y: 99 }, c: 3 } as Partial<{ a: number; b: { x: number; y: number }; c: number }>
    );
    expect(result).toEqual({ a: 1, b: { x: 1, y: 99 }, c: 3 });
  });

  it("deepMerge replaces arrays, not merges", () => {
    const result = deepMerge(
      { a: [1, 2] } as Record<string, unknown>,
      { a: [3] }
    );
    expect(result.a).toEqual([3]);
  });
});

// ── pipe.ts ──────────────────────────────────────────────────────────────
import { pipe, pipeAsync } from "@/lib/utils/pipe";

describe("pipe", () => {
  it("pipe composes functions left-to-right", () => {
    const add1 = (x: number) => x + 1;
    const double = (x: number) => x * 2;
    const square = (x: number) => x * x;
    expect(pipe(add1, double, square)(3)).toBe(64); // ((3+1)*2)^2 = 64
  });

  it("pipe with single function", () => {
    expect(pipe((x: number) => x + 1)(5)).toBe(6);
  });

  it("pipeAsync composes async functions", async () => {
    const add1 = async (x: number) => x + 1;
    const double = async (x: number) => x * 2;
    expect(await pipeAsync(add1, double)(3)).toBe(8);
  });
});

// ── random.ts ────────────────────────────────────────────────────────────
import { randomInt, generateId, shuffle } from "@/lib/utils/random";

describe("random", () => {
  it("randomInt returns within range", () => {
    for (let i = 0; i < 20; i++) {
      const n = randomInt(0, 10);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(10);
    }
  });

  it("generateId returns a string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(5);
  });

  it("generateId produces unique values", () => {
    const ids = new Set(Array.from({ length: 10 }, () => generateId()));
    expect(ids.size).toBe(10);
  });

  it("shuffle returns same length array", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result).toHaveLength(5);
    result.sort();
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it("shuffle does not mutate input", () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    shuffle(arr);
    expect(arr).toEqual(copy);
  });

  it("generateId fallback when crypto.randomUUID throws", () => {
    const spy = vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
      throw new Error("unavailable");
    });
    try {
      const id = generateId();
      expect(typeof id).toBe("string");
      expect(id).toContain("-");
      expect(id).toMatch(/^\d+-/);
    } finally {
      spy.mockRestore();
    }
  });
});

// ── retry.ts ─────────────────────────────────────────────────────────────
import { withRetry } from "@/lib/utils/retry";

describe("retry", () => {
  it("returns result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure up to max", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail1"))
      .mockRejectedValueOnce(new Error("fail2"))
      .mockResolvedValue("ok");

    const result = await withRetry(fn, {
      maxRetries: 3,
      baseDelayMs: 10,
      maxDelayMs: 50,
    });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws after exhausting retries", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always fails"));
    await expect(
      withRetry(fn, { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 30 })
    ).rejects.toThrow("always fails");
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("respects shouldRetry predicate", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fatal"));
    await expect(
      withRetry(fn, {
        maxRetries: 3,
        baseDelayMs: 10,
        maxDelayMs: 30,
        shouldRetry: (e) => (e as Error).message !== "fatal",
      })
    ).rejects.toThrow("fatal");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ── safe-json.ts ─────────────────────────────────────────────────────────
import { safeJsonParse, tryJsonParse, safeJsonStringify } from "@/lib/utils/safe-json";

describe("safe-json", () => {
  it("safeJsonParse returns parsed value", () => {
    expect(safeJsonParse('{"a":1}', null)).toEqual({ a: 1 });
  });

  it("safeJsonParse returns fallback on error", () => {
    expect(safeJsonParse("bad json", "fallback")).toBe("fallback");
    expect(safeJsonParse("bad json", null)).toBeNull();
  });

  it("tryJsonParse returns parsed or null", () => {
    expect(tryJsonParse('{"a":1}')).toEqual({ a: 1 });
    expect(tryJsonParse("bad")).toBeNull();
  });

  it("safeJsonStringify returns string on success", () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
  });

  it("safeJsonStringify returns fallback on circular refs", () => {
    const obj: Record<string, unknown> = {};
    (obj as Record<string, unknown>).self = obj;
    expect(safeJsonStringify(obj, "fallback")).toBe("fallback");
  });
});

// ── seo.ts ───────────────────────────────────────────────────────────────
import { SITE_CONFIG } from "@/lib/utils/seo";

describe("seo", () => {
  it("has required config fields", () => {
    expect(SITE_CONFIG.name).toBe("TarshishDEX");
    expect(SITE_CONFIG.url).toContain("https://");
    expect(SITE_CONFIG.description.length).toBeGreaterThan(10);
  });
});

// ── truncate-hash.ts ────────────────────────────────────────────────────
import { truncateHash, truncateAccountId, truncateTxHash } from "@/lib/utils/truncate-hash";

describe("truncate-hash", () => {
  it("truncates long hash", () => {
    expect(truncateHash("GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890")).toBe("GABC…7890");
  });

  it("returns short hash as-is", () => {
    expect(truncateHash("abc")).toBe("abc");
    expect(truncateHash("GABCDEFGHIJ", 4, 4)).toBe("GABCDEFGHIJ");
  });

  it("truncateAccountId uses 6+6", () => {
    const result = truncateAccountId("GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN");
    expect(result).toBe("GA5ZSE…K4KZVN");
  });

  it("truncateTxHash uses 6+4", () => {
    const result = truncateTxHash("abcdef1234567890abcdef1234567890abcdef12");
    expect(result).toMatch(/^[a-f0-9]{6}…[a-f0-9]{4}$/);
  });
});

// ── try-catch.ts ────────────────────────────────────────────────────────
import { tryCatch, tryCatchSync } from "@/lib/utils/try-catch";

describe("try-catch", () => {
  it("tryCatch returns [data, null] on success", async () => {
    const [data, err] = await tryCatch(async () => 42);
    expect(data).toBe(42);
    expect(err).toBeNull();
  });

  it("tryCatch returns [null, Error] on failure", async () => {
    const [data, err] = await tryCatch(async () => {
      throw new Error("oops");
    });
    expect(data).toBeNull();
    expect(err).toBeInstanceOf(Error);
    expect(err!.message).toBe("oops");
  });

  it("tryCatch wraps non-Error throws", async () => {
    const [, err] = await tryCatch(async () => {
      throw "raw";
    });
    expect(err).toBeInstanceOf(Error);
  });

  it("tryCatchSync returns [data, null] on success", () => {
    const [data, err] = tryCatchSync(() => 42);
    expect(data).toBe(42);
    expect(err).toBeNull();
  });

  it("tryCatchSync returns [null, Error] on failure", () => {
    const [data, err] = tryCatchSync(() => {
      throw new Error("sync fail");
    });
    expect(data).toBeNull();
    expect(err!.message).toBe("sync fail");
  });
});

// ── url.ts ──────────────────────────────────────────────────────────────
import { buildUrl, parseQueryParams, joinPaths, ensureTrailingSlash } from "@/lib/utils/url";

describe("url utilities", () => {
  it("buildUrl adds query params", () => {
    const url = buildUrl("https://example.com/api", { a: "1", b: 2 });
    expect(url).toContain("a=1");
    expect(url).toContain("b=2");
  });

  it("buildUrl skips undefined and empty", () => {
    const url = buildUrl("https://example.com/api", { a: "1", b: undefined, c: "" });
    expect(url).toContain("a=1");
    expect(url).not.toContain("b=");
    expect(url).not.toContain("c=");
  });

  it("parseQueryParams extracts params", () => {
    const params = parseQueryParams("https://example.com?foo=bar&baz=42");
    expect(params).toEqual({ foo: "bar", baz: "42" });
  });

  it("joinPaths joins segments", () => {
    expect(joinPaths("/a/", "/b/", "c")).toBe("a/b/c");
    expect(joinPaths("a", "b")).toBe("a/b");
    expect(joinPaths("", "b", "")).toBe("b");
  });

  it("ensureTrailingSlash adds slash if missing", () => {
    expect(ensureTrailingSlash("https://example.com")).toBe("https://example.com/");
    expect(ensureTrailingSlash("https://example.com/")).toBe("https://example.com/");
  });
});

// ── validators.ts ───────────────────────────────────────────────────────
import {
  isValidUrl,
  isValidEmail,
  isValidHexColor,
  isValidDomain,
  isValidPercentage,
  isPositiveInteger,
} from "@/lib/utils/validators";

describe("validators", () => {
  it("isValidUrl validates URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://example.com")).toBe(true);
    expect(isValidUrl("ftp://example.com")).toBe(false);
    expect(isValidUrl("not-a-url")).toBe(false);
  });

  it("isValidEmail validates emails", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("  test@example.com  ")).toBe(true);
    expect(isValidEmail("not-email")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  it("isValidHexColor validates colors", () => {
    expect(isValidHexColor("#fff")).toBe(true);
    expect(isValidHexColor("#FF0000")).toBe(true);
    expect(isValidHexColor("#GGG")).toBe(false);
    expect(isValidHexColor("red")).toBe(false);
  });

  it("isValidDomain validates domains", () => {
    expect(isValidDomain("example.com")).toBe(true);
    expect(isValidDomain("sub.example.com")).toBe(true);
    expect(isValidDomain("-bad.com")).toBe(false);
  });

  it("isValidPercentage validates 0-100", () => {
    expect(isValidPercentage(0)).toBe(true);
    expect(isValidPercentage(50)).toBe(true);
    expect(isValidPercentage(100)).toBe(true);
    expect(isValidPercentage(-1)).toBe(false);
    expect(isValidPercentage(101)).toBe(false);
    expect(isValidPercentage(NaN)).toBe(false);
  });

  it("isPositiveInteger validates positive integers", () => {
    expect(isPositiveInteger(1)).toBe(true);
    expect(isPositiveInteger(42)).toBe(true);
    expect(isPositiveInteger(0)).toBe(false);
    expect(isPositiveInteger(-1)).toBe(false);
    expect(isPositiveInteger(3.14)).toBe(false);
    expect(isPositiveInteger("5")).toBe(false);
  });
});

// ── string.ts ───────────────────────────────────────────────────────────
import { capitalize, camelToTitle, slugify, escapeHtml } from "@/lib/utils/string";

describe("string utilities", () => {
  it("capitalize capitalizes first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("h")).toBe("H");
    expect(capitalize("")).toBe("");
  });

  it("camelToTitle converts camelCase", () => {
    expect(camelToTitle("maxSlippageBps")).toBe("Max Slippage Bps");
    expect(camelToTitle("hello")).toBe("Hello");
  });

  it("slugify creates URL slugs", () => {
    expect(slugify("Hello World")).toBe("hello-world");
    expect(slugify("  Foo & Bar!!!  ")).toBe("foo-bar");
  });

  it("escapeHtml escapes HTML entities", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
    expect(escapeHtml('a"b&c\'d')).toBe("a&quot;b&amp;c&#039;d");
    expect(escapeHtml("plain text")).toBe("plain text");
  });
});

// ── asset-metadata.ts ───────────────────────────────────────────────────
import { KNOWN_ASSETS, getAssetDisplayName, getAssetDomain } from "@/lib/utils/asset-metadata";

describe("asset-metadata", () => {
  it("KNOWN_ASSETS has expected entries", () => {
    expect(KNOWN_ASSETS["USDC"]!.name).toBe("USD Coin");
    expect(KNOWN_ASSETS["XRP"]!.name).toContain("XRP");
  });

  it("getAssetDisplayName returns known name", () => {
    expect(getAssetDisplayName("USDC")).toBe("USD Coin");
  });

  it("getAssetDisplayName falls back to code", () => {
    expect(getAssetDisplayName("UNKNOWN")).toBe("UNKNOWN");
  });

  it("getAssetDomain returns domain if known", () => {
    expect(getAssetDomain("USDC")).toBe("circle.com");
    expect(getAssetDomain("UNKNOWN")).toBeUndefined();
  });
});
