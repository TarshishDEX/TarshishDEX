import { describe, it, expect, vi, afterEach } from "vitest";
import {
  formatFiatCurrency,
  formatToken,
  formatPercentageChange,
} from "@/lib/utils/format-currency";

describe("formatFiatCurrency", () => {
  it("formats USD with en-US locale", () => {
    const result = formatFiatCurrency(1234.56, "USD", "en-US");
    expect(result).toContain("1,234.56");
    expect(result).toContain("$");
  });

  it("formats EUR with de-DE locale", () => {
    const result = formatFiatCurrency(1234.56, "EUR", "de-DE");
    expect(result).toContain("1.234,56");
  });

  it("defaults to auto locale", () => {
    const result = formatFiatCurrency(100, "USD");
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("formats zero", () => {
    const result = formatFiatCurrency(0, "USD", "en-US");
    expect(result).toContain("0.00");
  });

  it("formats negative values", () => {
    const result = formatFiatCurrency(-50, "USD", "en-US");
    expect(result).toContain("-");
  });
});

describe("formatToken", () => {
  it("formats with specified decimals", () => {
    const result = formatToken(1234.5678, 2, "en-US");
    expect(result).toBe("1,234.57");
  });

  it("formats with 7 decimals for Stellar amounts", () => {
    const result = formatToken(0.1234567, 7, "en-US");
    expect(result).toBe("0.1234567");
  });

  it("formats whole numbers without decimals", () => {
    const result = formatToken(100, 0, "en-US");
    expect(result).toBe("100");
  });
});

describe("auto locale resolution", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses navigator.language for auto locale", () => {
    expect(typeof formatToken(5, 2)).toBe("string");
    expect(typeof formatPercentageChange(5)).toBe("string");
  });

  it("falls back to en-US when navigator is undefined", () => {
    vi.stubGlobal("navigator", undefined);
    expect(typeof formatFiatCurrency(5)).toBe("string");
    expect(typeof formatToken(5, 2)).toBe("string");
    expect(typeof formatPercentageChange(5)).toBe("string");
  });
});

describe("formatPercentageChange", () => {
  it("formats positive change", () => {
    const result = formatPercentageChange(5.5, "en-US");
    expect(result).toContain("+");
    expect(result).toContain("5.50%");
  });

  it("formats negative change", () => {
    const result = formatPercentageChange(-3.2, "en-US");
    expect(result).toContain("-");
    expect(result).toContain("3.20%");
  });

  it("formats zero without sign", () => {
    const result = formatPercentageChange(0, "en-US");
    expect(result).not.toContain("+");
    expect(result).not.toContain("-");
  });
});
