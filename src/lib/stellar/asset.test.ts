import { describe, expect, it } from "vitest";
import {
  assetToString,
  fromHorizonAssetRecord,
  isSameAsset,
  parseAssetString,
  toSdkAsset,
} from "@/lib/stellar/asset";

// Valid 56-character testnet address (SDF testnet USDC issuer)
const VALID_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

describe("parseAssetString", () => {
  it("parses native XLM", () => {
    expect(parseAssetString("XLM")).toEqual({ code: "XLM", isNative: true });
    expect(parseAssetString("native")).toEqual({ code: "XLM", isNative: true });
  });

  it("parses CODE:ISSUER", () => {
    const result = parseAssetString(`usdc:${VALID_ISSUER}`);
    expect(result).toEqual({
      code: "USDC",
      issuer: VALID_ISSUER,
    });
  });

  it("rejects invalid inputs", () => {
    expect(parseAssetString("")).toBeNull();
    expect(parseAssetString("USDC")).toBeNull(); // missing issuer
    expect(parseAssetString("USDC:not-a-valid-key")).toBeNull();
    expect(parseAssetString("THISCODEISWAYTOOLONG:GA")).toBeNull();
    // base32 excludes 0/1/8/9 — an address containing them is invalid
    expect(parseAssetString("USDC:G" + "A".repeat(54) + "0")).toBeNull();
  });
});

describe("assetToString", () => {
  it("serializes native and issued assets", () => {
    expect(assetToString({ code: "XLM", isNative: true })).toBe("XLM");
    expect(assetToString({ code: "USDC", issuer: VALID_ISSUER })).toBe(`USDC:${VALID_ISSUER}`);
  });
});

describe("isSameAsset", () => {
  it("compares structurally", () => {
    expect(isSameAsset({ code: "XLM", isNative: true }, { code: "XLM" })).toBe(true);
    expect(isSameAsset({ code: "USDC", issuer: "GA" }, { code: "USDC", issuer: "GB" })).toBe(false);
  });
});

describe("toSdkAsset", () => {
  it("builds SDK assets", () => {
    expect(toSdkAsset({ code: "XLM", isNative: true }).isNative()).toBe(true);
    const issued = toSdkAsset({ code: "USDC", issuer: VALID_ISSUER });
    expect(issued.getCode()).toBe("USDC");
    expect(issued.getIssuer()).toBe(VALID_ISSUER);
  });

  it("throws when an issued asset is missing an issuer", () => {
    expect(() => toSdkAsset({ code: "USDC" })).toThrow();
  });
});

describe("fromHorizonAssetRecord", () => {
  it("converts native and issued Horizon records", () => {
    expect(fromHorizonAssetRecord({ asset_type: "native" })).toEqual({
      code: "XLM",
      isNative: true,
    });
    expect(
      fromHorizonAssetRecord({
        asset_type: "credit_alphanum4",
        asset_code: "USDC",
        asset_issuer: VALID_ISSUER,
      })
    ).toEqual({ code: "USDC", issuer: VALID_ISSUER });
  });
});
