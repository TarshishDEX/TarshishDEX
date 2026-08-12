import { describe, it, expect } from "vitest";
import {
  formatNumber,
  formatCompact,
  formatPrice,
  truncateAddress,
  formatPercent,
  normalizeAmount,
} from "@/lib/utils";

describe("formatNumber", () => {
  it("formats with commas", () => {
    expect(formatNumber(1234567)).toContain(",");
  });

  it("handles zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("handles decimals", () => {
    const result = formatNumber(1234.56789, 2);
    expect(result).toBe("1,234.57");
  });
});

describe("formatCompact", () => {
  it("formats thousands", () => {
    expect(formatCompact(12345)).toMatch(/12\.\d+K/);
  });

  it("formats millions", () => {
    expect(formatCompact(1234567)).toMatch(/1\.\d+M/);
  });

  it("formats zero", () => {
    expect(formatCompact(0)).toBe("0");
  });
});

describe("formatPrice", () => {
  it("handles zero", () => {
    expect(formatPrice(0)).toBe("0");
  });

  it("formats price >= 1", () => {
    expect(formatPrice(10.5)).toContain("10.5");
  });

  it("formats small price with significant digits", () => {
    const result = formatPrice(0.000012345);
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe("0");
  });
});

describe("truncateAddress", () => {
  it("truncates long address", () => {
    const addr = "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const result = truncateAddress(addr, 6, 6);
    expect(result).toContain("GABCDE");
    expect(result).toContain("UVWXYZ");
    expect(result).toContain("…");
  });

  it("returns short address unchanged", () => {
    expect(truncateAddress("short")).toBe("short");
  });

  it("truncates with default lead/tail", () => {
    const addr = "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    const result = truncateAddress(addr);
    expect(result.split("…")).toHaveLength(2);
  });
});

describe("formatPercent", () => {
  it("formats positive", () => {
    expect(formatPercent(5.5)).toBe("5.50%");
  });

  it("formats with sign", () => {
    expect(formatPercent(3.2, true)).toBe("+3.20%");
  });

  it("formats negative", () => {
    expect(formatPercent(-2.5)).toBe("-2.50%");
  });
});

describe("normalizeAmount", () => {
  it("converts raw amount with 7 decimals", () => {
    const result = normalizeAmount("10000000", 7);
    expect(result).toBe("1");
  });

  it("handles small amount", () => {
    const result = normalizeAmount("5000000", 7);
    expect(result).toBe("0.5");
  });

  it("handles zero", () => {
    expect(normalizeAmount("0", 7)).toBe("0");
  });
});
