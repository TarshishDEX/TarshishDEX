import { describe, it, expect } from "vitest";
import { calculateFee, getFeeBps, DEFAULT_FEE_BPS } from "@/lib/stellar/fee-collector";

describe("fee-collector", () => {
  it("calculates 5 bps fee correctly", () => {
    expect(calculateFee("100.0", "direct")).toBe("0.0500000");
  });

  it("calculates 8 bps for multi-hop", () => {
    expect(calculateFee("100.0", "multi-hop")).toBe("0.0800000");
  });

  it("returns zero for zero amount", () => {
    expect(calculateFee("0", "direct")).toBe("0");
  });

  it("returns zero for negative amount", () => {
    expect(calculateFee("-10", "direct")).toBe("0");
  });

  it("getFeeBps returns default for unknown method", () => {
    expect(getFeeBps("unknown")).toBe(DEFAULT_FEE_BPS);
  });

  it("getFeeBps returns correct rate per method", () => {
    expect(getFeeBps("direct")).toBe(5);
    expect(getFeeBps("multi-hop")).toBe(8);
  });
});
