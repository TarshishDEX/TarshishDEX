import { describe, it, expect } from "vitest";
import { needsTrustline, intermediatePath, classifySwapError } from "@/lib/stellar/swap-execution";
import type { StellarAsset } from "@/lib/stellar/types";

const XLM: StellarAsset = { code: "XLM", isNative: true };
const USDC: StellarAsset = {
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};
const EURMTL: StellarAsset = {
  code: "EURMTL",
  issuer: "GACKTN5DAZGWXRWB2WLM6OPBDHAMT6SJNGLJZPQMEZBUR4JUGBX2UK7V",
};

describe("needsTrustline", () => {
  it("returns false for native XLM output", () => {
    expect(needsTrustline([], XLM)).toBe(false);
  });

  it("returns true when balance missing for non-native asset", () => {
    expect(needsTrustline([], USDC)).toBe(true);
  });

  it("returns false when trustline exists", () => {
    const balances = [
      { asset_type: "native", balance: "100" },
      {
        asset_type: "credit_alphanum4",
        asset_code: "USDC",
        asset_issuer: USDC.issuer!,
        balance: "50",
      },
    ];
    expect(needsTrustline(balances, USDC)).toBe(false);
  });

  it("returns true when trustline has different issuer", () => {
    const balances = [
      {
        asset_type: "credit_alphanum4",
        asset_code: "USDC",
        asset_issuer: "GDifferentIssuer",
        balance: "50",
      },
    ];
    expect(needsTrustline(balances, USDC)).toBe(true);
  });
});

describe("intermediatePath", () => {
  it("returns empty array for direct swap (2 assets)", () => {
    expect(intermediatePath([XLM, USDC])).toEqual([]);
  });

  it("returns middle assets for multi-hop (3+ assets)", () => {
    expect(intermediatePath([XLM, EURMTL, USDC])).toEqual([EURMTL]);
  });

  it("returns empty array for single asset", () => {
    expect(intermediatePath([XLM])).toEqual([]);
  });
});

describe("classifySwapError", () => {
  function err(msg: string): Error {
    return new Error(msg);
  }

  it("classifies underfunded errors as insufficient-balance", () => {
    expect(classifySwapError(err("op_underfunded"))).toBe("insufficient-balance");
    expect(classifySwapError(err("insufficient balance"))).toBe("insufficient-balance");
  });

  it("classifies rejection errors as user-cancelled", () => {
    expect(classifySwapError(err("user cancelled"))).toBe("user-cancelled");
    expect(classifySwapError(err("transaction rejected"))).toBe("user-cancelled");
  });

  it("classifies network errors", () => {
    expect(classifySwapError(err("network timeout"))).toBe("network");
    expect(classifySwapError(err("fetch failed"))).toBe("network");
  });

  it("classifies invalid transaction errors", () => {
    expect(classifySwapError(err("invalid transaction"))).toBe("invalid-transaction");
    expect(classifySwapError(err("malformed XDR"))).toBe("invalid-transaction");
  });

  it("returns unknown for unrecognized errors", () => {
    expect(classifySwapError(err("something unexpected"))).toBe("unknown");
  });

  it("returns unknown for non-Error objects", () => {
    expect(classifySwapError("string error")).toBe("unknown");
    expect(classifySwapError(null)).toBe("unknown");
  });
});
