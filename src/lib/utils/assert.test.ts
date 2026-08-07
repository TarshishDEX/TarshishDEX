import { describe, it, expect } from "vitest";
import { assert, assertDefined, invariant } from "./assert";

describe("assert", () => {
  it("does not throw when condition is true", () => {
    expect(() => assert(true, "no error")).not.toThrow();
  });

  it("throws when condition is false", () => {
    expect(() => assert(false, "test error")).toThrow("test error");
  });
});

describe("assertDefined", () => {
  it("returns the value when defined", () => {
    expect(assertDefined(42, "should not throw")).toBe(42);
    expect(assertDefined("hello", "should not throw")).toBe("hello");
    expect(assertDefined(false, "should not throw")).toBe(false);
  });

  it("throws when value is null or undefined", () => {
    expect(() => assertDefined(null, "was null")).toThrow("was null");
    expect(() => assertDefined(undefined, "was undefined")).toThrow("was undefined");
  });
});

describe("invariant", () => {
  it("does not throw when condition is true", () => {
    expect(() => invariant(true, "no error")).not.toThrow();
  });

  it("throws InvariantError when condition is false", () => {
    expect(() => invariant(false, "invariant violation")).toThrow("invariant violation");
  });
});
