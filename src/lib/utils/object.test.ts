import { describe, it, expect } from "vitest";
import { omit, pick, isEmpty, deepMerge } from "@/lib/utils/object";

describe("omit", () => {
  it("removes specified keys", () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = omit(obj, ["a", "c"]);
    expect(result).toEqual({ b: 2 });
  });

  it("returns empty object when all keys omitted", () => {
    const obj = { a: 1 };
    const result = omit(obj, ["a"]);
    expect(result).toEqual({});
  });

  it("does not mutate original", () => {
    const obj = { a: 1, b: 2 };
    omit(obj, ["a"]);
    expect(obj).toEqual({ a: 1, b: 2 });
  });
});

describe("pick", () => {
  it("keeps only specified keys", () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = pick(obj, ["a", "c"]);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  it("ignores keys not in object", () => {
    const obj = { a: 1 } as Record<string, unknown>;
    const result = pick(obj, ["a", "x"]);
    expect(result).toEqual({ a: 1 });
  });

  it("returns empty for no keys", () => {
    const obj = { a: 1 };
    const result = pick(obj, []);
    expect(result).toEqual({});
  });
});

describe("isEmpty", () => {
  it("returns true for empty object", () => {
    expect(isEmpty({})).toBe(true);
  });

  it("returns false for non-empty object", () => {
    expect(isEmpty({ a: 1 })).toBe(false);
  });
});

describe("deepMerge", () => {
  it("merges flat objects", () => {
    const result = deepMerge({ a: 1, b: 2 } as Record<string, unknown>, { b: 3 });
    expect(result).toEqual({ a: 1, b: 3 });
  });

  it("deeply merges nested objects", () => {
    const result = deepMerge({ a: { x: 1, y: 2 } } as Record<string, unknown>, { a: { y: 99 } });
    expect(result).toEqual({ a: { x: 1, y: 99 } });
  });

  it("replaces arrays (does not merge)", () => {
    const result = deepMerge({ arr: [1, 2, 3] }, { arr: [4, 5] });
    expect(result).toEqual({ arr: [4, 5] });
  });

  it("returns target unchanged for empty source", () => {
    const target = { a: 1, b: { c: 2 } };
    const result = deepMerge(target, {});
    expect(result).toEqual(target);
  });
});
