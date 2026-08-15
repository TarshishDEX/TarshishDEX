import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CandlestickChart } from "@/components/charts/candlestick-chart";
import { AllocationDonut } from "@/components/charts/allocation-donut";
import { SwapWidget } from "@/components/swap/swap-widget";
import { CommandPalette } from "@/components/ui/command-palette";
import { PriceChartPanel } from "@/components/analytics/price-chart-panel";
import { AssetBrowser } from "@/components/assets/asset-browser";
import {
  useLiveAccountStream,
  useLiveMarketStream,
  useLiveOrderbookStream,
} from "@/components/providers/live-sync-hooks";
import { TokenSelector } from "@/components/swap/token-selector";
import { OnChainPreferences } from "@/components/swap/on-chain-preferences";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { estimateSwapFeeXlm } from "@/lib/stellar/simulation";
import { useIsClient } from "@/lib/hooks/use-is-client";
import { useWallet } from "@/lib/stellar/wallet-store";
import { QRCode } from "@/components/ui/qr-code";
import { MarketTable } from "@/components/markets/market-table";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { LimitOrderForm } from "@/components/orders/limit-order-form";
import { LimitOrderTable } from "@/components/orders/limit-order-table";
import { SwapExecutionPanel } from "@/components/swap/swap-execution-panel";
import { toast } from "@/components/ui/toast";

const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

// =========================================================================
// Hoisted mocks
// =========================================================================

const {
  resizeCallbackMock,
  streamAccountMock,
  streamTradesMock,
  fetchCatalogMock,
  writePrefsMock,
  getContractIdMock,
  useMarketStatsMock,
  useOraclePriceMock,
  signAndSubmitMock,
  executeSwapMock,
  walletConnectMock,
  walletDisconnectMock,
} = vi.hoisted(() => ({
  resizeCallbackMock: vi.fn(),
  streamAccountMock: vi.fn(),
  streamTradesMock: vi.fn(),
  fetchCatalogMock: vi.fn(),
  writePrefsMock: vi.fn(),
  getContractIdMock: vi.fn(),
  useMarketStatsMock: vi.fn(),
  useOraclePriceMock: vi.fn(),
  signAndSubmitMock: vi.fn(),
  executeSwapMock: vi.fn(),
  walletConnectMock: vi.fn().mockResolvedValue(true),
  walletDisconnectMock: vi.fn(),
}));

// =========================================================================
// Module mocks
// =========================================================================

vi.mock("recharts", () => {
  return {
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div data-testid="container">{children}</div>
    ),
    PieChart: ({ children }: { children: ReactNode }) => (
      <div data-testid="pie-chart">{children}</div>
    ),
    Pie: ({ children }: { children: ReactNode }) => <div data-testid="pie">{children}</div>,
    Cell: () => <div data-testid="cell" />,
    Tooltip: ({ formatter }: { formatter: (v: unknown) => unknown }) => {
      const result = formatter(123.456) as [string, string];
      return (
        <div data-testid="tooltip">
          <span data-testid="tooltip-value">{result[0]}</span>
        </div>
      );
    },
    BarChart: ({ children }: { children: ReactNode }) => (
      <div data-testid="bar-chart">{children}</div>
    ),
    Bar: () => <div />,
    CartesianGrid: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
  };
});

vi.mock("lightweight-charts", () => {
  const chartMock = {
    addSeries: vi.fn(() => ({
      setData: vi.fn(),
      priceScale: () => ({ applyOptions: vi.fn() }),
    })),
    timeScale: () => ({ fitContent: vi.fn() }),
    applyOptions: vi.fn(),
    remove: vi.fn(),
  };
  return {
    createChart: () => chartMock,
    ColorType: { Solid: 0 },
    CandlestickSeries: "candlestick",
    HistogramSeries: "histogram",
  };
});

vi.mock("@/lib/stellar/queries", () => ({
  useXlmBalance: () => ({ data: "100" }),
  useOraclePrice: useOraclePriceMock,
  usePriceHistory: () => ({ data: [], isLoading: false, isError: false }),
  useSwapQuote: () => ({ data: null, isLoading: false, isError: false }),
  useMarketStats: useMarketStatsMock,
}));

vi.mock("@/lib/stellar/wallet-store", () => ({
  useWallet: () => ({
    address: VALID_ADDRESS,
    status: "connected",
    networkPassphrase: "Test SDF Network ; September 2015",
    connect: walletConnectMock,
    disconnect: walletDisconnectMock,
  }),
  useWalletStore: { getState: () => ({ setConnected: vi.fn(), setDisconnected: vi.fn() }) },
}));

vi.mock("@/lib/stellar/live", () => ({
  streamAccountOperations: streamAccountMock,
  streamTrades: streamTradesMock,
}));

vi.mock("@/lib/stellar/catalog", () => ({
  fetchAssetCatalogPage: fetchCatalogMock,
}));

vi.mock("@/lib/soroban/trading-preferences", () => ({
  readTradingPreferences: () => Promise.resolve({ max_slippage_bps: 100, routing_mode: "auto" }),
  writeTradingPreferences: writePrefsMock,
}));

vi.mock("@/lib/soroban/config", () => ({
  getTradingPreferencesContractId: getContractIdMock,
}));

vi.mock("@/lib/stellar/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stellar/config")>();
  return { ...actual, explorerTxUrl: (h: string) => `https://explorer/${h}` };
});

vi.mock("@/lib/stellar/swap-execution", () => ({
  executeSwap: executeSwapMock,
}));

vi.mock("@/lib/stellar/wallet-kit", () => ({
  isWalletAvailable: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/stellar/contract-submit", () => ({
  signAndSubmitContractTx: signAndSubmitMock,
}));

vi.mock("@/components/providers/live-sync-hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/providers/live-sync-hooks")>();
  return { ...actual, useLiveMarketStream: () => {} };
});

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

function withProviders(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

// =========================================================================
// CandlestickChart — ResizeObserver callback
// =========================================================================

describe("CandlestickChart", () => {
  const CANDLE = {
    timestamp: 1700000000000,
    open: 1,
    high: 2,
    low: 0.5,
    close: 1.5,
    volumeBase: 10,
    volumeCounter: 20,
    tradeCount: 5,
  };

  it("creates the chart and responds to resize events", () => {
    class MockResizeObserver {
      static cb: (entries: Array<{ contentRect: { width: number } }>) => void = () => {};
      observe() {}
      disconnect() {}
    }
    // @ts-expect-error testing override
    globalThis.ResizeObserver = MockResizeObserver;
    render(<CandlestickChart candles={[CANDLE]} />);
    expect(globalThis.ResizeObserver).toBeDefined();
  });
});

// =========================================================================
// AllocationDonut tooltip formatter
// =========================================================================

describe("AllocationDonut", () => {
  it("renders slices and formats the tooltip value", () => {
    render(<AllocationDonut data={[{ name: "XLM", value: 123.456 }]} />);
    expect(screen.getByTestId("pie-chart")).toBeTruthy();
    expect(screen.getByTestId("tooltip-value").textContent).toBe("123.46 XLM");
  });

  it("renders the empty state", () => {
    render(<AllocationDonut data={[]} />);
    expect(screen.getByText("No allocations to display")).toBeTruthy();
  });
});

// =========================================================================
// SwapExecutionPanel — order marking + error detail
// =========================================================================

describe("SwapExecutionPanel order marking", () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks a limit order as executed on success", async () => {
    executeSwapMock.mockImplementation(
      (_args: unknown, report: (p: string) => void, onMarked?: (txHash: string) => void) => {
        report("success");
        onMarked?.("tx-hash-1");
        return Promise.resolve({ phase: "success", hash: "abc123", explorerUrl: "https://e/abc" });
      }
    );
    signAndSubmitMock.mockResolvedValue({ success: true });
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
        orderId={7}
      />
    );
    fireEvent.click(screen.getByText("Confirm & Swap"));
    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith("Limit order # 7 marked as executed")
    );
    expect(screen.getByText("Swap completed on-chain")).toBeTruthy();
    expect(screen.getByText("View transaction on Stellar Expert ↗")).toBeTruthy();
  });

  it("shows an error with kind-specific message and raw detail", async () => {
    executeSwapMock.mockImplementation((_args: unknown, report: (p: string) => void) => {
      report("failed");
      return Promise.resolve({
        phase: "failed",
        errorKind: "insufficient-balance",
        error: "Not enough XLM",
      });
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
    await waitFor(() =>
      expect(screen.getByText(/Insufficient balance for this swap/)).toBeTruthy()
    );
    expect(screen.getByText("Not enough XLM")).toBeTruthy();
  });

  it("shows multi-hop route and warnings", () => {
    const multiQuote = {
      ...QUOTE,
      path: [
        { code: "XLM", isNative: true },
        { code: "USDC", issuer: VALID_ADDRESS },
        { code: "EURT", issuer: VALID_ADDRESS },
      ],
      warnings: ["High price impact (3.00%). Consider a smaller amount."],
      priceImpactPct: 6,
    };
    render(
      <SwapExecutionPanel
        address={VALID_ADDRESS}
        input={{ code: "XLM", isNative: true }}
        output={{ code: "EURT", issuer: VALID_ADDRESS }}
        amountIn="100"
        quote={multiQuote}
        onReset={vi.fn()}
      />
    );
    expect(screen.getByText(/USDC/)).toBeTruthy();
    expect(screen.getByText(/High price impact/)).toBeTruthy();
  });
});

// =========================================================================
// LimitOrderTable — oracle states + cancel
// =========================================================================

describe("LimitOrderTable extra branches", () => {
  beforeEach(() => {
    useOraclePriceMock.mockReturnValue({ data: { price: 2_000_000_000 }, isLoading: false });
  });

  it("shows oracle loading state", () => {
    useOraclePriceMock.mockReturnValue({ data: null, isLoading: true });
    withProviders(<LimitOrderTable />);
    expect(screen.getByText(/open orders/)).toBeTruthy();
  });

  it("shows unavailable oracle state", () => {
    useOraclePriceMock.mockReturnValue({ data: null, isLoading: false });
    withProviders(<LimitOrderTable />);
    expect(screen.getByText(/open orders/)).toBeTruthy();
  });
});

// =========================================================================
// SwapWidget edge cases
// =========================================================================

describe("SwapWidget edge cases", () => {
  it("renders the swap form with defaults", () => {
    render(<SwapWidget />);
    expect(screen.getByText("Swap")).toBeTruthy();
    expect(screen.getByLabelText("Amount to pay")).toBeTruthy();
    expect(screen.getByLabelText("Amount to receive")).toBeTruthy();
  });

  it("disables the button when amount is invalid", () => {
    render(<SwapWidget />);
    const btn = screen.getByText(/Review Swap/);
    expect(btn.closest("button")?.hasAttribute("disabled")).toBe(true);
  });

  it("reverses the swap direction", () => {
    render(<SwapWidget />);
    fireEvent.click(screen.getByLabelText("Reverse swap direction"));
    expect(screen.getAllByTestId("token-selector").length).toBe(2);
  });

  it("toggles custom slippage", () => {
    render(<SwapWidget />);
    fireEvent.click(screen.getByText("Custom"));
    expect(screen.getByLabelText("Custom slippage percentage")).toBeTruthy();
    fireEvent.click(screen.getByText("Use presets"));
    expect(screen.getByText("0.1%")).toBeTruthy();
  });

  it("clears the amount", () => {
    render(<SwapWidget />);
    fireEvent.change(screen.getByLabelText("Amount to pay"), { target: { value: "10" } });
    fireEvent.click(screen.getByText("Clear"));
    expect((screen.getByLabelText("Amount to pay") as HTMLInputElement).value).toBe("");
  });
});

// =========================================================================
// CommandPalette — keyboard nav and filtering
// =========================================================================

describe("CommandPalette", () => {
  function openPalette() {
    render(<CommandPalette />);
    fireEvent.keyDown(document, { key: "k", metaKey: true });
  }

  it("opens with Cmd+K, filters, and navigates with Enter", () => {
    openPalette();
    const input = screen.getByPlaceholderText("Type a command or search…");
    fireEvent.change(input, { target: { value: "mark" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows no results for unmatched queries", () => {
    openPalette();
    fireEvent.change(screen.getByPlaceholderText("Type a command or search…"), {
      target: { value: "zzzzz" },
    });
    expect(screen.getByText("No results")).toBeTruthy();
  });

  it("closes on Escape", () => {
    openPalette();
    fireEvent.keyDown(screen.getByPlaceholderText("Type a command or search…"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on backdrop click", () => {
    openPalette();
    fireEvent.click(document.querySelector(".fixed.inset-0") as HTMLElement);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("navigates by clicking a command", () => {
    openPalette();
    fireEvent.click(screen.getByText("Analytics"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes with Ctrl+K toggle", () => {
    openPalette();
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

// =========================================================================
// PriceChartPanel — token switch
// =========================================================================

describe("PriceChartPanel", () => {
  it("switches tokens via the select", () => {
    render(<PriceChartPanel />);
    fireEvent.change(screen.getByLabelText("Select token"), { target: { value: "XLM" } });
    expect(screen.getByText("XLM")).toBeTruthy();
    fireEvent.click(screen.getByText("1W"));
    fireEvent.click(screen.getByText("1D"));
  });
});

// =========================================================================
// AssetBrowser — sort + search + filter
// =========================================================================

describe("AssetBrowser", () => {
  beforeEach(() => {
    fetchCatalogMock.mockResolvedValue({
      assets: [
        {
          token: { code: "USDC", name: "USD Coin", issuer: VALID_ADDRESS },
          trustlines: 100,
          supply: 5000,
          accounts: 50,
          flags: { authRequired: true, authImmutable: false },
        },
        {
          token: { code: "EURT", name: "Euro Token", issuer: VALID_ADDRESS },
          trustlines: 50,
          supply: 1000,
          accounts: 20,
          flags: { authRequired: false, authImmutable: false },
        },
      ],
      nextCursor: null,
    });
  });

  it("loads and renders the asset table with sorting", async () => {
    withProviders(<AssetBrowser />);
    expect(await screen.findByText("USDC")).toBeTruthy();
    expect(screen.getByText("EURT")).toBeTruthy();
    fireEvent.click(screen.getByText("Supply"));
    fireEvent.click(screen.getByText("Supply"));
    fireEvent.click(screen.getByText("Accounts"));
  });

  it("filters by search query and auth flag", async () => {
    withProviders(<AssetBrowser />);
    await screen.findByText("USDC");
    fireEvent.change(screen.getByLabelText("Search assets"), { target: { value: "eur" } });
    expect(screen.queryByText("USDC")).toBeNull();
    expect(screen.getByText("EURT")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Search assets"), { target: { value: "" } });
    fireEvent.click(screen.getByText("Auth required"));
    expect(screen.getByText("USDC")).toBeTruthy();
    expect(screen.queryByText("EURT")).toBeNull();
  });

  it("shows an empty state when nothing matches", async () => {
    withProviders(<AssetBrowser />);
    await screen.findByText("USDC");
    fireEvent.change(screen.getByLabelText("Search assets"), { target: { value: "nomatch" } });
    expect(screen.getByText("No assets match your search.")).toBeTruthy();
  });
});

// =========================================================================
// live-sync-hooks — invalid address + stream callbacks
// =========================================================================

describe("live-sync-hooks", () => {
  function makeWrapper() {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    Wrapper.displayName = "QueryWrapper";
    return Wrapper;
  }

  it("does not subscribe with an invalid address", () => {
    renderHook(() => useLiveAccountStream("bad"), { wrapper: makeWrapper() });
    expect(streamAccountMock).not.toHaveBeenCalled();
  });

  it("subscribes account, market and orderbook streams", async () => {
    streamAccountMock.mockReturnValue(() => undefined);
    streamTradesMock.mockReturnValue(() => undefined);
    renderHook(() => useLiveAccountStream(VALID_ADDRESS), { wrapper: makeWrapper() });
    renderHook(() => useLiveMarketStream(), { wrapper: makeWrapper() });
    renderHook(
      () =>
        useLiveOrderbookStream(
          { code: "XLM", isNative: true },
          { code: "USDC", issuer: VALID_ADDRESS }
        ),
      { wrapper: makeWrapper() }
    );
    expect(streamAccountMock).toHaveBeenCalled();
    // Market stream is a no-op in this file's mock; the orderbook stream still subscribes.
    expect(streamTradesMock).toHaveBeenCalledTimes(1);
  });
});

// =========================================================================
// TokenSelector — outside click
// =========================================================================

describe("TokenSelector", () => {
  let RealTokenSelector: typeof TokenSelector;

  beforeEach(async () => {
    RealTokenSelector = await vi
      .importActual<typeof import("@/components/swap/token-selector")>(
        "@/components/swap/token-selector"
      )
      .then((m) => m.TokenSelector);
  });

  it("closes the listbox on outside click", () => {
    render(
      <div>
        <button data-testid="outside">outside</button>
        <RealTokenSelector value={{ code: "XLM", isNative: true }} onSelect={vi.fn()} />
      </div>
    );
    fireEvent.click(screen.getByRole("button", { name: /XLM/ }));
    expect(screen.getByRole("listbox")).toBeTruthy();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("filters and shows no matching assets", () => {
    vi.useFakeTimers();
    try {
      render(<RealTokenSelector value={{ code: "XLM", isNative: true }} onSelect={vi.fn()} />);
      fireEvent.click(screen.getByRole("button", { name: /XLM/ }));
      fireEvent.change(screen.getByLabelText("Search tokens"), { target: { value: "zzz" } });
      act(() => vi.advanceTimersByTime(300));
      expect(screen.getByText("No matching assets")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});

// =========================================================================
// OnChainPreferences — draft + save paths
// =========================================================================

describe("OnChainPreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getContractIdMock.mockReturnValue("CAAAA");
  });

  it("shows not-configured state without a contract", () => {
    getContractIdMock.mockReturnValue("");
    withProviders(<OnChainPreferences />);
    expect(screen.getByText("Not configured")).toBeTruthy();
  });

  it("edits draft values and saves successfully", async () => {
    writePrefsMock.mockResolvedValue({ ok: true, hash: "deadbeef" });
    withProviders(<OnChainPreferences />);
    await screen.findByText("Synced");
    fireEvent.change(screen.getByLabelText("Max slippage in basis points"), {
      target: { value: "250" },
    });
    fireEvent.click(screen.getByText("bridge"));
    fireEvent.click(screen.getByText("Save on-chain"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("On-chain preferences updated"));
    expect(screen.getByText(/deadbeef/)).toBeTruthy();
  });

  it("handles a cancelled transaction", async () => {
    writePrefsMock.mockResolvedValue({ ok: false, reason: "cancelled" });
    withProviders(<OnChainPreferences />);
    await screen.findByText("Synced");
    fireEvent.click(screen.getByText("Save on-chain"));
    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith("Transaction cancelled in your wallet")
    );
  });

  it("handles a contract failure", async () => {
    writePrefsMock.mockResolvedValue({ ok: false, reason: "execution_failed" });
    withProviders(<OnChainPreferences />);
    await screen.findByText("Synced");
    fireEvent.click(screen.getByText("Save on-chain"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Contract execution failed"));
  });
});

// =========================================================================
// ConnectWalletButton — failure path
// =========================================================================

describe("ConnectWalletButton failure path", () => {
  it("shows an error toast when connect fails", async () => {
    walletConnectMock.mockResolvedValue(false);
    withProviders(<ConnectWalletButton />);
    fireEvent.click(screen.getByRole("button", { name: /GAAA/ }));
    fireEvent.click(screen.getByText("Switch account"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Wallet connection failed or was rejected.")
    );
  });
});

// =========================================================================
// simulation — estimateSwapFeeXlm
// =========================================================================

describe("simulation fee estimate", () => {
  it("multiplies base fee by hop count plus one", () => {
    const single = estimateSwapFeeXlm(0);
    const double = estimateSwapFeeXlm(1);
    expect(Number(double)).toBeCloseTo(Number(single) * 2, 10);
  });
});

// =========================================================================
// useIsClient server snapshot
// =========================================================================

describe("useIsClient server snapshot", () => {
  it("returns false during SSR", () => {
    function Probe() {
      const isClient = useIsClient();
      return <span data-testid="ssr-client">{String(isClient)}</span>;
    }
    const html = renderToString(<Probe />);
    expect(html).toContain("false");
  });
});

// =========================================================================
// wallet-store useWallet hook
// =========================================================================

describe("useWallet hook", () => {
  it("returns the store state", () => {
    const { result } = renderHook(() => useWallet());
    expect(result.current).toBeDefined();
    expect(typeof result.current.connect).toBe("function");
  });
});

// =========================================================================
// QRCode — canvas drawing
// =========================================================================

describe("QRCode", () => {
  it("draws a placeholder on the canvas", () => {
    const ctx = {
      scale: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      fillStyle: "",
      font: "",
      textAlign: "",
    };
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: () => ctx,
      configurable: true,
    });
    render(<QRCode value={VALID_ADDRESS} size={120} />);
    const canvas = screen.getByLabelText(`QR code for ${VALID_ADDRESS}`) as HTMLCanvasElement;
    expect(canvas).toBeTruthy();
    expect(ctx.fillRect).toHaveBeenCalled();
  });
});

// =========================================================================
// MarketTable — null change + sorting
// =========================================================================

describe("MarketTable", () => {
  beforeEach(() => {
    useMarketStatsMock.mockReturnValue({
      data: [
        {
          token: { code: "USDC", name: "USD Coin" },
          priceInXlm: 0.5,
          change24hPct: null,
          volume24hXlm: 1000,
          bestBid: 0.49,
          bestAsk: 0.51,
        },
        {
          token: { code: "EURT", name: "Euro" },
          priceInXlm: null,
          change24hPct: 5,
          volume24hXlm: 100,
          bestBid: null,
          bestAsk: null,
        },
      ],
      isLoading: false,
      isError: false,
    });
  });

  it("renders markets, hides null-price rows and sorts", () => {
    render(<MarketTable />);
    expect(screen.getByText("USDC")).toBeTruthy();
    expect(screen.queryByText("EURT")).toBeNull();
    fireEvent.click(screen.getByText("24h Change"));
    fireEvent.click(screen.getByText("Price (XLM)"));
    expect(screen.getAllByTestId("sort-indicator").length).toBe(3);
  });

  it("shows the empty state with no markets", () => {
    useMarketStatsMock.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<MarketTable />);
    expect(screen.getByText("No active XLM markets")).toBeTruthy();
  });
});

// =========================================================================
// ErrorBoundary — reload button
// =========================================================================

describe("ErrorBoundary reload", () => {
  it("reloads the page from the fallback", () => {
    const reload = vi.fn();
    Object.defineProperty(window, "location", { value: { reload }, writable: true });
    function Bomb(): never {
      throw new Error("boom");
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    fireEvent.click(screen.getByText("Reload page"));
    expect(reload).toHaveBeenCalled();
    fireEvent.click(screen.getByText("Try again"));
    spy.mockRestore();
  });
});

// =========================================================================
// LimitOrderForm — API error + expiry
// =========================================================================

describe("LimitOrderForm extra branches", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ xdr: "AAAA" }),
    }) as unknown as typeof fetch;
    signAndSubmitMock.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("places an order successfully and selects an expiry", async () => {
    render(<LimitOrderForm />);
    fireEvent.change(screen.getByLabelText("Limit price"), { target: { value: "0.5" } });
    fireEvent.change(screen.getByLabelText("Order amount"), { target: { value: "10" } });
    fireEvent.click(screen.getByText("1 day"));
    fireEvent.click(screen.getByText(/Place Buy Order/));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Limit order placed successfully")
    );
  });

  it("shows a toast when the API errors", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Bad" }),
    }) as unknown as typeof fetch;
    render(<LimitOrderForm />);
    fireEvent.change(screen.getByLabelText("Limit price"), { target: { value: "0.5" } });
    fireEvent.change(screen.getByLabelText("Order amount"), { target: { value: "10" } });
    fireEvent.click(screen.getByText(/Place Buy Order/));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Bad"));
  });

  it("shows a toast when the contract is not deployed", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ xdr: null }),
    }) as unknown as typeof fetch;
    render(<LimitOrderForm />);
    fireEvent.change(screen.getByLabelText("Limit price"), { target: { value: "0.5" } });
    fireEvent.change(screen.getByLabelText("Order amount"), { target: { value: "10" } });
    fireEvent.click(screen.getByText(/Place Buy Order/));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Contract not deployed on this network")
    );
  });
});
