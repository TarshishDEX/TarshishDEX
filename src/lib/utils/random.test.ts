import { describe, it, expect } from "vitest";
import { randomInt, generateId, shuffle } from "@/lib/utils/random";

describe("randomInt", () => {
  it("returns value within range", () => {
    for (let i = 0; i < 100; i++) {
      const value = randomInt(0, 10);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(10);
    }
  });

  it("handles range starting at non-zero", () => {
    for (let i = 0; i < 50; i++) {
      const value = randomInt(5, 15);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThan(15);
    }
  });

  it("returns min when range is 1", () => {
    expect(randomInt(7, 8)).toBe(7);
  });
});

describe("generateId", () => {
  it("generates a string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("generates UUID format", () => {
    const id = generateId();
    // UUID format: 8-4-4-4-12 hex digits
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});

describe("shuffle", () => {
  it("returns array of same length", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result).toHaveLength(5);
  });

  it("contains all original elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("does not mutate the original array", () => {
    const arr = [1, 2, 3];
    const original = [...arr];
    shuffle(arr);
    expect(arr).toEqual(original);
  });

  it("returns new array instance", () => {
    const arr = [1, 2, 3];
    const result = shuffle(arr);
    expect(result).not.toBe(arr);
  });
});
