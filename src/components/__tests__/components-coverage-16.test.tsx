import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import type { ReactNode, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

// =========================================================================
// Hoisted mocks (mirrors components-coverage-15)
// =========================================================================

const {
  walletState,
  walletDisconnectMock,
  useSwapQuoteMock,
  useOraclePriceMock,
  useUserLimitOrdersMock,
  useXlmBalanceMock,
  signAndSubmitMock,
  executeSwapMock,
} = vi.hoisted(() => {
  const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
  const disconnect = vi.fn();
  const state = {
    address: VALID_ADDRESS,
    status: "connected",
    networkPassphrase: "Test SDF Network ; September 2015",
    connect: vi.fn().mockResolvedValue(true),
    disconnect,
  };
  return {
    walletState: state,
    walletDisconnectMock: disconnect,
    useSwapQuoteMock: vi.fn(),
    useOraclePriceMock: vi.fn(),
    useUserLimitOrdersMock: vi.fn(),
    useXlmBalanceMock: vi.fn(),
    signAndSubmitMock: vi.fn(),
    executeSwapMock: vi.fn(),
  };
});

vi.mock("@/lib/stellar/wallet-store", () => ({
  useWallet: () => walletState,
  useWalletStore: { getState: () => walletState },
}));

vi.mock("@/lib/stellar/queries", () => ({
  useXlmBalance: useXlmBalanceMock,
  useOraclePrice: useOraclePriceMock,
  useSwapQuote: useSwapQuoteMock,
  usePriceHistory: () => ({ data: [], isLoading: false, isError: false }),
  useMarketStats: () => ({ data: [], isLoading: false, isError: false }),
}));

vi.mock("@/lib/stellar/limit-order-queries", () => ({
  useUserLimitOrders: useUserLimitOrdersMock,
}));

vi.mock("@/lib/stellar/contract-submit", () => ({
  signAndSubmitContractTx: signAndSubmitMock,
}));

vi.mock("@/lib/stellar/swap-execution", () => ({
  executeSwap: executeSwapMock,
}));

vi.mock("@/lib/stellar/wallet-kit", () => ({
  isWalletAvailable: vi.fn().mockResolvedValue(true),
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
vi.mock("@/components/ui/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/swap/token-selector", () => ({
  TokenSelector: ({ value }: { value: { code: string } | null }) => (
    <span>{value?.code ?? "Select"}</span>
  ),
}));

import { toast } from "@/components/ui/toast";
import { FocusTrap } from "@/components/ui/focus-trap";
import { PriceImpactBadge } from "@/components/ui/price-impact-badge";
import { AccessibleIcon } from "@/components/ui/accessible-icon";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { ShareLink } from "@/components/ui/share-link";
import { TransitionHeight } from "@/components/ui/transition-height";
import { TradeHistory } from "@/components/portfolio/trade-history";
import { SwapWidget } from "@/components/swap/swap-widget";
import { LimitOrderTable } from "@/components/orders/limit-order-table";
import { SwapExecutionPanel } from "@/components/swap/swap-execution-panel";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";

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

function withProviders(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  useSwapQuoteMock.mockReset();
  useSwapQuoteMock.mockReturnValue({ data: null, isLoading: false, isError: false });
  useOraclePriceMock.mockReset();
  useUserLimitOrdersMock.mockReset();
  useXlmBalanceMock.mockReset();
  executeSwapMock.mockReset();
  signAndSubmitMock.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// =========================================================================
// FocusTrap — non-Tab keys + no focusable children
// =========================================================================

describe("FocusTrap keydown branches", () => {
  it("ignores non-Tab keydown events", () => {
    const { container } = render(
      <FocusTrap>
        <button>Inside</button>
      </FocusTrap>
    );
    const trap = container.firstElementChild as HTMLElement;
    fireEvent.keyDown(trap, { key: "Escape" });
    fireEvent.keyDown(trap, { key: "Enter" });
    expect(screen.getByRole("button", { name: "Inside" })).toBeTruthy();
  });

  it("returns early when there are no focusable children", () => {
    const { container } = render(
      <FocusTrap>
        <span>plain text</span>
      </FocusTrap>
    );
    const trap = container.firstElementChild as HTMLElement;
    fireEvent.keyDown(trap, { key: "Tab" });
    expect(screen.getByText("plain text")).toBeTruthy();
  });
});

// =========================================================================
// PriceImpactBadge — low (<=0) and medium (<=1)
// =========================================================================

describe("PriceImpactBadge levels", () => {
  it("labels non-positive impact as low", () => {
    render(<PriceImpactBadge impactPct={0} />);
    expect(screen.getByText(/Low impact/)).toBeTruthy();
  });

  it("labels impact between 0.5% and 1% as medium", () => {
    render(<PriceImpactBadge impactPct={0.75} />);
    expect(screen.getByText(/Medium impact/)).toBeTruthy();
  });
});

// =========================================================================
// AccessibleIcon — non-element child passes through
// =========================================================================

describe("AccessibleIcon non-element child", () => {
  it("returns a non-element child as-is", () => {
    render(
      <AccessibleIcon label="icon">
        {
          "plain-text-child" as unknown as ReactElement<{
            className?: string;
            "aria-hidden"?: boolean;
          }>
        }
      </AccessibleIcon>
    );
    expect(screen.getByText("plain-text-child")).toBeTruthy();
  });
});

// =========================================================================
// AnimatedNumber — flash timer reset
// =========================================================================

describe("AnimatedNumber flash timer", () => {
  it("clears the flash highlight after 600ms", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<AnimatedNumber value={0} />);
    rerender(<AnimatedNumber value={10} />);
    expect(container.querySelector(".text-success")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(container.querySelector(".text-success")).toBeFalsy();
  });
});

// =========================================================================
// ShareLink — clipboard fallback resets after 2s
// =========================================================================

describe("ShareLink clipboard fallback", () => {
  it("resets the copied state after 2 seconds", async () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    render(<ShareLink url="https://example.com" title="Check this" />);
    fireEvent.click(screen.getByRole("button", { name: "Share link" }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText("Copied!")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("Share")).toBeTruthy();
  });
});

// =========================================================================
// TransitionHeight — hide timer unmounts children
// =========================================================================

describe("TransitionHeight hide timer", () => {
  it("unmounts children after the hide duration", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <TransitionHeight show={true} duration={300}>
        <div>content</div>
      </TransitionHeight>
    );
    expect(screen.getByText("content")).toBeTruthy();
    rerender(
      <TransitionHeight show={false} duration={300}>
        <div>content</div>
      </TransitionHeight>
    );
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByText("content")).toBeFalsy();
  });
});

// =========================================================================
// TradeHistory — invalid date falls back to the raw ISO string
// =========================================================================

describe("TradeHistory invalid date", () => {
  it("shows the raw ISO string when the date is invalid", () => {
    render(
      <TradeHistory
        entries={[
          {
            id: "1",
            type: "swap",
            status: "successful",
            createdAt: "not-a-date",
            source: "GAAAA",
            summary: "10 XLM → 5 USDC",
            fromAsset: { code: "XLM", isNative: true },
            toAsset: { code: "USDC", issuer: VALID_ADDRESS },
            amount: "10",
            ledger: 1,
          },
        ]}
      />
    );
    expect(screen.getByText("not-a-date")).toBeTruthy();
  });
});

// =========================================================================
// SwapWidget — high and medium price impact levels
// =========================================================================

describe("SwapWidget price impact levels", () => {
  function renderWithAmount() {
    render(<SwapWidget />);
    fireEvent.change(screen.getByLabelText("Amount to pay"), { target: { value: "10" } });
  }

  it("classifies impact above 1% as high", () => {
    useSwapQuoteMock.mockReturnValue({
      data: { ...QUOTE, priceImpactPct: 2 },
      isLoading: false,
      isError: false,
    });
    const { container } = render(<SwapWidget />);
    fireEvent.change(screen.getByLabelText("Amount to pay"), { target: { value: "10" } });
    expect(screen.getByText("2.00%")).toBeTruthy();
    expect(container.querySelector(".text-warning")).toBeTruthy();
  });

  it("classifies impact between 0.5% and 1% as medium", () => {
    useSwapQuoteMock.mockReturnValue({
      data: { ...QUOTE, priceImpactPct: 0.75 },
      isLoading: false,
      isError: false,
    });
    const { container } = render(<SwapWidget />);
    fireEvent.change(screen.getByLabelText("Amount to pay"), { target: { value: "10" } });
    expect(screen.getByText("0.75%")).toBeTruthy();
    expect(container.querySelector(".text-success")).toBeTruthy();
  });
});

// =========================================================================
// LimitOrderTable — oracle loading ellipsis
// =========================================================================

describe("LimitOrderTable oracle loading", () => {
  it("renders the loading ellipsis while the oracle price loads", () => {
    useUserLimitOrdersMock.mockReturnValue({
      data: [
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
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useOraclePriceMock.mockReturnValue({ data: undefined, isLoading: true });
    withProviders(<LimitOrderTable />);
    expect(screen.getByText("…")).toBeTruthy();
  });
});

// =========================================================================
// SwapExecutionPanel — non-ok mark_executed build throws
// =========================================================================

describe("SwapExecutionPanel mark build failure", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("toasts a generic failure when the mark_executed build is not ok", async () => {
    executeSwapMock.mockImplementation(
      (_args: unknown, _report: (p: string) => void, onMarked?: (txHash: string) => void) => {
        onMarked?.("tx-1");
        return Promise.resolve({ phase: "success", hash: "abc", explorerUrl: null });
      }
    );
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "build rejected" }),
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
      expect(toast.error).toHaveBeenCalledWith("Swap succeeded but order marking failed")
    );
  });
});

// =========================================================================
// ConnectWalletButton — cancel the disconnect dialog
// =========================================================================

describe("ConnectWalletButton disconnect cancel", () => {
  it("cancels the disconnect dialog without disconnecting", () => {
    useXlmBalanceMock.mockReturnValue({ data: "100" });
    render(<ConnectWalletButton />);
    fireEvent.click(screen.getByRole("button", { name: /GAAA/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Disconnect" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeFalsy();
    expect(walletDisconnectMock).not.toHaveBeenCalled();
  });
});
