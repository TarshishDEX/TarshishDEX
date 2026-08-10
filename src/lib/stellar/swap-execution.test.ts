import { describe, it, expect } from "vitest";
import {
  needsTrustline,
  intermediatePath,
  classifySwapError,
  buildSwapOperations,
} from "@/lib/stellar/swap-execution";
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

describe("buildSwapOperations", () => {
  const baseParams = {
    address: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    input: XLM,
    output: USDC,
    amountIn: "10",
    minReceived: "9.5",
    path: [XLM, USDC] as StellarAsset[],
    method: "direct",
  };

  it("produces a single pathPaymentStrictSend for native input", () => {
    const ops = buildSwapOperations(baseParams);
    // No fee payment for native XLM (fee collected via base fee mechanism)
    expect(ops.length).toBe(1);
    expect(ops[0]).toBeDefined();
  });

  it("includes fee payment for non-native input with fee > 0", () => {
    const params = {
      ...baseParams,
      input: USDC,
      method: "multi-hop",
    };
    const ops = buildSwapOperations(params);
    // Fee payment + pathPaymentStrictSend
    expect(ops.length).toBe(2);
    expect(ops[0]).toBeDefined();
    expect(ops[1]).toBeDefined();
  });

  it("builds multi-hop path correctly", () => {
    const params = {
      ...baseParams,
      path: [XLM, EURMTL, USDC] as StellarAsset[],
    };
    const ops = buildSwapOperations(params);
    expect(ops.length).toBe(1);
    expect(ops[0]).toBeDefined();
  });
});
