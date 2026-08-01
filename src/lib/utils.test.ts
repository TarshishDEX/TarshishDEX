import { describe, expect, it } from "vitest";
import {
  cn,
  formatCompact,
  formatNumber,
  formatPercent,
  formatPrice,
  normalizeAmount,
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
