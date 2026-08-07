import { describe, it, expect } from "vitest";
import { pipe } from "./pipe";

describe("pipe", () => {
  it("pipes a value through multiple functions", () => {
    const addOne = (x: number) => x + 1;
    const double = (x: number) => x * 2;
    const toString = (x: number) => String(x);

    const result = pipe(5, addOne, double, toString);
    expect(result).toBe("12");
  });

  it("works with single function", () => {
    const fn = (x: string) => x.toUpperCase();
    expect(pipe("hello", fn)).toBe("HELLO");
  });

  it("returns initial value with no functions", () => {
    expect(pipe(42)).toBe(42);
  });
});
