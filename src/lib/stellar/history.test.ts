import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizeOperation, formatSwapSummary, fetchTradeHistory } from "@/lib/stellar/history";
// ── Mock Horizon ───────────────────────────────────────────────────────
const { mockOperationsCall } = vi.hoisted(() => ({
  mockOperationsCall: vi.fn(),
}));

vi.mock("@/lib/stellar/horizon", () => ({
  getHorizonServer: () => ({
    operations: () => ({
      forAccount: () => ({ order: () => ({ limit: () => ({ call: mockOperationsCall }) }) }),
    }),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("normalizeOperation", () => {
  const baseOp = {
    id: "123",
    source_account: "GSOURCE",
    created_at: "2026-01-01T00:00:00Z",
    ledger: 1000,
    transaction_hash: "tx-hash-123",
  };

  it("normalizes a path_payment_strict_send with multi-hop path", () => {
    const op = {
      ...baseOp,
      type: "path_payment_strict_send",
      source_asset_type: "native",
      source_amount: "100.0000000",
      asset_type: "credit_alphanum4",
      asset_code: "USDC",
      asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      amount: "950.0000000",
      path: [
        {
          asset_type: "credit_alphanum4",
          asset_code: "EURMTL",
          asset_issuer: "GACKTN5DAZGWXRWB2WLM6OPBDHAMT6SJNGLJZPQMEZBUR4JUGBX2UK7V",
        },
      ],
    };
    const entry = normalizeOperation(op);
    expect(entry).not.toBeNull();
    expect(entry!.type).toBe("swap");
    expect(entry!.summary).toBe("100.0000000 XLM → 950.0000000 USDC");
    expect(entry!.path).toHaveLength(1);
    expect(entry!.path![0]!.code).toBe("EURMTL");
    expect(entry!.hash).toBe("tx-hash-123");
    expect(entry!.ledger).toBe(1000);
  });

  it("normalizes a path_payment_strict_send to a swap entry", () => {
    const op = {
      ...baseOp,
      type: "path_payment_strict_send",
      source_asset_type: "native",
      source_amount: "100.0000000",
      asset_type: "credit_alphanum4",
      asset_code: "USDC",
      asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      amount: "950.0000000",
      path: [],
    };
    const entry = normalizeOperation(op);
    expect(entry).not.toBeNull();
    expect(entry!.type).toBe("swap");
    expect(entry!.status).toBe("successful");
    expect(entry!.summary).toBe("100.0000000 XLM → 950.0000000 USDC");
    expect(entry!.fromAsset.code).toBe("XLM");
    expect(entry!.fromAsset.isNative).toBe(true);
    expect(entry!.toAsset.code).toBe("USDC");
    expect(entry!.hash).toBe("tx-hash-123");
    expect(entry!.ledger).toBe(1000);
  });

  it("normalizes a path_payment to a swap entry", () => {
    const op = {
      ...baseOp,
      type: "path_payment",
      source_asset_type: "credit_alphanum4",
      source_asset_code: "USDC",
      source_asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      source_amount: "50.0000000",
      asset_type: "native",
      amount: "5.0000000",
      path: [],
    };
    const entry = normalizeOperation(op);
    expect(entry!.type).toBe("swap");
    expect(entry!.summary).toContain("USDC");
    expect(entry!.summary).toContain("XLM");
  });

  it("normalizes manage_buy_offer to an offer entry", () => {
    const op = {
      ...baseOp,
      type: "manage_buy_offer",
      amount: "100.0000000",
      selling: { asset_type: "native" as const },
      buying: {
        asset_type: "credit_alphanum4" as const,
        asset_code: "USDC",
        asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      },
    };
    const entry = normalizeOperation(op);
    expect(entry).not.toBeNull();
    expect(entry!.type).toBe("offer");
    expect(entry!.summary).toContain("offer");
    expect(entry!.fromAsset.code).toBe("XLM");
    expect(entry!.toAsset.code).toBe("USDC");
    expect(entry!.amount).toBe("100.0000000");
  });

  it("normalizes manage_sell_offer to an offer entry", () => {
    const op = {
      ...baseOp,
      type: "manage_sell_offer",
      amount: "50.0000000",
      selling: {
        asset_type: "credit_alphanum4" as const,
        asset_code: "EURMTL",
        asset_issuer: "GACKTN5DAZGWXRWB2WLM6OPBDHAMT6SJNGLJZPQMEZBUR4JUGBX2UK7V",
      },
      buying: { asset_type: "native" as const },
    };
    const entry = normalizeOperation(op);
    expect(entry!.type).toBe("offer");
    expect(entry!.fromAsset.code).toBe("EURMTL");
    expect(entry!.toAsset.code).toBe("XLM");
  });

  it("normalizes create_account to a trustline entry", () => {
    const op = {
      ...baseOp,
      type: "create_account",
      starting_balance: "100.0000000",
    };
    const entry = normalizeOperation(op);
    expect(entry).not.toBeNull();
    expect(entry!.type).toBe("trustline");
    expect(entry!.summary).toContain("Account created");
    expect(entry!.fromAsset.code).toBe("XLM");
    expect(entry!.toAsset.code).toBe("XLM");
    expect(entry!.amount).toBe("100.0000000");
  });

  it("returns null for unknown operation types", () => {
    const op = { ...baseOp, type: "set_options" };
    expect(normalizeOperation(op)).toBeNull();
  });

  it("handles missing optional fields gracefully", () => {
    const op = {
      id: "456",
      source_account: "GSOURCE",
      created_at: "2026-01-01T00:00:00Z",
      ledger: 500,
      type: "path_payment_strict_send",
      // Missing source_amount, source_asset_code, etc.
      source_asset_type: "native",
      asset_type: "native",
      amount: "10",
      path: [],
    };
    const entry = normalizeOperation(op);
    expect(entry).not.toBeNull();
    expect(entry!.type).toBe("swap");
    expect(entry!.summary).toContain("→");
  });

  it("falls back to op.account when source_account is missing", () => {
    const op = {
      id: "789",
      account: "GACCOUNT",
      created_at: "2026-01-01T00:00:00Z",
      ledger: 1,
      type: "manage_sell_offer",
      amount: "1",
      selling: { asset_type: "native" as const },
      buying: { asset_type: "native" as const },
    };
    const entry = normalizeOperation(op);
    expect(entry!.source).toBe("GACCOUNT");
  });

  it("falls back to native asset when selling/buying is missing", () => {
    const op = {
      id: "999",
      source_account: "GSOURCE",
      created_at: "2026-01-01T00:00:00Z",
      ledger: 1,
      type: "manage_buy_offer",
      amount: "100",
      // No selling or buying — covers the ?? fallback
    };
    const entry = normalizeOperation(op);
    expect(entry).not.toBeNull();
    expect(entry!.type).toBe("offer");
    expect(entry!.fromAsset.code).toBe("XLM");
    expect(entry!.toAsset.code).toBe("XLM");
    expect(entry!.summary).toContain("offer");
  });

  it("handles create_account with missing starting_balance", () => {
    const op = {
      id: "111",
      source_account: "GSOURCE",
      created_at: "2026-01-01T00:00:00Z",
      ledger: 1,
      type: "create_account",
      // No starting_balance — covers the ?? fallback
    };
    const entry = normalizeOperation(op);
    expect(entry).not.toBeNull();
    expect(entry!.type).toBe("trustline");
    expect(entry!.amount).toBe("");
    expect(entry!.summary).toContain("—");
  });

  it("handles path_payment_strict_receive", () => {
    const op = {
      ...baseOp,
      type: "path_payment_strict_receive",
      source_asset_type: "native",
      source_amount: "50",
      asset_type: "credit_alphanum4",
      asset_code: "USDC",
      asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      amount: "5",
      path: [],
    };
    const entry = normalizeOperation(op);
    expect(entry!.type).toBe("swap");
    expect(entry!.summary).toContain("USDC");
  });

  it("handles missing source_account, created_at, ledger, amount, and path", () => {
    const op = {
      id: "bare",
      // No source_account, account, created_at, ledger
      type: "path_payment_strict_send",
      source_asset_type: "native",
      source_amount: "10",
      asset_type: "native",
      // No amount, no path
    };
    const entry = normalizeOperation(op);
    expect(entry).not.toBeNull();
    expect(entry!.source).toBe("");
    expect(entry!.createdAt).toBe("");
    expect(entry!.ledger).toBe(0);
    expect(entry!.amount).toBe("");
    expect(entry!.path).toEqual([]);
  });

  it("handles manage_offer with missing amount", () => {
    const op = {
      id: "noamt",
      source_account: "GSOURCE",
      created_at: "2026-01-01T00:00:00Z",
      ledger: 1,
      type: "manage_sell_offer",
      selling: { asset_type: "native" as const },
      buying: { asset_type: "native" as const },
      // No amount
    };
    const entry = normalizeOperation(op);
    expect(entry).not.toBeNull();
    expect(entry!.amount).toBe("");
    expect(entry!.summary).toContain("—");
  });
});

describe("formatSwapSummary", () => {
  it("formats a native-to-issued swap", () => {
    const summary = formatSwapSummary({
      source_amount: "100",
      source_asset_type: "native",
      amount: "950",
      asset_code: "USDC",
      asset_type: "credit_alphanum4",
    });
    expect(summary).toBe("100 XLM → 950 USDC");
  });

  it("formats an issued-to-native swap", () => {
    const summary = formatSwapSummary({
      source_amount: "50",
      source_asset_code: "USDC",
      source_asset_type: "credit_alphanum4",
      amount: "5",
      asset_type: "native",
    });
    expect(summary).toBe("50 USDC → 5 XLM");
  });

  it("formats an issued-to-issued swap", () => {
    const summary = formatSwapSummary({
      source_amount: "10",
      source_asset_code: "EURMTL",
      source_asset_type: "credit_alphanum4",
      amount: "95",
      asset_code: "USDC",
      asset_type: "credit_alphanum4",
    });
    expect(summary).toBe("10 EURMTL → 95 USDC");
  });

  it("uses placeholder for missing codes", () => {
    const summary = formatSwapSummary({
      source_amount: "10",
      source_asset_type: "credit_alphanum4",
      amount: "95",
      asset_type: "credit_alphanum4",
    });
    expect(summary).toContain("?");
    expect(summary).toContain("→");
  });

  it("uses 'XLM' for native asset_type when code is missing", () => {
    const summary = formatSwapSummary({
      source_amount: "100",
      source_asset_type: "native",
      amount: "950",
      asset_type: "native",
    });
    expect(summary).toBe("100 XLM → 950 XLM");
  });

  it("handles missing source_amount and amount", () => {
    const summary = formatSwapSummary({
      source_asset_code: "USDC",
      source_asset_type: "credit_alphanum4",
      asset_code: "EURMTL",
      asset_type: "credit_alphanum4",
    });
    expect(summary).toContain("— USDC →");
    expect(summary).toContain("— EURMTL");
  });

  it("handles completely missing fields", () => {
    const summary = formatSwapSummary({});
    expect(summary).toContain("—");
    expect(summary).toContain("→");
  });
});

describe("fetchTradeHistory", () => {
  it("returns normalized swap entries from Horizon operations", async () => {
    mockOperationsCall.mockResolvedValue({
      records: [
        {
          id: "op-1",
          source_account: "GSOURCE",
          created_at: "2026-01-01T00:00:00Z",
          ledger: 1000,
          type: "path_payment_strict_send",
          source_asset_type: "native",
          source_amount: "100.0000000",
          asset_type: "credit_alphanum4",
          asset_code: "USDC",
          asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          amount: "950.0000000",
          path: [],
        },
      ],
    });

    const entries = await fetchTradeHistory(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]!.type).toBe("swap");
    expect(entries[0]!.summary).toContain("USDC");
  });

  it("filters out unknown operation types", async () => {
    mockOperationsCall.mockResolvedValue({
      records: [
        {
          id: "op-1",
          source_account: "GSOURCE",
          created_at: "2026-01-01T00:00:00Z",
          ledger: 1000,
          type: "set_options", // unknown → filtered out
        },
        {
          id: "op-2",
          source_account: "GSOURCE",
          created_at: "2026-01-01T00:00:00Z",
          ledger: 1001,
          type: "path_payment_strict_send",
          source_asset_type: "native",
          source_amount: "10",
          asset_type: "native",
          amount: "9.5",
          path: [],
        },
      ],
    });

    const entries = await fetchTradeHistory(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    // Only the path_payment_strict_send should be included
    expect(entries).toHaveLength(1);
    expect(entries[0]!.type).toBe("swap");
  });

  it("returns empty array when all ops are unknown", async () => {
    mockOperationsCall.mockResolvedValue({
      records: [
        {
          id: "op-1",
          source_account: "GSOURCE",
          created_at: "2026-01-01T00:00:00Z",
          ledger: 1000,
          type: "set_options",
        },
        {
          id: "op-2",
          source_account: "GSOURCE",
          created_at: "2026-01-01T00:00:00Z",
          ledger: 1001,
          type: "bump_sequence",
        },
      ],
    });

    const entries = await fetchTradeHistory(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    expect(entries).toEqual([]);
  });
});
