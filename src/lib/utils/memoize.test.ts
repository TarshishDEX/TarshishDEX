import { describe, it, expect, vi } from "vitest";
import { memoize, memoizeWith, createMemoized } from "@/lib/utils/memoize";

describe("memoize", () => {
  it("caches results for same argument", () => {
    const fn = vi.fn((x: number) => x * 2);
    const memoized = memoize(fn);

    expect(memoized(5)).toBe(10);
    expect(memoized(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("recomputes for different arguments", () => {
    const fn = vi.fn((x: number) => x * 2);
    const memoized = memoize(fn);

    expect(memoized(5)).toBe(10);
    expect(memoized(3)).toBe(6);
    expect(memoized(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("works with string arguments", () => {
    const fn = vi.fn((s: string) => s.toUpperCase());
    const memoized = memoize(fn);

    expect(memoized("hello")).toBe("HELLO");
    expect(memoized("hello")).toBe("HELLO");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("memoizeWith", () => {
  it("caches based on key resolver", () => {
    const fn = vi.fn((a: number, b: number) => a + b);
    const memoized = memoizeWith(fn, (a, b) => `${a}-${b}`);

    expect(memoized(1, 2)).toBe(3);
    expect(memoized(1, 2)).toBe(3);
    expect(memoized(2, 1)).toBe(3);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("createMemoized", () => {
  it("caches results and supports clearing", () => {
    const fn = vi.fn((x: number) => x * 3);
    const cached = createMemoized(fn, 10);

    expect(cached.get(5)).toBe(15);
    expect(cached.get(5)).toBe(15);
    expect(fn).toHaveBeenCalledTimes(1);

    cached.clear();
    expect(cached.get(5)).toBe(15);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("evicts oldest entry when cache is full", () => {
    const fn = vi.fn((x: number) => x);
    const cached = createMemoized(fn, 3);

    cached.get(1);
    cached.get(2);
    cached.get(3);
    expect(fn).toHaveBeenCalledTimes(3);

    // This should evict key=1
    cached.get(4);
    expect(fn).toHaveBeenCalledTimes(4);

    // key=1 was evicted, so it recomputes
    cached.get(1);
    expect(fn).toHaveBeenCalledTimes(5);
  });
});
