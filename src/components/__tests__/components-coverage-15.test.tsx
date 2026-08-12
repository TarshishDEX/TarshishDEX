import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// =========================================================================
// Hoisted mocks
// =========================================================================

const {
  walletConnectMock,
  walletDisconnectMock,
  signAndSubmitMock,
  executeSwapMock,
  streamAccountMock,
  streamTradesMock,
  fetchCatalogMock,
  useMarketStatsMock,
  useOraclePriceMock,
  useSwapQuoteMock,
  useUserLimitOrdersMock,
  useXlmBalanceMock,
  isWalletAvailableMock,
  chartMock,
  walletState,
} = vi.hoisted(() => {
  const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
  const walletConnect = vi.fn().mockResolvedValue(true);
  const walletDisconnect = vi.fn();
  const state: {
    address: string | null;
    status: string;
    networkPassphrase: string;
    connect: () => Promise<boolean>;
    disconnect: () => Promise<void>;
  } = {
    address: VALID_ADDRESS,
    status: "connected",
    networkPassphrase: "Test SDF Network ; September 2015",
    connect: walletConnect,
    disconnect: walletDisconnect,
  };
  return {
    walletConnectMock: walletConnect,
    walletDisconnectMock: walletDisconnect,
    signAndSubmitMock: vi.fn(),
    executeSwapMock: vi.fn(),
    streamAccountMock: vi.fn(),
    streamTradesMock: vi.fn(),
    fetchCatalogMock: vi.fn(),
    useMarketStatsMock: vi.fn(),
    useOraclePriceMock: vi.fn(),
    useSwapQuoteMock: vi.fn(),
    useUserLimitOrdersMock: vi.fn(),
    useXlmBalanceMock: vi.fn(),
    isWalletAvailableMock: vi.fn().mockResolvedValue(true),
    chartMock: {
      addSeries: vi.fn(() => ({
        setData: vi.fn(),
        priceScale: () => ({ applyOptions: vi.fn() }),
      })),
      timeScale: () => ({ fitContent: vi.fn() }),
      applyOptions: vi.fn(),
      remove: vi.fn(),
    },
    walletState: state,
  };
});

const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

// =========================================================================
// Module mocks
// =========================================================================

vi.mock("@/lib/stellar/wallet-store", () => ({
  useWallet: () => walletState,
  useWalletStore: { getState: () => walletState },
}));

vi.mock("@/lib/stellar/queries", () => ({
  useXlmBalance: useXlmBalanceMock,
  useOraclePrice: useOraclePriceMock,
  usePriceHistory: () => ({ data: [], isLoading: false, isError: false }),
  useSwapQuote: useSwapQuoteMock,
  useMarketStats: useMarketStatsMock,
}));

vi.mock("@/lib/stellar/limit-order-queries", () => ({
  useUserLimitOrders: useUserLimitOrdersMock,
}));

vi.mock("@/lib/stellar/live", () => ({
  streamAccountOperations: streamAccountMock,
  streamTrades: streamTradesMock,
}));

vi.mock("@/lib/stellar/catalog", () => ({
  fetchAssetCatalog: fetchCatalogMock,
}));

vi.mock("@/lib/stellar/contract-submit", () => ({
  signAndSubmitContractTx: signAndSubmitMock,
}));

vi.mock("@/lib/stellar/swap-execution", () => ({
  executeSwap: executeSwapMock,
}));

vi.mock("@/lib/stellar/wallet-kit", () => ({
  isWalletAvailable: isWalletAvailableMock,
}));

vi.mock("lightweight-charts", () => ({
  createChart: () => chartMock,
  ColorType: { Solid: 0 },
  CandlestickSeries: "candlestick",
  HistogramSeries: "histogram",
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div data-testid="card">{children}</div>,
}));
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    isLoading,
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled || isLoading}>
      {children}
    </button>
  ),
}));
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: ReactNode }) => <span data-testid="badge">{children}</span>,
}));
vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));
vi.mock("@/components/ui/sort-indicator", () => ({
  SortIndicator: () => <span data-testid="sort-indicator" />,
}));
vi.mock("@/components/ui/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/swap/token-selector", () => ({
  TokenSelector: ({
    value,
    onSelect,
  }: {
    value: { code: string; isNative?: boolean; issuer?: string } | null;
    onSelect: (a: { code: string; isNative?: boolean; issuer?: string }) => void;
  }) => (
    <button
      type="button"
      data-testid="token-selector"
      onClick={() => onSelect({ code: "XLM", isNative: true })}
    >
      {value?.code ?? "Select"}
    </button>
  ),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/swap",
}));

import { toast } from "@/components/ui/toast";
import { AssetBrowser } from "@/components/assets/asset-browser";
import { MarketTable } from "@/components/markets/market-table";
import { LimitOrderForm } from "@/components/orders/limit-order-form";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import {
  useLiveMarketStream,
  useLiveOrderbookStream,
} from "@/components/providers/live-sync-hooks";
import { CommandPalette } from "@/components/ui/command-palette";
import { CandlestickChart } from "@/components/charts/candlestick-chart";
import { SwapWidget } from "@/components/swap/swap-widget";
import { LimitOrderTable } from "@/components/orders/limit-order-table";
import { SwapExecutionPanel } from "@/components/swap/swap-execution-panel";

function withProviders(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  walletState.address = VALID_ADDRESS;
  walletState.status = "connected";
  useSwapQuoteMock.mockReset();
  useSwapQuoteMock.mockReturnValue({ data: null, isLoading: false, isError: false });
  useOraclePriceMock.mockReset();
  useMarketStatsMock.mockReset();
  useUserLimitOrdersMock.mockReset();
  executeSwapMock.mockReset();
  signAndSubmitMock.mockReset();
  streamTradesMock.mockReset();
  fetchCatalogMock.mockReset();
  chartMock.applyOptions.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

// =========================================================================
// AssetBrowser — trustlines sort header
// =========================================================================

describe("AssetBrowser trustlines sort", () => {
  it("sorts by trustlines when the header is clicked", async () => {
    fetchCatalogMock.mockResolvedValue([
      {
        token: { code: "USDC", name: "USD Coin", issuer: VALID_ADDRESS },
        trustlines: 100,
        supply: 5000,
        accounts: 50,
        flags: { authRequired: true, authImmutable: false },
      },
    ]);
    withProviders(<AssetBrowser />);
    expect(await screen.findByText("USDC")).toBeTruthy();
    fireEvent.click(screen.getByText("Trustlines"));
    expect(screen.getAllByTestId("sort-indicator").length).toBeGreaterThan(0);
  });
});

// =========================================================================
// MarketTable — volume sort header
// =========================================================================

describe("MarketTable volume sort", () => {
  it("sorts by volume when the header is clicked", () => {
    useMarketStatsMock.mockReturnValue({
      data: [
        {
          token: { code: "USDC", name: "USD Coin" },
          priceInXlm: 0.5,
          change24hPct: 1,
          volume24hXlm: 1000,
          bestBid: 0.49,
          bestAsk: 0.51,
        },
      ],
      isLoading: false,
      isError: false,
    });
    withProviders(<MarketTable />);
    fireEvent.click(screen.getByText("24h Volume (XLM)"));
    expect(screen.getByText("USDC")).toBeTruthy();
  });
});

// =========================================================================
// LimitOrderForm — wallet rejection path
// =========================================================================

describe("LimitOrderForm wallet rejection", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ xdr: "AAAA" }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("shows a toast when the wallet rejects the signature", async () => {
    signAndSubmitMock.mockResolvedValue({ success: false, error: "User declined" });
    render(<LimitOrderForm />);
    fireEvent.change(screen.getByLabelText("Limit price"), { target: { value: "0.5" } });
    fireEvent.change(screen.getByLabelText("Order amount"), { target: { value: "10" } });
    fireEvent.click(screen.getByText(/Place Buy Order/));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("User declined"));
  });
});

// =========================================================================
// ConnectWalletButton — disconnect confirmation flow
// =========================================================================

describe("ConnectWalletButton disconnect", () => {
  it("disconnects after confirming in the dialog", async () => {
    useXlmBalanceMock.mockReturnValue({ data: "100" });
    render(<ConnectWalletButton />);
    // Open the account menu
    fireEvent.click(screen.getByRole("button", { name: /GAAA/ }));
    // Click the Disconnect menu item
    fireEvent.click(screen.getByRole("menuitem", { name: "Disconnect" }));
    // Confirm in the dialog
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    await waitFor(() => expect(walletDisconnectMock).toHaveBeenCalled());
    expect(toast.info).toHaveBeenCalledWith("Wallet disconnected");
  });
});

// =========================================================================
// live-sync-hooks — invoke stream callbacks
// =========================================================================

describe("live-sync-hooks stream callbacks", () => {
  function makeWrapper() {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    return { wrapper, invalidateSpy };
  }

  it("invalidates market stats when the market stream fires", () => {
    let captured: (() => void) | null = null;
    streamTradesMock.mockImplementation((_b: unknown, _c: unknown, cb: () => void) => {
      captured = cb;
      return () => undefined;
    });
    const { wrapper, invalidateSpy } = makeWrapper();
    renderHook(() => useLiveMarketStream(), { wrapper });
    act(() => captured?.());
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["market-stats"] });
  });

  it("invalidates the orderbook when the pair stream fires", () => {
    let captured: (() => void) | null = null;
    streamTradesMock.mockImplementation((_b: unknown, _c: unknown, cb: () => void) => {
      captured = cb;
      return () => undefined;
    });
    const { wrapper, invalidateSpy } = makeWrapper();
    renderHook(
      () =>
        useLiveOrderbookStream(
          { code: "XLM", isNative: true },
          { code: "USDC", issuer: VALID_ADDRESS }
        ),
      { wrapper }
    );
    act(() => captured?.());
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["orderbook", "XLM", "", "USDC", VALID_ADDRESS],
    });
  });
});

// =========================================================================
// CommandPalette — ArrowUp navigation
// =========================================================================

describe("CommandPalette ArrowUp", () => {
  it("moves the selection up with ArrowUp", () => {
    render(<CommandPalette />);
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    const input = screen.getByPlaceholderText("Type a command or search…");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(screen.queryByRole("dialog")).toBeTruthy();
  });
});

// =========================================================================
// CandlestickChart — ResizeObserver callback body
// =========================================================================

describe("CandlestickChart resize callback", () => {
  it("applies the new width when the observer fires", () => {
    let roCallback: ((entries: Array<{ contentRect: { width: number } }>) => void) | null = null;
    class MockResizeObserver {
      constructor(cb: (entries: Array<{ contentRect: { width: number } }>) => void) {
        roCallback = cb;
      }
      observe() {}
      disconnect() {}
    }
    // @ts-expect-error testing override
    globalThis.ResizeObserver = MockResizeObserver;
    render(
      <CandlestickChart
        candles={[
          {
            timestamp: 1700000000000,
            open: 1,
            high: 2,
            low: 0.5,
            close: 1.5,
            volumeBase: 10,
            volumeCounter: 20,
            tradeCount: 5,
          },
        ]}
      />
    );
    act(() => {
      roCallback?.([{ contentRect: { width: 555 } }]);
    });
    expect(chartMock.applyOptions).toHaveBeenCalledWith({ width: 555 });
  });
});

// =========================================================================
// SwapWidget — keyboard shortcut, connect, review fallback
// =========================================================================

const QUOTE = {
  path: [
    { code: "XLM", isNative: true },
    { code: "USDC", issuer: VALID_ADDRESS },
  ],
  sourceAmount: "100",
  outputAmount: "90",
  executionPrice: 0.9,
  priceImpactPct: 0.5,
  minReceived: "89",
  feeEstimateXlm: "0.01",
  slippagePct: 1,
  method: "direct" as const,
  warnings: [],
};

describe("SwapWidget keyboard + review flows", () => {
  it("focuses the amount input when pressing s", () => {
    render(<SwapWidget />);
    const input = screen.getByLabelText("Amount to pay") as HTMLInputElement;
    fireEvent.keyDown(window, { key: "s" });
    expect(document.activeElement).toBe(input);
  });

  it("calls connect when no wallet is connected", () => {
    walletState.address = null;
    render(<SwapWidget />);
    fireEvent.change(screen.getByLabelText("Amount to pay"), { target: { value: "10" } });
    fireEvent.click(screen.getByText("Connect Wallet to Swap"));
    expect(walletConnectMock).toHaveBeenCalled();
  });

  it("returns to the form via the panel reset", () => {
    useSwapQuoteMock.mockReturnValue({ data: QUOTE, isLoading: false, isError: false });
    render(<SwapWidget />);
    fireEvent.change(screen.getByLabelText("Amount to pay"), { target: { value: "10" } });
    fireEvent.click(screen.getByText("Review Swap"));
    expect(screen.getByText("Confirm & Swap")).toBeTruthy();
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.getByText("Review Swap")).toBeTruthy();
  });

  it("shows the back-to-swap fallback when the quote disappears while reviewing", () => {
    useSwapQuoteMock.mockReturnValue({ data: QUOTE, isLoading: false, isError: false });
    render(<SwapWidget />);
    fireEvent.change(screen.getByLabelText("Amount to pay"), { target: { value: "10" } });
    fireEvent.click(screen.getByText("Review Swap"));
    expect(screen.getByText("Confirm & Swap")).toBeTruthy();
    // Quote becomes unavailable on the next render.
    useSwapQuoteMock.mockReturnValue({ data: null, isLoading: false, isError: false });
    fireEvent.click(screen.getByText("Clear"));
    expect(screen.getByText("Back to Swap")).toBeTruthy();
    fireEvent.click(screen.getByText("Back to Swap"));
    expect(screen.getByText("Review Swap")).toBeTruthy();
  });
});

// =========================================================================
// LimitOrderTable — oracle zero, cancel error + success
// =========================================================================

describe("LimitOrderTable cancel + oracle branches", () => {
  const ORDERS = [
    {
      id: 1,
      owner: VALID_ADDRESS,
      base: "XLM",
      counter: "USDC",
      price: 0.5,
      amount: 100,
      expiryLedger: 0,
      side: "buy" as const,
      placedAt: 1700000000,
    },
  ];
  const refetchMock = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    useUserLimitOrdersMock.mockReturnValue({
      data: ORDERS,
      isLoading: false,
      isError: false,
      refetch: refetchMock,
    });
    useOraclePriceMock.mockReturnValue({ data: { price: 2_000_000_000 }, isLoading: false });
    signAndSubmitMock.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("shows the dash cell when the oracle price is zero", () => {
    useOraclePriceMock.mockReturnValue({ data: { price: 0 }, isLoading: false });
    withProviders(<LimitOrderTable />);
    expect(screen.getByTitle("Oracle price unavailable")).toBeTruthy();
  });

  it("toasts the API error when cancelling fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Build failed" }),
    }) as unknown as typeof fetch;
    withProviders(<LimitOrderTable />);
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Build failed"));
  });

  it("cancels successfully and refetches", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ xdr: "AAAA" }),
    }) as unknown as typeof fetch;
    withProviders(<LimitOrderTable />);
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => expect(toast.info).toHaveBeenCalledWith("Order # 1 cancelled"));
    expect(refetchMock).toHaveBeenCalled();
  });
});

// =========================================================================
// SwapExecutionPanel — marking failure + busy steps
// =========================================================================

describe("SwapExecutionPanel marking failure + steps", () => {
  beforeEach(() => {
    executeSwapMock.mockReset();
    signAndSubmitMock.mockReset();
  });

  it("toasts a specific message when order marking is rejected", async () => {
    executeSwapMock.mockImplementation(
      (_args: unknown, report: (p: string) => void, onMarked?: (txHash: string) => void) => {
        report("success");
        onMarked?.("tx-1");
        return Promise.resolve({ phase: "success", hash: "abc", explorerUrl: null });
      }
    );
    signAndSubmitMock.mockResolvedValue({ success: false, error: "rejected by wallet" });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ xdr: "AAAA" }),
    }) as unknown as typeof fetch;
    render(
      <SwapExecutionPanel
        address={VALID_ADDRESS}
        input={{ code: "XLM", isNative: true }}
        output={{ code: "USDC", issuer: VALID_ADDRESS }}
        amountIn="100"
        quote={QUOTE}
        onReset={vi.fn()}
        orderId={5}
      />
    );
    fireEvent.click(screen.getByText("Confirm & Swap"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Swap succeeded but order marking failed: rejected by wallet"
      )
    );
  });

  it("toasts a generic message when order marking throws", async () => {
    executeSwapMock.mockImplementation(
      (_args: unknown, report: (p: string) => void, onMarked?: (txHash: string) => void) => {
        report("success");
        onMarked?.("tx-1");
        return Promise.resolve({ phase: "success", hash: "abc", explorerUrl: null });
      }
    );
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error("network down")) as unknown as typeof fetch;
    render(
      <SwapExecutionPanel
        address={VALID_ADDRESS}
        input={{ code: "XLM", isNative: true }}
        output={{ code: "USDC", issuer: VALID_ADDRESS }}
        amountIn="100"
        quote={QUOTE}
        onReset={vi.fn()}
        orderId={5}
      />
    );
    fireEvent.click(screen.getByText("Confirm & Swap"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Swap succeeded but order marking failed")
    );
  });

  it("renders the busy phase steps while executing", async () => {
    executeSwapMock.mockImplementation((_args: unknown, report: (p: string) => void) => {
      report("checking");
      return new Promise((resolve) =>
        setTimeout(() => {
          report("success");
          resolve({ phase: "success", hash: "abc", explorerUrl: null });
        }, 0)
      );
    });
    render(
      <SwapExecutionPanel
        address={VALID_ADDRESS}
        input={{ code: "XLM", isNative: true }}
        output={{ code: "USDC", issuer: VALID_ADDRESS }}
        amountIn="100"
        quote={QUOTE}
        onReset={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("Confirm & Swap"));
    // The label appears both in the step list and the busy button.
    expect(screen.getAllByText("Checking account & trustlines…").length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getAllByText("Done").length).toBeGreaterThan(0));
  });
});
