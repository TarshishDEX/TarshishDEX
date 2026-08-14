import { describe, expect, it } from "vitest";
import {
  cn,
  formatAmount,
  formatCompact,
  formatNumber,
  formatPercent,
  formatPrice,
  normalizeAmount,
  sanitizeSwapAmount,
  truncateAddress,
} from "@/lib/utils";

describe("cn", () => {
  it("merges conflicting classes with tailwind-merge", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", "text-base")).toBe("text-base");
    // Custom theme colors (text-foreground) are preserved alongside font-size conflicts
    expect(cn("text-sm text-foreground", "text-base")).toBe("text-foreground text-base");
  });

  it("handles falsy values", () => {
    expect(cn("a", null, undefined, false, "b")).toBe("a b");
  });
});

describe("formatNumber", () => {
  it("formats with thousands separators", () => {
    expect(formatNumber(1234567.891)).toBe("1,234,567.891");
  });

  it("respects max fraction digits", () => {
    expect(formatNumber(1.23456789, 3)).toBe("1.235");
  });
});

describe("formatCompact", () => {
  it("formats compactly", () => {
    expect(formatCompact(12456)).toBe("12.46K");
    expect(formatCompact(1_200_000)).toBe("1.2M");
  });
});

describe("formatPrice", () => {
  it("adapts precision for small values", () => {
    expect(formatPrice(0)).toBe("0");
    expect(formatPrice(1.5)).toBe("1.5");
    expect(formatPrice(0.0001234)).toBe("0.0001234");
  });
});

describe("truncateAddress", () => {
  it("truncates long addresses", () => {
    const address = "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    expect(truncateAddress(address)).toBe("GABCDE…567890");
  });

  it("returns short strings unchanged", () => {
    expect(truncateAddress("short")).toBe("short");
  });
});

describe("formatPercent", () => {
  it("adds sign when requested", () => {
    expect(formatPercent(2.5, true)).toBe("+2.50%");
    expect(formatPercent(-1.2)).toBe("-1.20%");
  });
});

describe("normalizeAmount", () => {
  it("converts raw amounts to decimals", () => {
    expect(normalizeAmount("1234500000", 7)).toBe("123.45");
    expect(normalizeAmount("10000000", 7)).toBe("1");
  });

  it("handles negative values", () => {
    expect(normalizeAmount("-50000000", 7)).toBe("-5");
  });
});

describe("sanitizeSwapAmount", () => {
  it("rejects negative values", () => {
    expect(sanitizeSwapAmount("-100")).toBe("100");
    expect(sanitizeSwapAmount("-12.5")).toBe("12.5");
    expect(sanitizeSwapAmount("-")).toBe("");
  });

  it("rejects a leading plus sign", () => {
    expect(sanitizeSwapAmount("+5")).toBe("5");
  });

  it("keeps valid positive decimals unchanged", () => {
    expect(sanitizeSwapAmount("100")).toBe("100");
    expect(sanitizeSwapAmount("12.5")).toBe("12.5");
    expect(sanitizeSwapAmount("0.0001")).toBe("0.0001");
  });

  it("strips non-numeric characters and extra dots", () => {
    expect(sanitizeSwapAmount("1.2.3")).toBe("1.23");
    expect(sanitizeSwapAmount("abc-5x")).toBe("5");
  });
});

describe("formatAmount", () => {
  it("trims trailing zeros to Stellar's 7-decimal precision", () => {
    expect(formatAmount("0.0100000")).toBe("0.01");
    expect(formatAmount("93.5750000")).toBe("93.575");
    expect(formatAmount("93.0000000")).toBe("93");
  });

  it("rounds long decimals to 7 places", () => {
    expect(formatAmount("1.123456789")).toBe("1.1234568");
  });

  it("keeps clean values unchanged", () => {
    expect(formatAmount("97.515")).toBe("97.515");
    expect(formatAmount("0.00002")).toBe("0.00002");
  });

  it("returns 0 for non-finite input", () => {
    expect(formatAmount("not-a-number")).toBe("0");
  });
});
