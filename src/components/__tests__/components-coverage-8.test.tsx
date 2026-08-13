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
  usePortfolioSummaryMock,
  useTradeHistoryMock,
  executeSwapMock,
  signSubmitMock,
  toastMock,
} = vi.hoisted(() => ({
  useWalletMock: vi.fn(),
  useQueryMock: vi.fn(),
  usePortfolioSummaryMock: vi.fn(),
  useTradeHistoryMock: vi.fn(),
  executeSwapMock: vi.fn(),
  signSubmitMock: vi.fn(),
  toastMock: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
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
  useWalletStore: { getState: () => ({ setConnected: vi.fn(), setDisconnected: vi.fn() }) },
}));

vi.mock("@/components/ui/toast", () => ({ toast: toastMock }));

vi.mock("@/components/ui/button", () => ({
  Button: (props: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
    variant?: string;
    size?: string;
    fullWidth?: boolean;
    type?: "button" | "submit";
  }) => (
    <button
      type={props.type ?? "button"}
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
  Skeleton: () => <div />,
}));

vi.mock("@/components/ui/sort-indicator", () => ({
  SortIndicator: () => <span>↕</span>,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
  formatNumber: (n: number) => n.toString(),
  formatPrice: (n: number) => n.toFixed(7),
  formatCompact: (n: number) => n.toFixed(1),
  truncateAddress: (a: string, lead = 6, tail = 6) => `${a.slice(0, lead)}…${a.slice(-tail)}`,
}));

// =========================================================================
// SwapExecutionPanel
// =========================================================================
vi.mock("@/lib/stellar/swap-execution", () => ({
  executeSwap: executeSwapMock,
}));

vi.mock("@/lib/stellar/contract-submit", () => ({
  signAndSubmitContractTx: signSubmitMock,
}));

import { SwapExecutionPanel } from "@/components/swap/swap-execution-panel";

const XLM = { code: "XLM", isNative: true };
const USDC = { code: "USDC", issuer: "GISSUER" };

const QUOTE = {
  path: [XLM, USDC],
  sourceAmount: "100",
  outputAmount: "98.5",
  executionPrice: 0.985,
  priceImpactPct: 1.2,
  minReceived: "97.5",
  feeEstimateXlm: "0.0100000",
  slippagePct: 1,
  method: "direct" as const,
  warnings: ["High slippage"],
};

describe("SwapExecutionPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWalletMock.mockReturnValue({ networkPassphrase: "test" });
  });

  it("shows the quote summary and warnings", () => {
    render(
      <SwapExecutionPanel
        address={VALID_ADDRESS}
        input={XLM}
        output={USDC}
        amountIn="100"
        quote={QUOTE}
        onReset={() => {}}
      />
    );
    expect(screen.getByText("You pay")).toBeTruthy();
    expect(screen.getByText("You receive")).toBeTruthy();
    expect(screen.getByText(/High slippage/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirm & Swap" })).toBeTruthy();
  });

  function mockSwap(result: {
    phase: string;
    hash?: string;
    explorerUrl?: string;
    error?: string;
    errorKind?: string;
  }) {
    executeSwapMock.mockImplementation(async (_params: unknown, onPhase?: (p: string) => void) => {
      onPhase?.(result.phase);
      return result;
    });
  }

  it("executes the swap and shows success with explorer link", async () => {
    mockSwap({ phase: "success", hash: "txhash123", explorerUrl: "https://explorer/txhash123" });
    render(
      <SwapExecutionPanel
        address={VALID_ADDRESS}
        input={XLM}
        output={USDC}
        amountIn="100"
        quote={QUOTE}
        onReset={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Swap" }));
    await screen.findByText("Swap completed on-chain");
    expect(screen.getByRole("link", { name: /View transaction/ })).toHaveAttribute(
      "href",
      "https://explorer/txhash123"
    );
  });

  it("shows kind-specific error message on failure", async () => {
    mockSwap({ phase: "failed", error: "op_underfunded", errorKind: "insufficient-balance" });
    render(
      <SwapExecutionPanel
        address={VALID_ADDRESS}
        input={XLM}
        output={USDC}
        amountIn="100"
        quote={QUOTE}
        onReset={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Swap" }));
    await screen.findByText(/Insufficient balance for this swap/);
  });

  it("marks a limit order as executed on success", async () => {
    executeSwapMock.mockImplementation(
      async (
        _params: unknown,
        onPhase?: (p: string) => void,
        onSuccess?: (h: string) => Promise<void>
      ) => {
        await onSuccess?.("txh");
        onPhase?.("success");
        return { phase: "success", hash: "txh", explorerUrl: "https://e/txh" };
      }
    );
    signSubmitMock.mockResolvedValue({ success: true });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ xdr: "xdr" }) })
    );
    render(
      <SwapExecutionPanel
        address={VALID_ADDRESS}
        input={XLM}
        output={USDC}
        amountIn="100"
        quote={QUOTE}
        orderId={7}
        onReset={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm & Swap" }));
    await screen.findByText(/marked as executed/);
    expect(toastMock.info).toHaveBeenCalledWith("Limit order # 7 marked as executed");
    vi.unstubAllGlobals();
  });

  it("shows multi-hop route when path has intermediates", () => {
    const multiQuote = {
      ...QUOTE,
      path: [XLM, { code: "AQUA" }, USDC],
      method: "multi-hop" as const,
    };
    render(
      <SwapExecutionPanel
        address={VALID_ADDRESS}
        input={XLM}
        output={USDC}
        amountIn="100"
        quote={multiQuote}
        onReset={() => {}}
      />
    );
    expect(screen.getByText("AQUA")).toBeTruthy();
    expect(screen.getByText("Route")).toBeTruthy();
  });
});

// =========================================================================
// AssetBrowser
// =========================================================================
vi.mock("@/lib/stellar/catalog", () => ({
  fetchAssetCatalog: vi.fn(),
}));

import { fetchAssetCatalog } from "@/lib/stellar/catalog";
import { AssetBrowser } from "@/components/assets/asset-browser";

const ASSETS = [
  {
    token: { code: "USDC", name: "USD Coin", issuer: "GISSUER" },
    trustlines: 1000,
    supply: 5000,
    accounts: 300,
    flags: { authRequired: true, authImmutable: false },
  },
  {
    token: { code: "XLM", name: "Lumen", isNative: true },
    trustlines: 500,
    supply: 2000,
    accounts: 150,
    flags: { authRequired: false, authImmutable: true },
  },
];

describe("AssetBrowser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockReturnValue({ data: ASSETS, isLoading: false, isError: false });
  });

  it("renders the asset table rows", () => {
    render(<AssetBrowser />);
    expect(screen.getByText("USD Coin")).toBeTruthy();
    expect(screen.getByText("Lumen")).toBeTruthy();
    expect(screen.getByText("Auth")).toBeTruthy();
    expect(screen.getByText("Immutable")).toBeTruthy();
  });

  it("filters by search query", () => {
    render(<AssetBrowser />);
    fireEvent.change(screen.getByLabelText("Search assets"), { target: { value: "usdc" } });
    expect(screen.getByText("USD Coin")).toBeTruthy();
    expect(screen.queryByText("Lumen")).toBeNull();
  });

  it("filters by auth-required flag", () => {
    render(<AssetBrowser />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.queryByText("Lumen")).toBeNull();
    expect(screen.getByText("USD Coin")).toBeTruthy();
  });

  it("sorts by supply", () => {
    render(<AssetBrowser />);
    fireEvent.click(screen.getByText("Supply"));
    // Sorting works without throwing
    expect(screen.getByText("USD Coin")).toBeTruthy();
  });

  it("shows empty state when nothing matches", () => {
    render(<AssetBrowser />);
    fireEvent.change(screen.getByLabelText("Search assets"), { target: { value: "zzz" } });
    expect(screen.getByText("No assets match your search.")).toBeTruthy();
  });

  it("shows error state", () => {
    useQueryMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<AssetBrowser />);
    expect(screen.getByText(/Asset catalog is temporarily unavailable/)).toBeTruthy();
  });

  it("shows loading skeletons", () => {
    useQueryMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<AssetBrowser />);
    expect(screen.getByText("Asset Catalog")).toBeTruthy();
  });
});

// =========================================================================
// PortfolioWidget
// =========================================================================
vi.mock("@/lib/stellar/queries", () => ({
  usePortfolioSummary: () => usePortfolioSummaryMock(),
  useTradeHistory: () => useTradeHistoryMock(),
  useTokenBalance: () => useQueryMock(),
  useXlmBalance: () => useQueryMock(),
  useOraclePrice: () => useQueryMock(),
  useOrderbook: () => useQueryMock(),
  usePriceHistory: () => useQueryMock(),
}));

vi.mock("@/components/providers/live-sync-hooks", () => ({
  useLiveAccountStream: () => {},
}));

vi.mock("@/lib/stellar/account", () => ({
  isValidPublicKey: (a: string) => a.startsWith("G") && a.length === 56,
}));

vi.mock("@/lib/stellar/config", () => ({
  getActiveNetwork: () => ({ label: "Testnet", passphrase: "test" }),
  explorerAccountUrl: (a: string) => `https://explorer/account/${a}`,
  explorerTxUrl: (h: string) => `https://explorer/tx/${h}`,
}));

vi.mock("@/components/portfolio/balance-table", () => ({
  BalanceTable: () => <div data-testid="balance-table" />,
}));

vi.mock("@/components/portfolio/trade-history", () => ({
  TradeHistory: () => <div data-testid="trade-history" />,
}));

vi.mock("@/components/charts/allocation-donut", () => ({
  AllocationDonut: () => <div data-testid="allocation-donut" />,
}));

vi.mock("@/components/ui/stat-card", () => ({
  StatCard: ({ label, value }: { label: string; value: string }) => (
    <div>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}));

import { PortfolioWidget } from "@/components/portfolio/portfolio-widget";

describe("PortfolioWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWalletMock.mockReturnValue({ address: null });
    usePortfolioSummaryMock.mockReturnValue({
      data: {
        address: VALID_ADDRESS,
        totalValueXlm: 1234.5,
        assetCount: 3,
        balances: [{ token: { code: "XLM" }, valueInXlm: 100, balance: "10" }],
      },
      isLoading: false,
      isError: false,
    });
    useTradeHistoryMock.mockReturnValue({ data: [], isLoading: false });
  });

  it("shows the watch prompt without an address", () => {
    render(<PortfolioWidget />);
    expect(screen.getByText("Watch any Stellar account")).toBeTruthy();
  });

  it("loads a portfolio for a manually entered address", async () => {
    useWalletMock.mockReturnValue({ address: null });
    render(<PortfolioWidget />);
    fireEvent.change(screen.getByLabelText("Stellar public key"), {
      target: { value: VALID_ADDRESS },
    });
    fireEvent.click(screen.getByRole("button", { name: "Load Portfolio" }));
    expect(await screen.findByText("Total Value")).toBeTruthy();
    expect(screen.getByText("1234.5 XLM")).toBeTruthy();
    expect(screen.getByTestId("allocation-donut")).toBeTruthy();
    expect(screen.getByTestId("balance-table")).toBeTruthy();
    expect(screen.getByTestId("trade-history")).toBeTruthy();
  });

  it("warns on invalid address input", () => {
    render(<PortfolioWidget />);
    fireEvent.change(screen.getByLabelText("Stellar public key"), { target: { value: "bad" } });
    expect(screen.getByText(/Enter a valid Stellar public key/)).toBeTruthy();
  });

  it("shows error banner on fetch failure", async () => {
    usePortfolioSummaryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    useWalletMock.mockReturnValue({ address: VALID_ADDRESS });
    render(<PortfolioWidget />);
    expect(await screen.findByText(/Could not load this account/)).toBeTruthy();
  });
});

// =========================================================================
// ConnectWalletButton — connected state
// =========================================================================
vi.mock("@/lib/stellar/wallet-kit", () => ({
  isWalletAvailable: () => Promise.resolve(true),
  subscribeWalletEvents: () => Promise.resolve(() => {}),
}));

vi.mock("@/components/wallet/disconnect-dialog", () => ({
  DisconnectDialog: ({
    address,
    onConfirm,
    onCancel,
  }: {
    address: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) => (
    <div data-testid="disconnect-dialog">
      <span>{address}</span>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";

describe("ConnectWalletButton (connected)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockReturnValue({ data: "123.45" });
  });

  it("shows the truncated address and balance", () => {
    useWalletMock.mockReturnValue({
      address: VALID_ADDRESS,
      status: "connected",
      connect: vi.fn(),
      disconnect: vi.fn(),
    });
    render(<ConnectWalletButton />);
    expect(screen.getByText(/GAAAAA/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /GAAAAA/ }));
    expect(screen.getByText("123.5 XLM")).toBeTruthy();
    expect(screen.getByRole("link", { name: /View on explorer/ })).toHaveAttribute(
      "href",
      `https://explorer/account/${VALID_ADDRESS}`
    );
  });

  it("opens the disconnect confirmation", () => {
    useWalletMock.mockReturnValue({
      address: VALID_ADDRESS,
      status: "connected",
      connect: vi.fn(),
      disconnect: vi.fn(),
    });
    render(<ConnectWalletButton />);
    fireEvent.click(screen.getByRole("button", { name: /GAAAAA/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Disconnect/ }));
    expect(screen.getByTestId("disconnect-dialog")).toBeTruthy();
  });

  it("disconnects and shows a toast on confirm", () => {
    const disconnect = vi.fn();
    useWalletMock.mockReturnValue({
      address: VALID_ADDRESS,
      status: "connected",
      connect: vi.fn(),
      disconnect,
    });
    render(<ConnectWalletButton />);
    fireEvent.click(screen.getByRole("button", { name: /GAAAAA/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Disconnect/ }));
    fireEvent.click(screen.getByText("Confirm"));
    expect(disconnect).toHaveBeenCalled();
    expect(toastMock.info).toHaveBeenCalledWith("Wallet disconnected");
  });
});

// =========================================================================
// wallet-kit helpers
// =========================================================================
import { isWalletAvailable } from "@/lib/stellar/wallet-kit";

describe("wallet-kit", () => {
  it("exports expected helpers", () => {
    expect(typeof isWalletAvailable).toBe("function");
  });
});
