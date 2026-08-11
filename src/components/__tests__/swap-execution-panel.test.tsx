import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SwapExecutionPanel } from "@/components/swap/swap-execution-panel";

vi.mock("@/lib/stellar/swap-execution", () => ({
  executeSwap: vi.fn(),
}));

vi.mock("@/lib/stellar/contract-submit", () => ({
  signAndSubmitContractTx: vi.fn(),
}));

vi.mock("@/lib/stellar/wallet-store", () => ({
  useWallet: () => ({
    address: "GABC123...",
    status: "connected",
    networkPassphrase: "Test SDF Network ; September 2015",
  }),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

function makeQuote() {
  return {
    path: [
      { code: "XLM", isNative: true },
      { code: "USDC", issuer: "GA5Z..." },
    ],
    sourceAmount: "100",
    outputAmount: "12.5",
    executionPrice: 0.125,
    priceImpactPct: 0.5,
    minReceived: "12.375",
    feeEstimateXlm: "0.00001",
    slippagePct: 1,
    method: "direct" as const,
    warnings: [] as string[],
  };
}

const defaultProps = {
  address: "GABC123...",
  input: { code: "XLM", isNative: true } as const,
  output: { code: "USDC", issuer: "GA5Z..." } as const,
  amountIn: "100",
  onReset: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SwapExecutionPanel — idle state", () => {
  it("renders quote summary", () => {
    render(<SwapExecutionPanel {...defaultProps} quote={makeQuote()} />);
    expect(screen.getByText("You pay")).toBeDefined();
    expect(screen.getByText("You receive")).toBeDefined();
    expect(screen.getByText("Confirm & Swap")).toBeDefined();
    expect(screen.getByText("Cancel")).toBeDefined();
  });

  it("shows price impact percentage", () => {
    render(<SwapExecutionPanel {...defaultProps} quote={makeQuote()} />);
    expect(screen.getByText("Price impact")).toBeDefined();
  });

  it("shows estimated fee", () => {
    render(<SwapExecutionPanel {...defaultProps} quote={makeQuote()} />);
    expect(screen.getByText("Estimated fee")).toBeDefined();
  });

  it("shows slippage notice", () => {
    render(<SwapExecutionPanel {...defaultProps} quote={makeQuote()} />);
    expect(screen.getByText(/slippage limit/)).toBeDefined();
  });

  it("shows route for multi-hop paths", () => {
    const quote = {
      ...makeQuote(),
      path: [
        { code: "XLM", isNative: true },
        { code: "EURMTL", issuer: "GACK..." },
        { code: "USDC", issuer: "GA5Z..." },
      ],
    };
    render(<SwapExecutionPanel {...defaultProps} quote={quote} />);
    expect(screen.getByText("Route")).toBeDefined();
  });

  it("hides route for direct paths (2 hops)", () => {
    render(<SwapExecutionPanel {...defaultProps} quote={makeQuote()} />);
    expect(screen.queryByText("Route")).toBeNull();
  });

  it("shows warnings when present", () => {
    const quote = {
      ...makeQuote(),
      warnings: ["High price impact: 6%"],
    };
    render(<SwapExecutionPanel {...defaultProps} quote={quote} />);
    expect(screen.getByText(/High price impact/)).toBeDefined();
  });

  it("calls onReset when cancel clicked", () => {
    const onReset = vi.fn();
    render(
      <SwapExecutionPanel
        {...defaultProps}
        quote={makeQuote()}
        onReset={onReset}
      />
    );
    screen.getByText("Cancel").click();
    expect(onReset).toHaveBeenCalled();
  });
});
