import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { CommandPalette } from "@/components/ui/command-palette";
import { RetryButton } from "@/components/ui/retry-button";
import { SwapExecutionPanel } from "@/components/swap/swap-execution-panel";
import {
  needsTrustline,
  intermediatePath,
  classifySwapError,
  buildSwapOperations,
} from "@/lib/stellar/swap-execution";
import type { StellarAsset, SwapRoute } from "@/lib/stellar/types";

// --- Mocks ---
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/stellar/wallet-store", () => ({
  useWallet: vi.fn(() => ({
    address: "G123",
    networkPassphrase: "Test",
  })),
}));

vi.mock("@/lib/stellar/swap-execution", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stellar/swap-execution")>();
  return {
    ...actual,
    executeSwap: vi.fn(),
  };
});

vi.mock("@/lib/stellar/contract-submit", () => ({
  signAndSubmitContractTx: vi.fn(() => Promise.resolve({ success: true })),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    isLoading,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled || isLoading}>
      {isLoading ? "Loading…" : children}
    </button>
  ),
}));

import { executeSwap } from "@/lib/stellar/swap-execution";

const ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

const mockQuote: SwapRoute = {
  outputAmount: "95.5",
  priceImpactPct: 0.3,
  executionPrice: 0.955,
  minReceived: "94.5",
  feeEstimateXlm: "0.1",
  path: [
    { code: "XLM", isNative: true },
    { code: "USDC", issuer: ISSUER },
  ],
  warnings: [],
  slippagePct: 1,
  method: "direct",
  sourceAmount: "100",
};

const mockInput: StellarAsset = { code: "XLM", isNative: true };
const mockOutput: StellarAsset = { code: "USDC", issuer: ISSUER };

// =========================================================================
// CommandPalette
// =========================================================================
describe("CommandPalette", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<CommandPalette />);
    expect(container.firstChild).toBeNull();
  });

  it("opens on Cmd+K", () => {
    render(<CommandPalette />);
    act(() => {
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });
    expect(screen.getByText("Swap")).toBeInTheDocument();
    expect(screen.getByText("Markets")).toBeInTheDocument();
  });

  it("opens on Ctrl+K", () => {
    render(<CommandPalette />);
    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
  });

  it("filters commands by query", () => {
    render(<CommandPalette />);
    act(() => {
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });
    fireEvent.change(screen.getByPlaceholderText("Type a command or search…"), {
      target: { value: "port" },
    });
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
    expect(screen.queryByText("Swap")).not.toBeInTheDocument();
  });

  it("shows No results when query matches nothing", () => {
    render(<CommandPalette />);
    act(() => {
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });
    fireEvent.change(screen.getByPlaceholderText("Type a command or search…"), {
      target: { value: "zzz" },
    });
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<CommandPalette />);
    act(() => {
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });
    expect(screen.getByText("Swap")).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(screen.getByPlaceholderText("Type a command or search…"), {
        key: "Escape",
      });
    });
    expect(screen.queryByText("Swap")).not.toBeInTheDocument();
  });

  it("navigates on Enter", () => {
    pushMock.mockClear();
    render(<CommandPalette />);
    act(() => {
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });
    fireEvent.change(screen.getByPlaceholderText("Type a command or search…"), {
      target: { value: "swap" },
    });
    act(() => {
      fireEvent.keyDown(screen.getByPlaceholderText("Type a command or search…"), {
        key: "Enter",
      });
    });
    expect(pushMock).toHaveBeenCalledWith("/swap");
  });

  it("navigates on click", () => {
    pushMock.mockClear();
    render(<CommandPalette />);
    act(() => {
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });
    fireEvent.click(screen.getByText("Markets"));
    expect(pushMock).toHaveBeenCalledWith("/markets");
  });

  it("closes on backdrop click", () => {
    render(<CommandPalette />);
    act(() => {
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });
    const backdrop = document.querySelector('[class*="fixed inset-0"]');
    expect(backdrop).toBeTruthy();
    if (backdrop) fireEvent.click(backdrop);
    expect(screen.queryByText("Swap")).not.toBeInTheDocument();
  });
});

// =========================================================================
// RetryButton
// =========================================================================
describe("RetryButton", () => {
  it("renders with retry count", () => {
    render(<RetryButton onRetry={vi.fn()} />);
    expect(screen.getByText("Retry")).toBeInTheDocument();
    expect(screen.getByText("3 retries remaining")).toBeInTheDocument();
  });

  it("calls onRetry on click", async () => {
    const onRetry = vi.fn();
    render(<RetryButton onRetry={onRetry} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Retry"));
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("decrements retry count after each attempt", async () => {
    render(<RetryButton onRetry={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Retry"));
    });
    expect(screen.getByText("2 retries remaining")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByText("Retry"));
    });
    expect(screen.getByText("1 retry remaining")).toBeInTheDocument();
  });

  it("disappears after max retries exhausted", async () => {
    render(<RetryButton onRetry={vi.fn()} maxRetries={2} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Retry"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Retry"));
    });
    expect(screen.queryByText("Retry")).not.toBeInTheDocument();
  });

  it("supports custom label", () => {
    render(<RetryButton onRetry={vi.fn()} label="Try Again" />);
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });
});

// =========================================================================
// SwapExecutionPanel
// =========================================================================
describe("SwapExecutionPanel", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

  beforeEach(() => {
    // Mock executeSwap to drive the phase callback through to success
    vi.mocked(executeSwap).mockImplementation(async (_params, onPhase) => {
      onPhase?.("checking");
      onPhase?.("building");
      onPhase?.("signing");
      onPhase?.("submitting");
      onPhase?.("success");
      return {
        phase: "success",
        hash: "abc123",
        explorerUrl: "https://stellar.expert/tx/abc123",
      };
    });
  });

  it("shows quote summary", () => {
    render(
      <SwapExecutionPanel
        address="G123"
        input={mockInput}
        output={mockOutput}
        amountIn="100"
        quote={mockQuote}
        onReset={vi.fn()}
      />,
      { wrapper }
    );
    expect(screen.getByText("Confirm & Swap")).toBeInTheDocument();
    expect(screen.getByText(/100 XLM/)).toBeInTheDocument();
    expect(screen.getByText(/95.5 USDC/)).toBeInTheDocument();
  });

  it("executes swap and shows success state", async () => {
    render(
      <SwapExecutionPanel
        address="G123"
        input={mockInput}
        output={mockOutput}
        amountIn="100"
        quote={mockQuote}
        onReset={vi.fn()}
      />,
      { wrapper }
    );
    fireEvent.click(screen.getByText("Confirm & Swap"));
    await waitFor(() => {
      expect(screen.getByText("Swap completed on-chain")).toBeInTheDocument();
    });
    expect(executeSwap).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("shows error state on failure", async () => {
    vi.mocked(executeSwap).mockImplementation(async (_params, onPhase) => {
      onPhase?.("failed");
      return {
        phase: "failed",
        error: "Insufficient balance",
        errorKind: "insufficient-balance",
      };
    });
    render(
      <SwapExecutionPanel
        address="G123"
        input={mockInput}
        output={mockOutput}
        amountIn="100"
        quote={mockQuote}
        onReset={vi.fn()}
      />,
      { wrapper }
    );
    fireEvent.click(screen.getByText("Confirm & Swap"));
    await waitFor(() => {
      expect(screen.getByText("Swap failed")).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Insufficient balance for this swap/)
    ).toBeInTheDocument();
  });

  it("calls onReset for cancel", () => {
    const onReset = vi.fn();
    render(
      <SwapExecutionPanel
        address="G123"
        input={mockInput}
        output={mockOutput}
        amountIn="100"
        quote={mockQuote}
        onReset={onReset}
      />,
      { wrapper }
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("shows warnings from quote", () => {
    const quoteWithWarnings = {
      ...mockQuote,
      warnings: ["Low liquidity"],
    };
    render(
      <SwapExecutionPanel
        address="G123"
        input={mockInput}
        output={mockOutput}
        amountIn="100"
        quote={quoteWithWarnings}
        onReset={vi.fn()}
      />,
      { wrapper }
    );
    expect(screen.getByText(/Low liquidity/)).toBeInTheDocument();
  });

  it("shows route when path has more than 2 hops", () => {
    const multiHopQuote = {
      ...mockQuote,
      path: [
        { code: "XLM", isNative: true },
        { code: "BTC", issuer: "GB7" },
        { code: "USDC", issuer: "GA5Z" },
      ],
    };
    render(
      <SwapExecutionPanel
        address="G123"
        input={mockInput}
        output={mockOutput}
        amountIn="100"
        quote={multiHopQuote}
        onReset={vi.fn()}
      />,
      { wrapper }
    );
    expect(screen.getByText("Route")).toBeInTheDocument();
  });
});

// =========================================================================
// swap-execution lib
// =========================================================================
describe("swap-execution lib", () => {
  describe("needsTrustline", () => {
    it("returns false for native output", () => {
      expect(
        needsTrustline([], { code: "XLM", isNative: true })
      ).toBe(false);
    });

    it("returns true when balance missing", () => {
      expect(
        needsTrustline(
          [{ asset_type: "native", asset_code: "XLM", asset_issuer: "" }],
          { code: "USDC", issuer: ISSUER }
        )
      ).toBe(true);
    });

    it("returns false when balance exists", () => {
      expect(
        needsTrustline(
          [{ asset_type: "credit_alphanum4", asset_code: "USDC", asset_issuer: ISSUER }],
          { code: "USDC", issuer: ISSUER }
        )
      ).toBe(false);
    });
  });

  describe("intermediatePath", () => {
    it("returns empty for direct path", () => {
      expect(intermediatePath([{ code: "XLM" }, { code: "USDC" }])).toEqual([]);
    });

    it("returns middle hops for multi-path", () => {
      const path = [
        { code: "XLM" },
        { code: "BTC" },
        { code: "USDC" },
      ];
      expect(intermediatePath(path).map((a) => a.code)).toEqual(["BTC"]);
    });
  });

  describe("classifySwapError", () => {
    it("classifies insufficient balance", () => {
      expect(classifySwapError(new Error("op_underfunded"))).toBe("insufficient-balance");
      expect(classifySwapError(new Error("Insufficient balance"))).toBe("insufficient-balance");
    });

    it("classifies user cancelled", () => {
      expect(classifySwapError(new Error("User cancelled"))).toBe("user-cancelled");
      expect(classifySwapError(new Error("Rejected by user"))).toBe("user-cancelled");
    });

    it("classifies network errors", () => {
      expect(classifySwapError(new Error("Network timeout"))).toBe("network");
      expect(classifySwapError(new Error("Fetch failed"))).toBe("network");
    });

    it("classifies invalid transactions", () => {
      expect(classifySwapError(new Error("Invalid transaction"))).toBe("invalid-transaction");
      expect(classifySwapError(new Error("Malformed XDR"))).toBe("invalid-transaction");
    });

    it("returns unknown for other errors", () => {
      expect(classifySwapError(new Error("Something else"))).toBe("unknown");
      expect(classifySwapError(null)).toBe("unknown");
    });
  });

  describe("buildSwapOperations", () => {
    it("builds a path payment operation", () => {
      const ops = buildSwapOperations({
        address: VALID_ADDRESS,
        input: { code: "XLM", isNative: true },
        output: { code: "USDC", issuer: ISSUER },
        amountIn: "100",
        minReceived: "94",
        path: [
          { code: "XLM", isNative: true },
          { code: "USDC", issuer: ISSUER },
        ],
        method: "direct",
      });
      expect(ops.length).toBeGreaterThan(0);
      expect(ops[0]).toBeDefined();
    });

    it("includes fee payment for non-native input", () => {
      const ops = buildSwapOperations({
        address: VALID_ADDRESS,
        input: { code: "USDC", issuer: ISSUER },
        output: { code: "XLM", isNative: true },
        amountIn: "100",
        minReceived: "94",
        path: [
          { code: "USDC", issuer: ISSUER },
          { code: "XLM", isNative: true },
        ],
        method: "direct",
      });
      // Fee payment + path payment
      expect(ops.length).toBeGreaterThanOrEqual(2);
    });
  });
});
