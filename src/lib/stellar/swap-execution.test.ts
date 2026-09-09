import { describe, it, expect, vi } from "vitest";
import {
  needsTrustline,
  hasTrustlineReserve,
  getBaseReserveXlm,
  TRUSTLINE_RESERVE_XLM,
  intermediatePath,
  classifySwapError,
  buildSwapOperations,
  pollForTransaction,
  AMBIGUOUS_TX_POLL_ATTEMPTS,
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

describe("hasTrustlineReserve", () => {
  it("returns true when no trustline is needed", () => {
    expect(hasTrustlineReserve([], XLM)).toBe(true);
    // A balance that already trusts USDC means no new reserve is needed.
    expect(
      hasTrustlineReserve(
        [{ asset_type: "credit_alphanum4", asset_code: "USDC", asset_issuer: USDC.issuer! }],
        USDC
      )
    ).toBe(true);
  });

  it("returns true when the native balance covers the reserve", () => {
    expect(hasTrustlineReserve([{ asset_type: "native", balance: "0.5" }], USDC)).toBe(true);
    expect(hasTrustlineReserve([{ asset_type: "native", balance: "100" }], USDC)).toBe(true);
  });

  it("returns false when the native balance is below the reserve", () => {
    expect(hasTrustlineReserve([{ asset_type: "native", balance: "0.49" }], USDC)).toBe(false);
    expect(hasTrustlineReserve([{ asset_type: "native", balance: "0" }], USDC)).toBe(false);
  });

  it("treats a missing native balance as zero", () => {
    expect(hasTrustlineReserve([], USDC)).toBe(false);
    expect(hasTrustlineReserve([{ asset_type: "credit_alphanum4" }], USDC)).toBe(false);
  });

  it("exposes the 0.5 XLM base reserve constant", () => {
    expect(TRUSTLINE_RESERVE_XLM).toBe(0.5);
  });

  it("accepts a custom reserve amount (e.g. fetched from Horizon)", () => {
    const balances = [{ asset_type: "native", balance: "0.75" }];
    expect(hasTrustlineReserve(balances, USDC, 1)).toBe(false);
    expect(hasTrustlineReserve(balances, USDC, 0.5)).toBe(true);
  });
});

describe("getBaseReserveXlm", () => {
  it("converts the ledger's base reserve in stroops to XLM", async () => {
    const fetchLatestLedger = vi.fn().mockResolvedValue({ base_reserve_in_stroops: 5_000_000 });
    await expect(getBaseReserveXlm(fetchLatestLedger)).resolves.toBe(0.5);
    expect(fetchLatestLedger).toHaveBeenCalledTimes(1);
  });

  it("falls back to the default when Horizon is unavailable", async () => {
    const fetchLatestLedger = vi.fn().mockRejectedValue(new Error("connection refused"));
    await expect(getBaseReserveXlm(fetchLatestLedger)).resolves.toBe(TRUSTLINE_RESERVE_XLM);
  });

  it("falls back when the ledger omits the reserve field", async () => {
    const fetchLatestLedger = vi.fn().mockResolvedValue({});
    await expect(getBaseReserveXlm(fetchLatestLedger)).resolves.toBe(TRUSTLINE_RESERVE_XLM);
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

describe("pollForTransaction", () => {
  type CallMock = ReturnType<typeof vi.fn<() => Promise<unknown>>>;

  function stubServer(call: CallMock) {
    return {
      transactions: () => ({ transaction: () => ({ call }) }),
    };
  }

  it("returns the hash when the transaction is already confirmed", async () => {
    const call = vi.fn<() => Promise<unknown>>().mockResolvedValue({ hash: "abc123" });
    await expect(pollForTransaction(stubServer(call), "abc123", 3, 0)).resolves.toBe("abc123");
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("returns the hash once the transaction appears on a later attempt", async () => {
    const call = vi
      .fn<() => Promise<unknown>>()
      .mockRejectedValueOnce(new Error("not found"))
      .mockResolvedValue({ hash: "abc123" });
    await expect(pollForTransaction(stubServer(call), "abc123", 3, 0)).resolves.toBe("abc123");
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("returns null when the transaction never appears within the budget", async () => {
    const call = vi.fn<() => Promise<unknown>>().mockRejectedValue(new Error("not found"));
    await expect(pollForTransaction(stubServer(call), "abc123", 3, 0)).resolves.toBeNull();
    expect(call).toHaveBeenCalledTimes(3);
  });

  it("stops polling once the budget is exhausted", async () => {
    const call = vi.fn<() => Promise<unknown>>().mockRejectedValue(new Error("not found"));
    await expect(pollForTransaction(stubServer(call), "abc123", 2, 0)).resolves.toBeNull();
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("exposes a sane default poll budget", () => {
    expect(AMBIGUOUS_TX_POLL_ATTEMPTS).toBeGreaterThan(0);
  });
});
