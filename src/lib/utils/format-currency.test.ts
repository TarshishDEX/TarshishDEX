import { describe, it, expect } from "vitest";
import { formatCurrency } from "./format-currency";

describe("formatCurrency", () => {
  it("formats whole numbers", () => {
    expect(formatCurrency(1000)).toBe("$1,000.00");
  });

  it("formats decimals", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats negative values", () => {
    expect(formatCurrency(-500)).toBe("-$500.00");
  });

  it("formats large numbers with abbreviations", () => {
    expect(formatCurrency(1_000_000, { compact: true })).toContain("M");
  });
});
