import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

// =========================================================================
// Shared mocks
// =========================================================================
const {
  useWalletMock,
  useQueryMock,
  useOrderbookMock,
  usePriceHistoryMock,
  streamOpsMock,
  streamTradesMock,
} = vi.hoisted(() => ({
  useWalletMock: vi.fn(),
  useQueryMock: vi.fn(),
  useOrderbookMock: vi.fn(),
  usePriceHistoryMock: vi.fn(),
  streamOpsMock: vi.fn(),
  streamTradesMock: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: useQueryMock,
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  QueryClient: class {
    constructor() {}
  },
  QueryClientProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/stellar/wallet-store", () => ({
  useWallet: () => useWalletMock(),
  useWalletStore: {
    getState: () => ({
      setConnected: vi.fn(),
      setDisconnected: vi.fn(),
    }),
  },
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

import { toast as toastMockObj } from "@/components/ui/toast";

vi.mock("@/components/ui/button", () => ({
  Button: (props: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
    variant?: string;
    size?: string;
    fullWidth?: boolean;
  }) => (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled || props.isLoading}
      data-variant={props.variant}
      data-size={props.size}
    >
      {props.children}
    </button>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => <div className={className} />,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
  formatNumber: (n: number) => n.toString(),
  formatPrice: (n: number) => n.toFixed(7),
  formatCompact: (n: number) => n.toFixed(2),
  truncateAddress: (a: string, lead = 6, tail = 6) => `${a.slice(0, lead)}…${a.slice(-tail)}`,
}));

// =========================================================================
// OnChainPreferences
// =========================================================================
const { contractIdMock } = vi.hoisted(() => ({ contractIdMock: vi.fn() }));

vi.mock("@/lib/soroban/config", () => ({
  getTradingPreferencesContractId: () => contractIdMock(),
}));

vi.mock("@/lib/stellar/config", () => ({
  explorerTxUrl: (hash: string) => `https://explorer/tx/${hash}`,
}));

const { writePrefsMock, readPrefsMock } = vi.hoisted(() => ({
  writePrefsMock: vi.fn(),
  readPrefsMock: vi.fn(),
}));

vi.mock("@/lib/soroban/trading-preferences", () => ({
  readTradingPreferences: readPrefsMock,
  writeTradingPreferences: writePrefsMock,
}));

import { OnChainPreferences } from "@/components/swap/on-chain-preferences";

describe("OnChainPreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    contractIdMock.mockReturnValue("CONTRACT-ID");
    useQueryMock.mockReturnValue({
      data: { max_slippage_bps: 250, routing_mode: "auto", allowed_assets: [] },
      isLoading: false,
    });
  });

  it("shows not-configured state when contract id is missing", () => {
    contractIdMock.mockReturnValue(null);
    useWalletMock.mockReturnValue({ address: null, status: "disconnected" });
    render(<OnChainPreferences />);
    expect(screen.getByText("Not configured")).toBeTruthy();
  });

  it("shows connect prompt when disconnected but configured", () => {
    useWalletMock.mockReturnValue({ address: null, status: "disconnected" });
    render(<OnChainPreferences />);
    expect(screen.getByText("Contract ready")).toBeTruthy();
    expect(screen.getByText(/Connect your wallet/)).toBeTruthy();
  });

  it("renders the connected form with on-chain values", () => {
    useWalletMock.mockReturnValue({ address: VALID_ADDRESS, status: "connected" });
    render(<OnChainPreferences />);
    expect(screen.getByLabelText("Max slippage in basis points")).toHaveValue(250);
    expect(screen.getByText("Save on-chain")).toBeTruthy();
    expect(screen.getByText("Synced")).toBeTruthy();
  });

  it("edits slippage via the input", () => {
    useWalletMock.mockReturnValue({ address: VALID_ADDRESS, status: "connected" });
    render(<OnChainPreferences />);
    fireEvent.change(screen.getByLabelText("Max slippage in basis points"), {
      target: { value: "500" },
    });
    expect(screen.getByLabelText("Max slippage in basis points")).toHaveValue(500);
  });

  it("saves preferences successfully and shows the tx link", async () => {
    useWalletMock.mockReturnValue({ address: VALID_ADDRESS, status: "connected" });
    writePrefsMock.mockResolvedValue({ ok: true, hash: "deadbeef1234567890abcdef" });
    render(<OnChainPreferences />);
    fireEvent.change(screen.getByLabelText("Max slippage in basis points"), {
      target: { value: "777" },
    });
    fireEvent.click(screen.getByText("Save on-chain"));
    await waitFor(() => expect(writePrefsMock).toHaveBeenCalled());
    expect(await screen.findByText(/deadbeef12345678/)).toBeTruthy();
  });

  it("shows cancelled toast when the wallet declines", async () => {
    useWalletMock.mockReturnValue({ address: VALID_ADDRESS, status: "connected" });
    writePrefsMock.mockResolvedValue({ ok: false, reason: "cancelled" });
    render(<OnChainPreferences />);
    fireEvent.click(screen.getByText("Save on-chain"));
    await waitFor(() =>
      expect(toastMockObj.info).toHaveBeenCalledWith("Transaction cancelled in your wallet")
    );
  });

  it("shows error toast on contract failure", async () => {
    useWalletMock.mockReturnValue({ address: VALID_ADDRESS, status: "connected" });
    writePrefsMock.mockResolvedValue({ ok: false, reason: "failed" });
    render(<OnChainPreferences />);
    fireEvent.click(screen.getByText("Save on-chain"));
    await waitFor(() =>
      expect(toastMockObj.error).toHaveBeenCalledWith("Contract execution failed")
    );
  });
});

// =========================================================================
// OrderbookDepth
// =========================================================================
vi.mock("@/lib/stellar/queries", () => ({
  useOrderbook: () => useOrderbookMock(),
  usePriceHistory: () => usePriceHistoryMock(),
  useTokenBalance: () => useQueryMock(),
  useXlmBalance: () => useQueryMock(),
  useOraclePrice: () => useQueryMock(),
}));

// No mock for live-sync-hooks: OrderbookDepth uses the real useLiveOrderbookStream,
// which calls streamTrades (mocked below) and returns its close function safely.
vi.mock("@/components/providers/live-sync-hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/providers/live-sync-hooks")>();
  return actual;
});

import { OrderbookDepth } from "@/components/markets/orderbook-depth";

const XLM = { code: "XLM", isNative: true };
const USDC = { code: "USDC", issuer: "GISSUER" };

describe("OrderbookDepth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows skeletons while loading", () => {
    useOrderbookMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<OrderbookDepth base={XLM} counter={USDC} />);
    expect(screen.getByText("Orderbook Depth")).toBeTruthy();
    expect(screen.getByText("XLM/USDC")).toBeTruthy();
  });

  it("shows empty state on error", () => {
    useOrderbookMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<OrderbookDepth base={XLM} counter={USDC} />);
    expect(screen.getByText(/No active orderbook/)).toBeTruthy();
  });

  it("renders mid price and depth rows", () => {
    useOrderbookMock.mockReturnValue({
      data: {
        base: XLM,
        counter: USDC,
        bids: [{ price: 0.9, amount: 100, value: 90 }],
        asks: [{ price: 1.1, amount: 50, value: 55 }],
        bestBid: 0.9,
        bestAsk: 1.1,
        midPrice: 1,
        spreadPct: 22.22,
      },
      isLoading: false,
      isError: false,
    });
    render(<OrderbookDepth base={XLM} counter={USDC} height={8} />);
    expect(screen.getByText("Mid price")).toBeTruthy();
    expect(screen.getByText(/Spread 22.220%/)).toBeTruthy();
    expect(screen.getByText("Bids 1 · Asks 1")).toBeTruthy();
    expect(screen.getByText("0.9000000")).toBeTruthy();
    expect(screen.getByText("1.1000000")).toBeTruthy();
  });

  it("shows no-bids/no-asks placeholders", () => {
    useOrderbookMock.mockReturnValue({
      data: {
        base: XLM,
        counter: USDC,
        bids: [],
        asks: [{ price: 1.1, amount: 50, value: 55 }],
        bestBid: null,
        bestAsk: 1.1,
        midPrice: null,
        spreadPct: null,
      },
      isLoading: false,
      isError: false,
    });
    render(<OrderbookDepth base={XLM} counter={USDC} />);
    expect(screen.getByText("No bids")).toBeTruthy();
  });
});

// =========================================================================
// ErrorBoundary
// =========================================================================
import { ErrorBoundary } from "@/components/ui/error-boundary";

describe("ErrorBoundary", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <span>ok content</span>
      </ErrorBoundary>
    );
    expect(screen.getByText("ok content")).toBeTruthy();
  });

  it("catches render errors and shows fallback UI", () => {
    const Bomb = () => {
      throw new Error("render blew up");
    };
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.getByText("render blew up")).toBeTruthy();
  });

  it("recovers via Try again reset", () => {
    let shouldThrow = true;
    const Flaky = () => {
      if (shouldThrow) throw new Error("flaky");
      return <span>recovered</span>;
    };
    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>
    );
    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByText("recovered")).toBeTruthy();
  });

  it("uses a custom fallback when provided", () => {
    const Bomb = () => {
      throw new Error("x");
    };
    render(
      <ErrorBoundary fallback={<span>custom fallback</span>}>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByText("custom fallback")).toBeTruthy();
  });

  it("calls onError callback", () => {
    const onError = vi.fn();
    const Bomb = () => {
      throw new Error("x");
    };
    render(
      <ErrorBoundary onError={onError}>
        <Bomb />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalled();
  });
});

// =========================================================================
// TokenSelector
// =========================================================================
vi.mock("@/lib/stellar/tokens", () => ({
  KNOWN_TOKENS: [
    { code: "XLM", name: "Lumen", decimals: 7, isNative: true, icon: "⬡" },
    { code: "USDC", name: "USD Coin", decimals: 7, issuer: "GISSUER", icon: "₮" },
    { code: "AQUA", name: "Aquarius", decimals: 7, issuer: "GAQUA", icon: "◈" },
  ],
}));

vi.mock("@/lib/stellar/asset", () => ({
  assetToString: (a: { code: string; issuer?: string; isNative?: boolean }) =>
    a.isNative ? "XLM" : `${a.code}:${a.issuer ?? ""}`,
  parseAssetString: (input: string) => {
    const m = input.trim().match(/^([A-Za-z0-9]{1,12}):(G[A-Z0-9]{55})$/);
    return m ? { code: m[1]!.toUpperCase(), issuer: m[2] } : null;
  },
}));

import { TokenSelector } from "@/components/swap/token-selector";

describe("TokenSelector", () => {
  it("shows the selected token code", () => {
    render(<TokenSelector value={XLM} onSelect={() => {}} />);
    expect(screen.getByText("XLM")).toBeTruthy();
  });

  it("shows Select when no value", () => {
    render(<TokenSelector value={null} onSelect={() => {}} />);
    expect(screen.getByText("Select")).toBeTruthy();
  });

  it("opens the listbox and selects a token", () => {
    const onSelect = vi.fn();
    render(<TokenSelector value={XLM} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("listbox")).toBeTruthy();
    fireEvent.click(screen.getByText("USD Coin"));
    expect(onSelect).toHaveBeenCalled();
  });

  it("filters tokens by query", () => {
    render(<TokenSelector value={null} onSelect={() => {}} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.change(screen.getByLabelText("Search tokens"), { target: { value: "aqua" } });
    expect(screen.getByText("Aquarius")).toBeTruthy();
    expect(screen.queryByText("Lumen")).toBeNull();
  });

  it("excludes a token", () => {
    render(<TokenSelector value={null} onSelect={() => {}} exclude={XLM} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText("Lumen")).toBeNull();
  });

  it("shows no-match message", () => {
    render(<TokenSelector value={null} onSelect={() => {}} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.change(screen.getByLabelText("Search tokens"), { target: { value: "zzz" } });
    expect(screen.getByText("No matching assets")).toBeTruthy();
  });

  it("offers add-custom for a valid custom pair", () => {
    const onSelect = vi.fn();
    render(<TokenSelector value={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.change(screen.getByLabelText("Search tokens"), {
      target: { value: `CUST:${VALID_ADDRESS}` },
    });
    fireEvent.click(screen.getByText("Add custom"));
    expect(onSelect).toHaveBeenCalled();
  });
});

// =========================================================================
// WalletProvider
// =========================================================================
const { subscribeEventsMock } = vi.hoisted(() => ({ subscribeEventsMock: vi.fn() }));

vi.mock("@/lib/stellar/wallet-kit", () => ({
  subscribeWalletEvents: subscribeEventsMock,
}));

import { WalletProvider } from "@/components/providers/wallet-provider";

describe("WalletProvider", () => {
  it("renders children and subscribes to events", async () => {
    subscribeEventsMock.mockResolvedValue(vi.fn());
    render(
      <WalletProvider>
        <span>wallet child</span>
      </WalletProvider>
    );
    expect(screen.getByText("wallet child")).toBeTruthy();
    await waitFor(() => expect(subscribeEventsMock).toHaveBeenCalled());
  });

  it("cleans up the subscription on unmount", async () => {
    const cleanup = vi.fn();
    subscribeEventsMock.mockResolvedValue(cleanup);
    const { unmount } = render(
      <WalletProvider>
        <span>child</span>
      </WalletProvider>
    );
    await waitFor(() => expect(subscribeEventsMock).toHaveBeenCalled());
    unmount();
    expect(cleanup).toHaveBeenCalled();
  });
});

// =========================================================================
// live-sync hooks
// =========================================================================
vi.mock("@/lib/stellar/live", () => ({
  streamAccountOperations: streamOpsMock,
  streamTrades: streamTradesMock,
}));

vi.mock("@/lib/stellar/account", () => ({
  isValidPublicKey: (a: string) => a.startsWith("G") && a.length === 56,
}));

import {
  useLiveAccountStream,
  useLiveMarketStream,
  useLiveOrderbookStream,
} from "@/components/providers/live-sync-hooks";

describe("live-sync hooks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("useLiveAccountStream subscribes and invalidates on messages", async () => {
    let handler: (() => void) | undefined;
    const close = vi.fn();
    streamOpsMock.mockImplementation((_addr: string, cb: () => void) => {
      handler = cb;
      return close;
    });
    const { unmount } = renderHook(() => useLiveAccountStream(VALID_ADDRESS));
    expect(streamOpsMock).toHaveBeenCalledWith(VALID_ADDRESS, expect.any(Function));
    act(() => handler?.());
    unmount();
    expect(close).toHaveBeenCalled();
  });

  it("useLiveAccountStream skips invalid addresses", () => {
    renderHook(() => useLiveAccountStream("bad"));
    expect(streamOpsMock).not.toHaveBeenCalled();
  });

  it("useLiveMarketStream subscribes to the reference pair", async () => {
    streamTradesMock.mockReturnValue(vi.fn());
    renderHook(() => useLiveMarketStream());
    expect(streamTradesMock).toHaveBeenCalled();
  });

  it("useLiveOrderbookStream subscribes and closes", async () => {
    const close = vi.fn();
    streamTradesMock.mockReturnValue(close);
    const { unmount } = renderHook(() => useLiveOrderbookStream(XLM, USDC));
    expect(streamTradesMock).toHaveBeenCalled();
    unmount();
    expect(close).toHaveBeenCalled();
  });
});

// =========================================================================
// NotificationCenter
// =========================================================================
import { NotificationCenter } from "@/components/features/notification-center";

describe("NotificationCenter", () => {
  it("shows no notifications when empty", () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByLabelText("Notifications (0 unread)"));
    expect(screen.getByText("No notifications")).toBeTruthy();
  });
});

// =========================================================================
// PriceChartPanel
// =========================================================================
vi.mock("@/components/charts/candlestick-chart", () => ({
  CandlestickChart: () => <div data-testid="candlestick" />,
}));

vi.mock("@/components/charts/volume-chart", () => ({
  VolumeChart: () => <div data-testid="volume-chart" />,
}));

vi.mock("@/lib/stellar/tokens", () => ({
  KNOWN_TOKENS: [
    { code: "XLM", name: "Lumen", decimals: 7, isNative: true },
    { code: "USDC", name: "USD Coin", decimals: 7, issuer: "GISSUER" },
    { code: "AQUA", name: "Aquarius", decimals: 7, issuer: "GAQUA" },
  ],
}));

import { PriceChartPanel } from "@/components/analytics/price-chart-panel";

const CANDLES = [
  {
    timestamp: 1,
    open: 1,
    high: 2,
    low: 0.5,
    close: 1.5,
    volumeBase: 10,
    volumeCounter: 20,
    tradeCount: 5,
  },
  {
    timestamp: 2,
    open: 1.5,
    high: 3,
    low: 1,
    close: 2.5,
    volumeBase: 10,
    volumeCounter: 30,
    tradeCount: 5,
  },
];

describe("PriceChartPanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows loading skeleton", () => {
    usePriceHistoryMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<PriceChartPanel />);
    expect(screen.getByRole("combobox")).toHaveValue("USDC");
  });

  it("shows no-history state on error", () => {
    usePriceHistoryMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<PriceChartPanel />);
    expect(screen.getByText(/No price history available/)).toBeTruthy();
  });

  it("renders stats and charts with candles", () => {
    usePriceHistoryMock.mockReturnValue({ data: CANDLES, isLoading: false, isError: false });
    render(<PriceChartPanel />);
    expect(screen.getByText("+150.00%")).toBeTruthy();
    expect(screen.getByText("Period High")).toBeTruthy();
    expect(screen.getByText("3.000000")).toBeTruthy();
    expect(screen.getByTestId("candlestick")).toBeTruthy();
    expect(screen.getByTestId("volume-chart")).toBeTruthy();
  });

  it("switches timeframe buttons", () => {
    usePriceHistoryMock.mockReturnValue({ data: CANDLES, isLoading: false, isError: false });
    render(<PriceChartPanel />);
    fireEvent.click(screen.getByText("1D"));
    expect(screen.getByText("1D")).toBeTruthy();
  });
});
