import { describe, expect, it } from "vitest";
import {
  parseAddress,
  parseAmount,
  parseAssetParam,
  parseDurationMs,
  parseLimit,
  parseSlippage,
} from "@/lib/api/params";

const USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

describe("parseAssetParam", () => {
  it("parses native XLM", () => {
    expect(parseAssetParam("XLM")).toEqual({ code: "XLM", isNative: true });
  });

  it("parses CODE:ISSUER", () => {
    expect(parseAssetParam(`USDC:${USDC_ISSUER}`)).toEqual({
      code: "USDC",
      issuer: USDC_ISSUER,
    });
  });

  it("rejects invalid input", () => {
    expect(parseAssetParam(null)).toBeNull();
    expect(parseAssetParam("")).toBeNull();
    expect(parseAssetParam("NOTANASSET")).toBeNull();
    expect(parseAssetParam(`USDC:bad`)).toBeNull();
  });
});

describe("parseAddress", () => {
  it("accepts a valid public key", () => {
    // Canonical all-zero test key: G + 52 A's + WHF = 56 characters.
    const address = `G${"A".repeat(52)}WHF`;
    expect(parseAddress(address)).toBe(address);
  });

  it("rejects invalid keys", () => {
    expect(parseAddress(null)).toBeNull();
    expect(parseAddress("GBRANDOM")).toBeNull();
    expect(parseAddress("not-an-address")).toBeNull();
  });
});

describe("parseLimit", () => {
  it("falls back on missing or invalid input", () => {
    expect(parseLimit(null, 10, 50)).toBe(10);
    expect(parseLimit("abc", 10, 50)).toBe(10);
    expect(parseLimit("0", 10, 50)).toBe(10);
    expect(parseLimit("-3", 10, 50)).toBe(10);
    expect(parseLimit("2.5", 10, 50)).toBe(10);
  });

  it("clamps to the max", () => {
    expect(parseLimit("999", 10, 50)).toBe(50);
  });

  it("parses valid integers", () => {
    expect(parseLimit("25", 10, 50)).toBe(25);
  });
});

describe("parseSlippage", () => {
  it("falls back on invalid input", () => {
    expect(parseSlippage(null)).toBe(1);
    expect(parseSlippage("nan")).toBe(1);
    expect(parseSlippage("0")).toBe(1);
    expect(parseSlippage("51")).toBe(1);
  });

  it("parses valid values", () => {
    expect(parseSlippage("2.5")).toBe(2.5);
    expect(parseSlippage("0.5")).toBe(0.5);
    expect(parseSlippage("50")).toBe(50);
  });
});

describe("parseAmount", () => {
  it("parses positive decimals", () => {
    expect(parseAmount("100")).toBe("100");
    expect(parseAmount("12.5")).toBe("12.5");
  });

  it("rejects invalid amounts", () => {
    expect(parseAmount(null)).toBeNull();
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
    expect(parseAmount("1e3")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });
});

describe("parseDurationMs", () => {
  it("parses and clamps", () => {
    expect(parseDurationMs("3600000", 60_000, 86_400_000)).toBe(3_600_000);
    expect(parseDurationMs("99999999999", 60_000, 86_400_000)).toBe(86_400_000);
    expect(parseDurationMs(null, 60_000, 86_400_000)).toBe(60_000);
    expect(parseDurationMs("bad", 60_000, 86_400_000)).toBe(60_000);
  });
});
