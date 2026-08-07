import { describe, it, expect } from "vitest";
import { buildQueryString } from "./url";

describe("buildQueryString", () => {
  it("builds query string from params", () => {
    const result = buildQueryString({ foo: "bar", baz: "qux" });
    expect(result).toBe("foo=bar&baz=qux");
  });

  it("handles empty object", () => {
    expect(buildQueryString({})).toBe("");
  });

  it("encodes special characters", () => {
    const result = buildQueryString({ q: "hello world" });
    expect(result).toContain("q=hello%20world");
  });
});
