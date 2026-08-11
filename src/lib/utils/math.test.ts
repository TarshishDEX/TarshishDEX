import { describe, it, expect } from "vitest";
import { clamp, roundTo } from "@/lib/utils/math";

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("returns min when below range", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("returns max when above range", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("handles edge case at boundaries", () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe("roundTo", () => {
  it("rounds to specified decimals", () => {
    expect(roundTo(3.14159, 2)).toBe(3.14);
  });

  it("rounds up correctly", () => {
    expect(roundTo(3.145, 2)).toBe(3.15);
  });

  it("rounds to 0 decimals", () => {
    expect(roundTo(3.7, 0)).toBe(4);
  });

  it("handles 7 decimals (Stellar precision)", () => {
    expect(roundTo(0.12345678, 7)).toBe(0.1234568);
  });
});
