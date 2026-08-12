import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BalanceTable } from "@/components/portfolio/balance-table";
import { TradeHistory } from "@/components/portfolio/trade-history";
import { PortfolioWidget } from "@/components/portfolio/portfolio-widget";
import { PriceAlertPanel } from "@/components/features/price-alert-panel";
import { useWallet } from "@/lib/stellar/wallet-store";
import type { AccountBalance } from "@/lib/stellar/account";
import type { TradeHistoryEntry } from "@/lib/stellar/history";

// --- Mocks for PortfolioWidget dependencies ---
vi.mock("@/lib/stellar/queries", () => ({
  usePortfolioSummary: vi.fn(() => ({ data: null, isLoading: false, isError: false })),
  useTradeHistory: vi.fn(() => ({ data: null, isLoading: false })),
}));

vi.mock("@/lib/stellar/wallet-store", () => ({
  useWallet: vi.fn(() => ({ address: null, status: "disconnected" })),
}));

const mockConnectedWallet = () =>
  vi.mocked(useWallet).mockReturnValue({
    address: "G123",
    status: "connected",
    networkPassphrase: "Test",
    connect: vi.fn(),
    disconnect: vi.fn(),
    setConnected: vi.fn(),
    setDisconnected: vi.fn(),
  } as never);

vi.mock("@/components/providers/live-sync-hooks", () => ({
  useLiveAccountStream: vi.fn(),
}));

vi.mock("@/lib/stellar/account", () => ({
  isValidPublicKey: vi.fn(() => false),
}));

vi.mock("@/lib/stellar/config", () => ({
  explorerAccountUrl: (addr: string) => `https://stellar.expert/explorer/testnet/account/${addr}`,
  explorerTxUrl: (hash: string) => `https://stellar.expert/explorer/testnet/tx/${hash}`,
  getActiveNetwork: () => ({ label: "Testnet" }),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Mock crypto.randomUUID
beforeEach(() => {
  vi.stubGlobal("crypto", {
    randomUUID: () => "alert-id-123",
  });
});

// --- Mock data ---
const mockBalances: AccountBalance[] = [
  {
    token: { code: "XLM", name: "Lumen", decimals: 7, isNative: true },
    balance: 100,
    trustline: false,
    valueInXlm: 100,
  },
  {
    token: {
      code: "USDC",
      issuer: "GA5ZSE",
      name: "USD Coin",
      decimals: 7,
      isNative: false,
    },
    balance: 50,
    trustline: true,
    valueInXlm: 500,
  },
];

const mockEntries: TradeHistoryEntry[] = [
  {
    id: "1",
    type: "swap",
    summary: "XLM/USDC",
    source: "GA5Z...",
    hash: "abc123",
    ledger: 12345,
    createdAt: "2026-01-01T12:00:00Z",
    status: "successful",
    fromAsset: { code: "XLM", isNative: true },
    toAsset: { code: "USDC", issuer: "GA5Z" },
    amount: "10",
  },
  {
    id: "2",
    type: "offer",
    summary: "BTC/XLM",
    source: "GB7K...",
    ledger: 12346,
    createdAt: "2026-01-02T12:00:00Z",
    status: "successful",
    fromAsset: { code: "BTC", issuer: "GB7" },
    toAsset: { code: "XLM", isNative: true },
    amount: "1",
  },
];

// =========================================================================
// BalanceTable
// =========================================================================
describe("BalanceTable", () => {
  it("renders heading", () => {
    render(<BalanceTable balances={[]} />);
    expect(screen.getByText("Asset Balances")).toBeInTheDocument();
  });

  it("shows empty state when no balances", () => {
    render(<BalanceTable balances={[]} />);
    expect(screen.getByText("No assets found for this account.")).toBeInTheDocument();
  });

  it("shows skeleton when loading", () => {
    const { container } = render(<BalanceTable balances={[]} loading />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders balance rows with values", () => {
    render(<BalanceTable balances={mockBalances} />);
    expect(screen.getByText("XLM")).toBeInTheDocument();
    expect(screen.getByText("USDC")).toBeInTheDocument();
    expect(screen.getByText("Native")).toBeInTheDocument();
    expect(screen.getByText("16.7%")).toBeInTheDocument(); // 100/600
  });

  it("shows No market badge for null value", () => {
    const withNull: AccountBalance[] = [
      {
        token: { code: "BTC", name: "Bitcoin", decimals: 7, isNative: false, issuer: "GB7" },
        balance: 1,
        trustline: true,
        valueInXlm: null,
      },
    ];
    render(<BalanceTable balances={withNull} />);
    expect(screen.getByText("No market")).toBeInTheDocument();
  });
});

// =========================================================================
// TradeHistory
// =========================================================================
describe("TradeHistory", () => {
  it("renders heading", () => {
    render(<TradeHistory entries={[]} />);
    expect(screen.getByText("Trade History")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    render(<TradeHistory entries={[]} />);
    expect(screen.getByText("No trading activity found for this account.")).toBeInTheDocument();
  });

  it("shows skeleton when loading", () => {
    const { container } = render(<TradeHistory entries={[]} loading />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders trade entries", () => {
    render(<TradeHistory entries={mockEntries} />);
    expect(screen.getByText("XLM/USDC")).toBeInTheDocument();
    expect(screen.getByText("BTC/XLM")).toBeInTheDocument();
    expect(screen.getByText("Swap")).toBeInTheDocument();
    expect(screen.getByText("Offer")).toBeInTheDocument();
  });

  it("filters by search query", () => {
    render(<TradeHistory entries={mockEntries} />);
    fireEvent.change(screen.getByLabelText("Search trade history"), {
      target: { value: "BTC" },
    });
    expect(screen.getByText("BTC/XLM")).toBeInTheDocument();
    expect(screen.queryByText("XLM/USDC")).not.toBeInTheDocument();
  });

  it("filters by type", () => {
    render(<TradeHistory entries={mockEntries} />);
    fireEvent.change(screen.getByLabelText("Filter by type"), {
      target: { value: "swap" },
    });
    expect(screen.getByText("XLM/USDC")).toBeInTheDocument();
    expect(screen.queryByText("BTC/XLM")).not.toBeInTheDocument();
  });

  it("shows explorer link when showExplorer enabled", () => {
    render(<TradeHistory entries={mockEntries} showExplorer />);
    expect(screen.getByText("View on explorer ↗")).toBeInTheDocument();
  });

  it("shows no-match message when filters exclude everything", () => {
    render(<TradeHistory entries={mockEntries} />);
    fireEvent.change(screen.getByLabelText("Search trade history"), {
      target: { value: "zzz" },
    });
    expect(screen.getByText("No entries match your filters.")).toBeInTheDocument();
  });
});

// =========================================================================
// PortfolioWidget
// =========================================================================
describe("PortfolioWidget", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };

  it("renders heading", () => {
    render(<PortfolioWidget />, { wrapper });
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
  });

  it("renders watch-mode card with input", () => {
    render(<PortfolioWidget />, { wrapper });
    expect(screen.getByLabelText("Stellar public key")).toBeInTheDocument();
    expect(screen.getByText("Load Portfolio")).toBeInTheDocument();
  });

  it("shows empty state when no address", () => {
    render(<PortfolioWidget />, { wrapper });
    expect(screen.getByText("Watch any Stellar account")).toBeInTheDocument();
  });

  it("shows validation warning for invalid address", () => {
    render(<PortfolioWidget />, { wrapper });
    fireEvent.change(screen.getByLabelText("Stellar public key"), {
      target: { value: "bad-address" },
    });
    expect(
      screen.getByText(/Enter a valid Stellar public key/)
    ).toBeInTheDocument();
  });
});

// =========================================================================
// PriceAlertPanel
// =========================================================================
describe("PriceAlertPanel", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows connect-wallet prompt when disconnected", () => {
    render(<PriceAlertPanel />);
    expect(
      screen.getByText(/Connect your wallet to set price alerts/)
    ).toBeInTheDocument();
  });

  it("shows no-alerts message when connected with no alerts", () => {
    mockConnectedWallet();
    render(<PriceAlertPanel />);
    expect(screen.getByText("No price alerts set. Add one above.")).toBeInTheDocument();
  });

  it("loads alerts from localStorage", () => {
    mockConnectedWallet();
    localStorage.setItem(
      "tarshishdex-price-alerts",
      JSON.stringify([
        {
          id: "a1",
          asset: "XLM",
          targetPrice: 0.5,
          direction: "above",
          enabled: true,
        },
      ])
    );
    render(<PriceAlertPanel />);
    expect(screen.getByText("XLM above 0.5")).toBeInTheDocument();
  });

  it("adds a new alert", () => {
    mockConnectedWallet();
    render(<PriceAlertPanel />);
    fireEvent.change(screen.getByPlaceholderText("Price"), {
      target: { value: "1.5" },
    });
    fireEvent.click(screen.getByText("Set"));
    expect(screen.getByText("XLM above 1.5")).toBeInTheDocument();
  });

  it("toggles alert enabled state", () => {
    mockConnectedWallet();
    localStorage.setItem(
      "tarshishdex-price-alerts",
      JSON.stringify([
        {
          id: "a1",
          asset: "XLM",
          targetPrice: 0.5,
          direction: "above",
          enabled: true,
        },
      ])
    );
    render(<PriceAlertPanel />);
    fireEvent.click(screen.getByText("ON"));
    expect(screen.getByText("OFF")).toBeInTheDocument();
  });

  it("removes an alert", () => {
    mockConnectedWallet();
    localStorage.setItem(
      "tarshishdex-price-alerts",
      JSON.stringify([
        {
          id: "a1",
          asset: "XLM",
          targetPrice: 0.5,
          direction: "above",
          enabled: true,
        },
      ])
    );
    render(<PriceAlertPanel />);
    fireEvent.click(screen.getByText("✕"));
    expect(screen.getByText("No price alerts set. Add one above.")).toBeInTheDocument();
  });
});
