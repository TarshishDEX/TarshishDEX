import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAssetCatalog } from "@/lib/stellar/catalog";

const mockAssetsCall = vi.fn();
const mockForCode = vi.fn();
const mockForIssuer = vi.fn();

function chain() {
  const issuer = { call: mockAssetsCall };
  mockForIssuer.mockReturnValue(issuer);
  const code = { forIssuer: () => issuer, call: mockAssetsCall };
  mockForCode.mockReturnValue(code);
  return {
    forCode: mockForCode,
    forIssuer: mockForIssuer,
    call: mockAssetsCall,
  };
}

vi.mock("@/lib/stellar/horizon", () => ({
  getHorizonServer: () => ({
    assets: () => ({
      limit: () => chain(),
    }),
  }),
}));

vi.mock("@/lib/stellar/tokens", () => ({
  toToken: (code: string, issuer: string) => ({ code, issuer, isNative: !issuer }),
}));

function makeRecord(code: string, issuer: string) {
  return {
    asset_code: code,
    asset_issuer: issuer,
    accounts: {
      authorized: 100,
      authorized_to_maintain_liabilities: 20,
      unauthorized: 5,
    },
    balances: {
      authorized: "5000000.0",
      authorized_to_maintain_liabilities: "1000000.0",
      unauthorized: "1000.0",
    },
    num_claimable_balances: 3,
    num_liquidity_pools: 2,
    flags: {
      auth_required: false,
      auth_revocable: true,
      auth_immutable: false,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchAssetCatalog", () => {
  it("maps Horizon records to catalog entries", async () => {
    mockAssetsCall.mockResolvedValue({
      records: [makeRecord("USDC", "GA5Z..."), makeRecord("EURMTL", "GACK...")],
    });

    const results = await fetchAssetCatalog(10);

    expect(results).toHaveLength(2);
    expect(results[0]!.token.code).toBe("USDC");
    expect(results[0]!.token.issuer).toBe("GA5Z...");
    expect(results[0]!.accounts).toBe(125); // 100 + 20 + 5
    expect(results[0]!.trustlines).toBe(130); // 125 + 3 + 2
    expect(results[0]!.flags.authRequired).toBe(false);
    expect(results[0]!.flags.authRevocable).toBe(true);
  });

  it("computes supply as sum of all balance categories", async () => {
    mockAssetsCall.mockResolvedValue({
      records: [makeRecord("XLM", "")],
    });

    const results = await fetchAssetCatalog();
    // 5,000,000 + 1,000,000 + 1,000 = 6,001,000
    expect(results[0]!.supply).toBe(6001000);
  });

  it("returns empty array when no records", async () => {
    mockAssetsCall.mockResolvedValue({ records: [] });
    const results = await fetchAssetCatalog();
    expect(results).toHaveLength(0);
  });

  it("uses default limit of 24", async () => {
    mockAssetsCall.mockResolvedValue({ records: [] });
    await fetchAssetCatalog();
    expect(mockAssetsCall).toHaveBeenCalled();
  });

  it("filters by code when provided", async () => {
    mockAssetsCall.mockResolvedValue({ records: [] });
    await fetchAssetCatalog(10, "USDC");
    expect(mockAssetsCall).toHaveBeenCalled();
  });

  it("filters by issuer when provided", async () => {
    mockAssetsCall.mockResolvedValue({ records: [] });
    await fetchAssetCatalog(10, undefined, "GA5Z...");
    expect(mockAssetsCall).toHaveBeenCalled();
  });

  it("normalizes the code filter to uppercase for case-insensitive search", async () => {
    mockAssetsCall.mockResolvedValue({ records: [] });
    await fetchAssetCatalog(10, " usdc ");
    expect(mockForCode).toHaveBeenCalledWith("USDC");
  });

  it("normalizes the issuer filter to uppercase for case-insensitive search", async () => {
    mockAssetsCall.mockResolvedValue({ records: [] });
    await fetchAssetCatalog(10, undefined, "ga5zsejyb37jrc5avcia5mop4rhtm335x2kgx3ihojapp5re34k4kzvn");
    expect(mockForIssuer).toHaveBeenCalledWith(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
  });
});
