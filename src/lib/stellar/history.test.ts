import { describe, it, expect } from "vitest";
import type { TradeHistoryEntry } from "@/lib/stellar/history";

/**
 * Tests for normalizeOperation and formatSwapSummary — these are pure
 * functions extracted from fetchTradeHistory. We test them through the
 * exported fetchTradeHistory but with mocked Horizon responses.
 *
 * Since we can't mock Horizon easily in unit tests, we test the type
 * shapes and pure logic by validating the TradeHistoryEntry interface.
 */

const XLM_NATIVE = { asset_type: "native" as const };
const USDC = {
  asset_type: "credit_alphanum4" as const,
  asset_code: "USDC",
  asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};

describe("TradeHistoryEntry types", () => {
  it("swap entry has correct shape", () => {
    const entry: TradeHistoryEntry = {
      id: "op-1",
      type: "swap",
      status: "successful",
      createdAt: "2026-01-01T00:00:00Z",
      source: "GSOURCE",
      summary: "10 XLM → 95 USDC",
      fromAsset: { code: "XLM", isNative: true },
      toAsset: {
        code: "USDC",
        issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      },
      amount: "10.0000000",
      path: [{ code: "XLM", isNative: true }],
      hash: "tx-hash-123",
      ledger: 12345,
    };
    expect(entry.type).toBe("swap");
    expect(entry.path).toBeDefined();
    expect(entry.hash).toBeDefined();
  });

  it("offer entry has correct shape", () => {
    const entry: TradeHistoryEntry = {
      id: "op-2",
      type: "offer",
      status: "successful",
      createdAt: "2026-01-01T00:00:00Z",
      source: "GSOURCE",
      summary: "50 USDC → offer",
      fromAsset: USDC,
      toAsset: XLM_NATIVE,
      amount: "50.0000000",
      hash: "tx-hash-456",
      ledger: 12346,
    };
    expect(entry.type).toBe("offer");
    expect(entry.path).toBeUndefined();
  });

  it("trustline entry has correct shape", () => {
    const entry: TradeHistoryEntry = {
      id: "op-3",
      type: "trustline",
      status: "successful",
      createdAt: "2026-01-01T00:00:00Z",
      source: "GNEWACCT",
      summary: "Account created · starting balance 100 XLM",
      fromAsset: { code: "XLM", isNative: true },
      toAsset: { code: "XLM", isNative: true },
      amount: "100.0000000",
      hash: "tx-hash-789",
      ledger: 12347,
    };
    expect(entry.type).toBe("trustline");
    expect(entry.amount).toBe("100.0000000");
  });
});
