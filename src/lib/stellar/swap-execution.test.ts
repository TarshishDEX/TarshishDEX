import { describe, expect, it } from "vitest";
import {
  buildSwapTransaction,
  intermediatePath,
  needsTrustline,
} from "@/lib/stellar/swap-execution";

const USDC = { code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" };
const XLM = { code: "XLM", isNative: true };
// Valid testnet public key (all-zero payload) accepted by the SDK's address validation.
const DESTINATION = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

describe("needsTrustline", () => {
  it("returns false for native XLM", () => {
    expect(needsTrustline([], XLM)).toBe(false);
  });

  it("returns true when the issued asset is missing from balances", () => {
    expect(needsTrustline([{ asset_type: "native" }], USDC)).toBe(true);
  });

  it("returns false when a matching trustline exists", () => {
    const balances = [
      { asset_type: "credit_alphanum4", asset_code: "USDC", asset_issuer: USDC.issuer },
    ];
    expect(needsTrustline(balances, USDC)).toBe(false);
  });

  it("ignores unrelated trustlines", () => {
    const balances = [
      { asset_type: "credit_alphanum4", asset_code: "EURT", asset_issuer: "GAAAAA" },
    ];
    expect(needsTrustline(balances, USDC)).toBe(true);
  });
});

describe("intermediatePath", () => {
  it("returns no intermediate hops for a direct route", () => {
    expect(intermediatePath([XLM, USDC])).toHaveLength(0);
  });

  it("returns the bridge asset for a multi-hop route", () => {
    const hops = intermediatePath([XLM, USDC, XLM]);
    expect(hops).toHaveLength(1);
    expect(hops[0].code).toBe("USDC");
  });
});

describe("buildSwapTransaction", () => {
  it("builds a single path-payment operation for a direct swap", () => {
    const operations = buildSwapTransaction({
      address: DESTINATION,
      input: XLM,
      output: USDC,
      amountIn: "100",
      minReceived: "95",
      path: [XLM, USDC],
    });

    expect(operations).toHaveLength(1);
  });

  it("accepts multi-hop routes", () => {
    const operations = buildSwapTransaction({
      address: DESTINATION,
      input: XLM,
      output: XLM,
      amountIn: "100",
      minReceived: "90",
      path: [XLM, USDC, XLM],
    });

    expect(operations).toHaveLength(1);
  });
});
