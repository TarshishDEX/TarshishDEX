import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isValidPublicKey,
  fetchXlmBalance,
  fetchPortfolioSummary,
} from "@/lib/stellar/account";
import type { PortfolioSummary } from "@/lib/stellar/account";

// ── Mock Horizon ───────────────────────────────────────────────────────
const { mockAccountCall, mockOrderbookCall } = vi.hoisted(() => ({
  mockAccountCall: vi.fn(),
  mockOrderbookCall: vi.fn(),
}));

vi.mock("@/lib/stellar/horizon", () => ({
  getHorizonServer: () => ({
    accounts: () => ({
      accountId: () => ({ call: mockAccountCall }),
    }),
  }),
}));

vi.mock("@/lib/stellar/orderbook", () => ({
  fetchOrderbook: mockOrderbookCall,
}));

describe("isValidPublicKey", () => {
  it("accepts valid Stellar public keys", () => {
    expect(
      isValidPublicKey(
        "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
      )
    ).toBe(true);
    expect(
      isValidPublicKey(
        "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
      )
    ).toBe(true);
  });

  it("rejects strings that are too short", () => {
    expect(isValidPublicKey("GA5Z")).toBe(false);
    expect(isValidPublicKey("G")).toBe(false);
  });

  it("rejects strings that are too long", () => {
    expect(isValidPublicKey("G" + "A".repeat(56))).toBe(false);
  });

  it("rejects strings not starting with G", () => {
    expect(isValidPublicKey("S" + "A".repeat(55))).toBe(false);
  });

  it("rejects empty strings", () => {
    expect(isValidPublicKey("")).toBe(false);
  });

  it("trims whitespace before validation", () => {
    expect(
      isValidPublicKey(
        "  GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN  "
      )
    ).toBe(true);
  });

  it("rejects invalid base32 characters", () => {
    expect(isValidPublicKey("G" + "0".repeat(55))).toBe(false);
    expect(isValidPublicKey("G" + "1".repeat(55))).toBe(false);
  });

  it("rejects keys with spaces in the middle", () => {
    expect(
      isValidPublicKey(
        "GA5ZSE JYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
      )
    ).toBe(false);
  });
});

describe("fetchXlmBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns native balance when account exists", async () => {
    mockAccountCall.mockResolvedValue({
      balances: [
        { asset_type: "native", balance: "123.4567890" },
        {
          asset_type: "credit_alphanum4",
          asset_code: "USDC",
          asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          balance: "500.0000000",
        },
      ],
    });
    const balance = await fetchXlmBalance(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    expect(balance).toBe("123.4567890");
  });

  it("returns '0' when account has no native balance", async () => {
    mockAccountCall.mockResolvedValue({
      balances: [
        {
          asset_type: "credit_alphanum4",
          asset_code: "USDC",
          asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          balance: "500.0000000",
        },
      ],
    });
    const balance = await fetchXlmBalance(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    expect(balance).toBe("0");
  });

  it("returns null when Horizon call fails", async () => {
    mockAccountCall.mockRejectedValue(new Error("Account not found"));
    const balance = await fetchXlmBalance("GINVALIDKEY");
    expect(balance).toBeNull();
  });

  it("returns '0' for empty balances array", async () => {
    mockAccountCall.mockResolvedValue({ balances: [] });
    const balance = await fetchXlmBalance(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    expect(balance).toBe("0");
  });
});

describe("fetchPortfolioSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns total value and balances for an account with XLM only", async () => {
    mockAccountCall.mockResolvedValue({
      balances: [{ asset_type: "native", balance: "100.0000000" }],
    });

    const summary = await fetchPortfolioSummary(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    expect(summary.address).toBe(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    expect(summary.totalValueXlm).toBe(100);
    expect(summary.balances).toHaveLength(1);
    const xlm = summary.balances[0]!;
    expect(xlm.token.code).toBe("XLM");
    expect(xlm.balance).toBe(100);
    expect(xlm.valueInXlm).toBe(100);
    expect(xlm.trustline).toBe(false);
    expect(summary.assetCount).toBe(1);
  });

  it("includes issued assets with orderbook pricing", async () => {
    mockAccountCall.mockResolvedValue({
      balances: [
        { asset_type: "native", balance: "50.0000000" },
        {
          asset_type: "credit_alphanum4",
          asset_code: "USDC",
          asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          balance: "200.0000000",
        },
      ],
    });

    mockOrderbookCall.mockResolvedValue({
      midPrice: 0.1, // 1 USDC = 0.1 XLM
      bestBid: 0.099,
      bestAsk: 0.101,
      bids: [],
      asks: [],
    });

    const summary = await fetchPortfolioSummary(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    expect(summary.balances).toHaveLength(2);
    const usdc = summary.balances.find((b) => b.token.code === "USDC");
    expect(usdc).toBeDefined();
    expect(usdc!.balance).toBe(200);
    expect(usdc!.valueInXlm).toBe(20); // 200 * 0.1
    expect(usdc!.trustline).toBe(true);
    // Total: 50 XLM + 20 XLM worth of USDC
    expect(summary.totalValueXlm).toBe(70);
  });

  it("filters out zero-balance entries", async () => {
    mockAccountCall.mockResolvedValue({
      balances: [
        { asset_type: "native", balance: "100.0000000" },
        {
          asset_type: "credit_alphanum4",
          asset_code: "USDC",
          asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          balance: "0.0000000",
        },
      ],
    });

    const summary = await fetchPortfolioSummary(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    // Only the XLM balance should be included
    expect(summary.balances).toHaveLength(1);
    expect(summary.balances[0]!.token.code).toBe("XLM");
  });

  it("skips liquidity pool shares", async () => {
    mockAccountCall.mockResolvedValue({
      balances: [
        { asset_type: "native", balance: "100.0000000" },
        { asset_type: "liquidity_pool_shares", balance: "5.0000000" },
      ],
    });

    const summary = await fetchPortfolioSummary(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    expect(summary.balances).toHaveLength(1);
    expect(summary.balances[0]!.token.code).toBe("XLM");
  });

  it("handles assets with unavailable orderbook gracefully", async () => {
    mockAccountCall.mockResolvedValue({
      balances: [
        { asset_type: "native", balance: "10.0000000" },
        {
          asset_type: "credit_alphanum4",
          asset_code: "RARE",
          asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          balance: "1000.0000000",
        },
      ],
    });

    mockOrderbookCall.mockRejectedValue(new Error("No orderbook"));

    const summary = await fetchPortfolioSummary(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    expect(summary.balances).toHaveLength(2);
    const rare = summary.balances.find((b) => b.token.code === "RARE");
    expect(rare).toBeDefined();
    expect(rare!.valueInXlm).toBeNull();
    // Total should be just the XLM value since RARE has null value
    expect(summary.totalValueXlm).toBe(10);
  });

  it("sorts balances by value descending", async () => {
    mockAccountCall.mockResolvedValue({
      balances: [
        { asset_type: "native", balance: "10.0000000" },
        {
          asset_type: "credit_alphanum4",
          asset_code: "BIG",
          asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          balance: "1000.0000000",
        },
      ],
    });

    mockOrderbookCall.mockResolvedValue({
      midPrice: 5, // BIG at 5 XLM each → 5000 XLM value
      bestBid: 4.9,
      bestAsk: 5.1,
      bids: [],
      asks: [],
    });

    const summary = await fetchPortfolioSummary(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    // BIG should be first (5000 > 10)
    expect(summary.balances[0]!.token.code).toBe("BIG");
    expect(summary.balances[1]!.token.code).toBe("XLM");
  });

  it("handles negative balance as zero (filtered out)", async () => {
    mockAccountCall.mockResolvedValue({
      balances: [
        { asset_type: "native", balance: "100.0000000" },
        {
          asset_type: "credit_alphanum4",
          asset_code: "NEG",
          asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          balance: "-5.0000000",
        },
      ],
    });

    const summary = await fetchPortfolioSummary(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    // Negative balance should be filtered out
    expect(summary.balances).toHaveLength(1);
    expect(summary.balances[0]!.token.code).toBe("XLM");
  });

  it("handles midPrice null from orderbook", async () => {
    mockAccountCall.mockResolvedValue({
      balances: [
        { asset_type: "native", balance: "50.0000000" },
        {
          asset_type: "credit_alphanum4",
          asset_code: "THIN",
          asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          balance: "100.0000000",
        },
      ],
    });

    mockOrderbookCall.mockResolvedValue({
      midPrice: null, // No mid price available
      bestBid: null,
      bestAsk: null,
      bids: [],
      asks: [],
    });

    const summary = await fetchPortfolioSummary(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    const thin = summary.balances.find((b) => b.token.code === "THIN");
    expect(thin).toBeDefined();
    expect(thin!.valueInXlm).toBeNull();
    // XLM should sort first (nulls sort after values with ?? 0)
    expect(summary.balances[0]!.token.code).toBe("XLM");
  });

  it("sorts multiple null-valued assets consistently", async () => {
    mockAccountCall.mockResolvedValue({
      balances: [
        { asset_type: "native", balance: "100.0000000" },
        {
          asset_type: "credit_alphanum4",
          asset_code: "NULLA",
          asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          balance: "50.0000000",
        },
        {
          asset_type: "credit_alphanum4",
          asset_code: "NULLB",
          asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          balance: "25.0000000",
        },
      ],
    });

    // Both issued assets fail to price → null valueInXlm
    mockOrderbookCall.mockRejectedValue(new Error("No orderbook"));

    const summary = await fetchPortfolioSummary(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    expect(summary.balances).toHaveLength(3);
    // XLM with value should come first, nulls after
    expect(summary.balances[0]!.token.code).toBe("XLM");
    expect(summary.balances[0]!.valueInXlm).toBe(100);
    // Both nulls sort with ?? 0, so their relative order is stable
    expect(summary.balances[1]!.valueInXlm).toBeNull();
    expect(summary.balances[2]!.valueInXlm).toBeNull();
  });

  it("returns correct assetCount", async () => {
    mockAccountCall.mockResolvedValue({
      balances: [
        { asset_type: "native", balance: "1.0000000" },
        {
          asset_type: "credit_alphanum4",
          asset_code: "A",
          asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          balance: "1.0000000",
        },
        {
          asset_type: "credit_alphanum4",
          asset_code: "B",
          asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          balance: "1.0000000",
        },
      ],
    });

    mockOrderbookCall.mockResolvedValue({
      midPrice: 1,
      bestBid: 0.99,
      bestAsk: 1.01,
      bids: [],
      asks: [],
    });

    const summary = await fetchPortfolioSummary(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    expect(summary.assetCount).toBe(3);
  });
});
