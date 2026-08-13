import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

// =========================================================================
// Hoisted mocks
// =========================================================================

const {
  walletState,
  useSwapQuoteMock,
  useOraclePriceMock,
  useUserLimitOrdersMock,
  useXlmBalanceMock,
  signAndSubmitMock,
  executeSwapMock,
  isSameAssetMock,
} = vi.hoisted(() => {
  const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
  const state = {
    address: VALID_ADDRESS as string | null,
    status: "connected" as string,
    networkPassphrase: "Test SDF Network ; September 2015",
    connect: vi.fn().mockResolvedValue(true),
    disconnect: vi.fn(),
  };
  return {
    walletState: state,
    useSwapQuoteMock: vi.fn(),
    useOraclePriceMock: vi.fn(),
    useUserLimitOrdersMock: vi.fn(),
    useXlmBalanceMock: vi.fn(),
    signAndSubmitMock: vi.fn(),
    executeSwapMock: vi.fn(),
    isSameAssetMock: vi.fn(
      (a: { code?: string; isNative?: boolean }, b: { code?: string; isNative?: boolean }) =>
        Boolean(a && b && a.code === b.code && a.isNative === b.isNative)
    ),
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

vi.mock("@/lib/stellar/asset", () => ({
  isSameAsset: isSameAssetMock,
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
  Tooltip: ({ content, children }: { content?: ReactNode; children: ReactNode }) => (
    <div>
      {content}
      {children}
    </div>
  ),
}));
vi.mock("@/components/swap/token-selector", () => ({
  TokenSelector: ({ value }: { value: { code: string } | null }) => (
    <span>{value?.code ?? "Select"}</span>
  ),
}));

import { toast } from "@/components/ui/toast";
import { LinkButton } from "@/components/ui/link-button";
import { AddressDisplay } from "@/components/ui/address-display";
import { QuoteRefreshIndicator } from "@/components/ui/quote-refresh-indicator";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { SwapExecutionPanel } from "@/components/swap/swap-execution-panel";
import { LimitOrderTable } from "@/components/orders/limit-order-table";
import { LimitOrderForm } from "@/components/orders/limit-order-form";
import { SwapWidget } from "@/components/swap/swap-widget";

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
  walletState.address = VALID_ADDRESS;
  walletState.status = "connected";
  useSwapQuoteMock.mockReset();
  useSwapQuoteMock.mockReturnValue({ data: null, isLoading: false, isError: false });
  useOraclePriceMock.mockReset();
  useUserLimitOrdersMock.mockReset();
  useXlmBalanceMock.mockReset();
  executeSwapMock.mockReset();
  signAndSubmitMock.mockReset();
  isSameAssetMock.mockClear();
  isSameAssetMock.mockImplementation(
    (a: { code?: string; isNative?: boolean }, b: { code?: string; isNative?: boolean }) =>
      Boolean(a && b && a.code === b.code && a.isNative === b.isNative)
  );
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

// =========================================================================
// LinkButton — variant/size/fullWidth branches
// =========================================================================

describe("LinkButton variants", () => {
  it("applies secondary variant, sm size, and fullWidth", () => {
    const { container } = render(
      <LinkButton href="/a" variant="secondary" size="sm" fullWidth>
        Go
      </LinkButton>
    );
    const link = screen.getByRole("link", { name: "Go" });
    expect(link).toBeTruthy();
    expect(container.querySelector(".border-border")).toBeTruthy();
    expect(container.querySelector(".h-8")).toBeTruthy();
    expect(container.querySelector(".w-full")).toBeTruthy();
  });

  it("applies lg size", () => {
    const { container } = render(
      <LinkButton href="/a" size="lg">
        Go
      </LinkButton>
    );
    expect(container.querySelector(".h-12")).toBeTruthy();
  });

  it("sets external link attributes", () => {
    render(
      <LinkButton href="/a" external>
        Go
      </LinkButton>
    );
    expect(screen.getByRole("link", { name: "Go" })).toHaveAttribute("target", "_blank");
  });
});

// =========================================================================
// AddressDisplay — copied state
// =========================================================================

describe("AddressDisplay copied state", () => {
  it("shows the checkmark and success color after copying", async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const { container } = render(<AddressDisplay address={VALID_ADDRESS} />);
    fireEvent.click(screen.getByRole("button"));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(container.querySelector(".text-success")).toBeTruthy();
    expect(screen.getByText("Copied!")).toBeTruthy();
  });

  it("renders the full address when not truncated", () => {
    render(<AddressDisplay address={VALID_ADDRESS} truncate={false} />);
    expect(screen.getByText(VALID_ADDRESS)).toBeTruthy();
  });
});

// =========================================================================
// QuoteRefreshIndicator — countdown colors
// =========================================================================

describe("QuoteRefreshIndicator colors", () => {
  it("transitions from success to warning to danger", () => {
    vi.useFakeTimers();
    const onRefresh = vi.fn();
    const { container } = render(<QuoteRefreshIndicator staleTimeMs={100} onRefresh={onRefresh} />);
    expect(container.querySelector(".bg-success")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(container.querySelector(".bg-warning")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(30);
    });
    expect(container.querySelector(".bg-danger")).toBeTruthy();
  });
});

// =========================================================================
// ConnectWalletButton — escape, outside click, connecting, null balance
// =========================================================================

describe("ConnectWalletButton menu behaviors", () => {
  it("closes the menu on Escape", () => {
    useXlmBalanceMock.mockReturnValue({ data: "100" });
    render(<ConnectWalletButton />);
    fireEvent.click(screen.getByRole("button", { name: /GAAA/ }));
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeFalsy();
  });

  it("closes the menu on outside click", () => {
    useXlmBalanceMock.mockReturnValue({ data: "100" });
    render(<ConnectWalletButton />);
    fireEvent.click(screen.getByRole("button", { name: /GAAA/ }));
    expect(screen.getByRole("menu")).toBeTruthy();
    act(() => {
      document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(screen.queryByRole("menu")).toBeFalsy();
  });

  it("shows Connecting… while connecting", () => {
    useXlmBalanceMock.mockReturnValue({ data: undefined });
    walletState.address = null;
    walletState.status = "connecting";
    render(<ConnectWalletButton />);
    expect(screen.getByText("Connecting…")).toBeTruthy();
  });

  it("renders a dash balance when the balance is null", () => {
    useXlmBalanceMock.mockReturnValue({ data: undefined });
    render(<ConnectWalletButton />);
    fireEvent.click(screen.getByRole("button", { name: /GAAA/ }));
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});

// =========================================================================
// SwapExecutionPanel — hash/error fallbacks + done steps
// =========================================================================

describe("SwapExecutionPanel fallbacks", () => {
  it("handles success without a hash", async () => {
    executeSwapMock.mockImplementation((_args: unknown, report: (p: string) => void) => {
      report("success");
      return Promise.resolve({ phase: "success" });
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
    await waitFor(() => expect(executeSwapMock).toHaveBeenCalled());
  });

  it("falls back to unknown kind/message when the failure has neither", async () => {
    executeSwapMock.mockImplementation((_args: unknown, report: (p: string) => void) => {
      report("failed");
      return Promise.resolve({ phase: "failed" });
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
    await waitFor(() => expect(screen.getByText("The swap could not be completed.")).toBeTruthy());
  });

  it("marks earlier steps as done while a later phase is active", () => {
    executeSwapMock.mockImplementation((_args: unknown, report: (p: string) => void) => {
      report("submitting");
      return new Promise(() => {});
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
    expect(screen.getAllByText("✓").length).toBeGreaterThan(0);
  });
});

// =========================================================================
// LimitOrderTable — distance sign, error fallbacks, unknown side
// =========================================================================

describe("LimitOrderTable branches", () => {
  const ORDER = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 1,
    owner: VALID_ADDRESS,
    base: "XLM",
    counter: "USDC",
    price: 0.5,
    amount: 100,
    expiryLedger: 0,
    side: "buy" as const,
    placedAt: 1700000000,
    ...overrides,
  });

  beforeEach(() => {
    useUserLimitOrdersMock.mockReturnValue({
      data: [ORDER()],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useOraclePriceMock.mockReturnValue({ data: { price: 10_000_000 }, isLoading: false });
  });

  it("shows a positive distance for an unfillable buy", () => {
    useOraclePriceMock.mockReturnValue({ data: { price: 10_000_000 }, isLoading: false });
    render(<LimitOrderTable />);
    expect(screen.getByText(/\+/)).toBeTruthy();
  });

  it("shows a negative distance for an unfillable sell", () => {
    useUserLimitOrdersMock.mockReturnValue({
      data: [ORDER({ side: "sell", price: 1 })],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useOraclePriceMock.mockReturnValue({ data: { price: 5_000_000 }, isLoading: false });
    render(<LimitOrderTable />);
    expect(screen.getByText(/-/)).toBeTruthy();
  });

  it("renders the fallback label for an unknown side", () => {
    useUserLimitOrdersMock.mockReturnValue({
      data: [ORDER({ side: "unknown" })],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useOraclePriceMock.mockReturnValue({ data: { price: 10_000_000 }, isLoading: false });
    render(<LimitOrderTable />);
    expect(screen.getByText("unknown")).toBeTruthy();
  });

  it("toasts the default message when the API error has no message", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    }) as unknown as typeof fetch;
    render(<LimitOrderTable />);
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Failed to build cancel transaction")
    );
  });
});

// =========================================================================
// LimitOrderForm — error fallbacks + signing phase
// =========================================================================

describe("LimitOrderForm branches", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("toasts the default message when the API error has no message", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    }) as unknown as typeof fetch;
    render(<LimitOrderForm />);
    fireEvent.change(screen.getByLabelText("Limit price"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Order amount"), { target: { value: "1" } });
    fireEvent.click(screen.getByText(/Place Buy Order/));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to build transaction"));
  });

  it("toasts a generic message for a non-Error failure", async () => {
    global.fetch = vi.fn().mockRejectedValue("plain string failure") as unknown as typeof fetch;
    render(<LimitOrderForm />);
    fireEvent.change(screen.getByLabelText("Limit price"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Order amount"), { target: { value: "1" } });
    fireEvent.click(screen.getByText(/Place Buy Order/));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to place order"));
  });

  it("shows the signing phase label while the wallet signs", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ xdr: "AAAA" }),
    }) as unknown as typeof fetch;
    signAndSubmitMock.mockReturnValue(new Promise(() => {}));
    render(<LimitOrderForm />);
    fireEvent.change(screen.getByLabelText("Limit price"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Order amount"), { target: { value: "1" } });
    fireEvent.click(screen.getByText(/Place Buy Order/));
    await waitFor(() => expect(screen.getByText("Signing in wallet…")).toBeTruthy());
  });
});

// =========================================================================
// SwapWidget — loading quote + same-asset
// =========================================================================

describe("SwapWidget branches", () => {
  it("renders the loading skeleton rows with a null quote", () => {
    useSwapQuoteMock.mockReturnValue({ data: null, isLoading: true, isError: false });
    render(<SwapWidget />);
    fireEvent.change(screen.getByLabelText("Amount to pay"), { target: { value: "10" } });
    expect(screen.getByText("Calculating…")).toBeTruthy();
    expect(screen.getByText("Route")).toBeTruthy();
  });

  it("shows Select different assets when the assets are identical", () => {
    isSameAssetMock.mockReturnValue(true);
    useSwapQuoteMock.mockReturnValue({ data: QUOTE, isLoading: false, isError: false });
    render(<SwapWidget />);
    expect(screen.getByText("Select different assets")).toBeTruthy();
  });
});
