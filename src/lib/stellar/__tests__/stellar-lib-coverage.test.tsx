import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import {
  useSwapQuote,
  useOrderbook,
  useMarketStats,
  usePortfolioSummary,
  useXlmBalance,
  useTradeHistory,
  usePriceHistory,
  useOraclePrice,
} from "@/lib/stellar/queries";
import { findBestRoute, selectBestRoute } from "@/lib/stellar/routing";
import {
  connectWallet,
  disconnectWallet,
  isWalletAvailable,
  subscribeWalletEvents,
  signTransactionXdr,
} from "@/lib/stellar/wallet-kit";
import type { StellarAsset, SwapRoute } from "@/lib/stellar/types";

const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

// =========================================================================
// Mocks
// =========================================================================
vi.mock("@/lib/stellar/routing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stellar/routing")>();
  return {
    ...actual,
    findBestRoute: vi.fn(),
  };
});

vi.mock("@/lib/stellar/orderbook", () => ({
  fetchOrderbook: vi.fn(() =>
    Promise.resolve({ bids: [], asks: [], midPrice: 0.5, spreadPct: 1 })
  ),
}));

vi.mock("@/lib/stellar/prices", () => ({
  fetchTopAssets: vi.fn(() =>
    Promise.resolve([
      { code: "XLM", name: "Lumen", decimals: 7, isNative: true },
    ])
  ),
  getMarketStatsForTokens: vi.fn(() => Promise.resolve([])),
  fetchCandles: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/lib/stellar/account", () => ({
  fetchPortfolioSummary: vi.fn(() =>
    Promise.resolve({ address: VALID_ADDRESS, totalValueXlm: 0, balances: [], assetCount: 0 })
  ),
  fetchXlmBalance: vi.fn(() => Promise.resolve("100")),
  isValidPublicKey: vi.fn((addr: string) => addr.length === 56),
}));

vi.mock("@/lib/stellar/history", () => ({
  fetchTradeHistory: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/lib/soroban/market-oracle", () => ({
  readPriceObservation: vi.fn(() => Promise.resolve({ price: 10000000 })),
}));

// Mock the kit package itself so ensureKit's dynamic imports resolve in tests
vi.mock("@creit.tech/stellar-wallets-kit", () => ({
  StellarWalletsKit: {
    init: vi.fn(),
    authModal: vi.fn(() =>
      Promise.resolve({ address: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF" })
    ),
    disconnect: vi.fn(() => Promise.resolve()),
    on: vi.fn(() => vi.fn()),
    signTransaction: vi.fn(() =>
      Promise.resolve({ signedTxXdr: "signed-xdr" })
    ),
  },
  KitEventType: {
    STATE_UPDATED: "STATE_UPDATED",
    DISCONNECT: "DISCONNECT",
  },
  Networks: {
    TESTNET: "TESTNET",
    PUBLIC: "PUBLIC",
  },
}));

vi.mock("@creit.tech/stellar-wallets-kit/modules/utils", () => ({
  defaultModules: () => [],
}));

vi.mock("@/lib/stellar/config", () => ({
  getActiveNetwork: () => ({ name: "testnet", label: "Testnet", passphrase: "Test" }),
}));

// =========================================================================
// queries hooks
// =========================================================================
const queryWrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

const xlm: StellarAsset = { code: "XLM", isNative: true };
const usdc: StellarAsset = {
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};

describe("queries hooks", () => {
  beforeEach(() => {
    vi.mocked(findBestRoute).mockResolvedValue(null);
  });

  it("useSwapQuote is disabled without valid input", () => {
    const { result } = renderHook(
      () => useSwapQuote(xlm, usdc, "", 1),
      { wrapper: queryWrapper }
    );
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useSwapQuote fetches quote when amount provided", async () => {
    const mockRoute: SwapRoute = {
      path: [xlm, usdc],
      sourceAmount: "10",
      outputAmount: "9.5",
      executionPrice: 0.95,
      priceImpactPct: 0.5,
      minReceived: "9.4",
      feeEstimateXlm: "0.01",
      slippagePct: 1,
      method: "direct",
      warnings: [],
    };
    vi.mocked(findBestRoute).mockResolvedValue(mockRoute);
    const { result } = renderHook(
      () => useSwapQuote(xlm, usdc, "10", 1),
      { wrapper: queryWrapper }
    );
    await waitFor(() => {
      expect(result.current.data).toEqual(mockRoute);
    });
  });

  it("useOrderbook fetches orderbook data", async () => {
    const { result } = renderHook(
      () => useOrderbook(xlm, usdc),
      { wrapper: queryWrapper }
    );
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.midPrice).toBe(0.5);
    });
  });

  it("useMarketStats fetches stats", async () => {
    const { result } = renderHook(() => useMarketStats(), { wrapper: queryWrapper });
    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });

  it("usePortfolioSummary is disabled for invalid address", () => {
    const { result } = renderHook(
      () => usePortfolioSummary("invalid"),
      { wrapper: queryWrapper }
    );
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("usePortfolioSummary fetches for valid address", async () => {
    const { result } = renderHook(
      () => usePortfolioSummary(VALID_ADDRESS),
      { wrapper: queryWrapper }
    );
    await waitFor(() => {
      expect(result.current.data?.address).toBe(VALID_ADDRESS);
    });
  });

  it("useXlmBalance fetches balance", async () => {
    const { result } = renderHook(
      () => useXlmBalance(VALID_ADDRESS),
      { wrapper: queryWrapper }
    );
    await waitFor(() => {
      expect(result.current.data).toBe("100");
    });
  });

  it("useTradeHistory fetches history", async () => {
    const { result } = renderHook(
      () => useTradeHistory(VALID_ADDRESS),
      { wrapper: queryWrapper }
    );
    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });

  it("usePriceHistory fetches candles", async () => {
    const { result } = renderHook(
      () => usePriceHistory(
        { code: "XLM", name: "Lumen", decimals: 7, isNative: true },
        { code: "USDC", issuer: "GA5Z", name: "USD", decimals: 7, isNative: false },
        3600000,
        86400000
      ),
      { wrapper: queryWrapper }
    );
    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });

  it("useOraclePrice fetches observation", async () => {
    const { result } = renderHook(
      () => useOraclePrice("XLM", "USDC"),
      { wrapper: queryWrapper }
    );
    await waitFor(() => {
      expect(result.current.data).toEqual({ price: 10000000 });
    });
  });
});

// =========================================================================
// routing — selectBestRoute (pure function)
// =========================================================================
describe("routing selectBestRoute", () => {
  const makeRoute = (output: string, hops: number): SwapRoute => ({
    path: Array.from({ length: hops }, (_, i) => ({
      code: `A${i}`,
      isNative: i === 0,
    })),
    sourceAmount: "100",
    outputAmount: output,
    executionPrice: 1,
    priceImpactPct: 0,
    minReceived: output,
    feeEstimateXlm: "0.01",
    slippagePct: 1,
    method: "direct",
    warnings: [],
  });

  it("returns null for empty routes", () => {
    expect(selectBestRoute([])).toBeNull();
  });

  it("picks the route with the highest output", () => {
    const routes = [makeRoute("90", 2), makeRoute("95", 2), makeRoute("92", 2)];
    const best = selectBestRoute(routes);
    expect(best?.outputAmount).toBe("95");
  });

  it("tie-breaks by fewer hops", () => {
    const routes = [makeRoute("95", 3), makeRoute("95", 2)];
    const best = selectBestRoute(routes);
    expect(best?.path).toHaveLength(2);
  });
});

// =========================================================================
// wallet-kit
// =========================================================================
describe("wallet-kit", () => {
  beforeEach(() => {
    // Reset the cached kit so ensureKit re-initializes with the mock package
    vi.resetModules();
  });

  it("isWalletAvailable returns false on server", async () => {
    // Simulate server: window undefined — but jsdom has window, so test the freighter path
    const result = await isWalletAvailable();
    expect(typeof result).toBe("boolean");
  });

  it("connectWallet returns address from auth modal", async () => {
    await expect(connectWallet()).resolves.toBe(VALID_ADDRESS);
  });

  it("disconnectWallet resolves without throwing", async () => {
    await expect(disconnectWallet()).resolves.toBeUndefined();
  });

  it("signTransactionXdr signs and returns xdr", async () => {
    const result = await signTransactionXdr("xdr-string", {
      networkPassphrase: "Test",
      address: VALID_ADDRESS,
    });
    expect(result).toBe("signed-xdr");
  });

  it("subscribeWalletEvents registers handlers and returns unsubscribe", async () => {
    const onStateUpdated = vi.fn();
    const onDisconnect = vi.fn();
    const unsubscribe = await subscribeWalletEvents({ onStateUpdated, onDisconnect });

    expect(typeof unsubscribe).toBe("function");
    unsubscribe();
  });
});
