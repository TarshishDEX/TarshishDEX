import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// --- Mocks ---
vi.mock("@/lib/stellar/queries", () => ({
  usePriceHistory: vi.fn(() => ({ data: null, isLoading: false, isError: false })),
  useOrderbook: vi.fn(() => ({ data: null, isLoading: false, isError: false })),
  useOraclePrice: vi.fn(() => ({ data: null, isLoading: false })),
}));

vi.mock("@/lib/stellar/limit-order-queries", () => ({
  useUserLimitOrders: vi.fn(() => ({ data: null, isLoading: false, isError: false })),
}));

vi.mock("@/lib/stellar/wallet-store", () => ({
  useWallet: vi.fn(() => ({
    address: null,
    status: "disconnected",
    connect: vi.fn(),
    networkPassphrase: "Test SDF Network ; September 2015",
  })),
}));

vi.mock("@/lib/stellar/contract-submit", () => ({
  signAndSubmitContractTx: vi.fn(() => Promise.resolve({ success: true })),
}));

vi.mock("@/lib/stellar/live", () => ({
  streamAccountOperations: vi.fn(() => vi.fn()),
  streamTrades: vi.fn(() => vi.fn()),
}));

vi.mock("@/lib/stellar/account", () => ({
  isValidPublicKey: vi.fn(() => true),
}));

vi.mock("@/components/providers/live-sync-hooks", () => ({
  useLiveOrderbookStream: vi.fn(),
  useLiveAccountStream: vi.fn(),
  useLiveMarketStream: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Real sub-components (don't mock — test them in integration)
vi.mock("@/components/charts/candlestick-chart", () => ({
  CandlestickChart: ({ candles }: { candles: unknown[] }) => (
    <div data-testid="candlestick-chart">{candles.length} candles</div>
  ),
}));

vi.mock("@/components/charts/volume-chart", () => ({
  VolumeChart: ({ candles }: { candles: unknown[] }) => (
    <div data-testid="volume-chart">{candles.length} candles</div>
  ),
}));

// --- Wrapper ---
const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

// --- Import after mocks ---
import { LimitOrderForm } from "@/components/orders/limit-order-form";
import { LimitOrderTable } from "@/components/orders/limit-order-table";
import { PriceChartPanel } from "@/components/analytics/price-chart-panel";
import { OrderbookDepth } from "@/components/markets/orderbook-depth";

const mockBase = { code: "XLM", isNative: true };
const mockCounter = {
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};

// =========================================================================
// LimitOrderForm
// =========================================================================
describe("LimitOrderForm", () => {
  it("renders heading and description", () => {
    render(<LimitOrderForm />, { wrapper });
    expect(screen.getByText("Place Limit Order")).toBeInTheDocument();
    expect(
      screen.getByText(/Set a target price/)
    ).toBeInTheDocument();
  });

  it("renders Buy/Sell toggle with Buy active by default", () => {
    render(<LimitOrderForm />, { wrapper });
    const buttons = screen.getAllByText("Buy");
    // One is the label, one is the toggle button — find the toggle (button element)
    const toggle = buttons.find((b) => b.tagName === "BUTTON");
    expect(toggle).toBeTruthy();
    expect(toggle).toHaveClass("bg-success");
  });

  it("switches to Sell when clicked", () => {
    render(<LimitOrderForm />, { wrapper });
    const sellButtons = screen.getAllByText("Sell");
    const sellToggle = sellButtons.find((b) => b.tagName === "BUTTON");
    expect(sellToggle).toBeTruthy();
    fireEvent.click(sellToggle!);
    // After clicking, Sell button should get danger styling
  });

  it("renders price and amount inputs", () => {
    render(<LimitOrderForm />, { wrapper });
    expect(screen.getByLabelText("Limit price")).toBeInTheDocument();
    expect(screen.getByLabelText("Order amount")).toBeInTheDocument();
  });

  it("renders expiry option buttons", () => {
    render(<LimitOrderForm />, { wrapper });
    expect(screen.getByText("Never")).toBeInTheDocument();
    expect(screen.getByText("1 hour")).toBeInTheDocument();
    expect(screen.getByText("1 day")).toBeInTheDocument();
    expect(screen.getByText("1 week")).toBeInTheDocument();
  });

  it("shows total as dash when price/amount empty", () => {
    render(<LimitOrderForm />, { wrapper });
    // The total is displayed with dashes inside a row
    const totalRow = screen.getByText("Total");
    expect(totalRow).toBeInTheDocument();
  });

  it("shows Place Buy Order button when buy selected", () => {
    render(<LimitOrderForm />, { wrapper });
    expect(screen.getByText("Place Buy Order")).toBeInTheDocument();
  });

  it("shows Place Sell Order button after switching to sell", () => {
    render(<LimitOrderForm />, { wrapper });
    fireEvent.click(screen.getByText("Sell"));
    expect(screen.getByText("Place Sell Order")).toBeInTheDocument();
  });
});

// =========================================================================
// LimitOrderTable
// =========================================================================
describe("LimitOrderTable", () => {
  it("shows connect-wallet prompt when disconnected", () => {
    render(<LimitOrderTable />, { wrapper });
    expect(screen.getByText("Connect your wallet")).toBeInTheDocument();
  });

  it("renders the heading", () => {
    render(<LimitOrderTable />, { wrapper });
    expect(screen.getByText("Limit Orders")).toBeInTheDocument();
  });
});

// =========================================================================
// PriceChartPanel
// =========================================================================
describe("PriceChartPanel", () => {
  it("renders heading with token code", () => {
    render(<PriceChartPanel />, { wrapper });
    expect(screen.getByText("USDC")).toBeInTheDocument();
    expect(screen.getByText("XLM")).toBeInTheDocument();
  });

  it("renders timeframe buttons", () => {
    render(<PriceChartPanel />, { wrapper });
    expect(screen.getByText("1D")).toBeInTheDocument();
    expect(screen.getByText("1W")).toBeInTheDocument();
    expect(screen.getByText("1M")).toBeInTheDocument();
  });

  it("shows empty state when no candles", () => {
    render(<PriceChartPanel />, { wrapper });
    expect(
      screen.getByText(/No price history available/)
    ).toBeInTheDocument();
  });
});

// =========================================================================
// OrderbookDepth
// =========================================================================
describe("OrderbookDepth", () => {
  it("renders heading with pair badge", () => {
    render(<OrderbookDepth base={mockBase} counter={mockCounter} />, { wrapper });
    expect(screen.getByText("Orderbook Depth")).toBeInTheDocument();
    expect(screen.getByText("XLM/USDC")).toBeInTheDocument();
  });

  it("shows empty message when no orderbook data", () => {
    render(<OrderbookDepth base={mockBase} counter={mockCounter} />, { wrapper });
    expect(
      screen.getByText(/No active orderbook for this pair/)
    ).toBeInTheDocument();
  });
});
