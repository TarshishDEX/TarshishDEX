import { describe, it, expect } from "vitest";
import {
  formatNumber,
  formatPercent,
  formatCompact,
  formatSignificant,
} from "@/lib/utils/format-number";

describe("formatNumber", () => {
  it("formats with thousand separators and two decimals by default", () => {
    expect(formatNumber(1234567.891)).toBe("1,234,567.89");
  });

  it("formats a plain integer with two decimals", () => {
    expect(formatNumber(42)).toBe("42.00");
  });

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0.00");
  });

  it("formats negative values", () => {
    expect(formatNumber(-1234.5)).toBe("-1,234.50");
  });

  it("respects a custom number of decimals", () => {
    expect(formatNumber(1.23456, 4)).toBe("1.2346");
  });

  it("rounds to zero decimals", () => {
    expect(formatNumber(1234.5, 0)).toBe("1,235");
  });

  it("handles NaN", () => {
    expect(formatNumber(NaN)).toBe("NaN");
  });

  it("handles infinity", () => {
    expect(formatNumber(Infinity)).toBe("∞");
    expect(formatNumber(-Infinity)).toBe("-∞");
  });
});

describe("formatPercent", () => {
  it("prefixes positive values with a plus sign", () => {
    expect(formatPercent(12.34)).toBe("+12.34%");
  });

  it("formats negative values", () => {
    expect(formatPercent(-5.6)).toBe("-5.60%");
  });

  it("formats zero", () => {
    expect(formatPercent(0)).toBe("+0.00%");
  });

  it("rounds to the configured number of decimals", () => {
    expect(formatPercent(12, 0)).toBe("+12%");
    expect(formatPercent(99.999)).toBe("+100.00%");
  });
});

describe("formatCompact", () => {
  it("abbreviates thousands with K", () => {
    expect(formatCompact(1200)).toBe("1.2K");
  });

  it("abbreviates millions with M", () => {
    expect(formatCompact(1_500_000)).toBe("1.5M");
  });

  it("abbreviates billions with B", () => {
    expect(formatCompact(2_000_000_000)).toBe("2B");
  });

  it("keeps small numbers unmodified", () => {
    expect(formatCompact(999)).toBe("999");
    expect(formatCompact(12.34)).toBe("12.34");
  });

  it("formats zero", () => {
    expect(formatCompact(0)).toBe("0");
  });

  it("limits to two fraction digits for large values", () => {
    expect(formatCompact(123_456_789)).toBe("123.46M");
  });
});

describe("formatSignificant", () => {
  it("uses four significant digits by default", () => {
    expect(formatSignificant(12345.678)).toBe("12,350");
    expect(formatSignificant(3.14159)).toBe("3.142");
  });

  it("preserves precision of small numbers", () => {
    expect(formatSignificant(0.000123456)).toBe("0.0001235");
  });

  it("formats negative values", () => {
    expect(formatSignificant(-0.000123456)).toBe("-0.0001235");
  });

  it("formats zero without significant digits", () => {
    expect(formatSignificant(0)).toBe("0");
  });

  it("respects a custom significant digit count", () => {
    expect(formatSignificant(123456789, 2)).toBe("120,000,000");
  });

  it("formats simple integers without truncation", () => {
    expect(formatSignificant(42)).toBe("42");
  });
});
