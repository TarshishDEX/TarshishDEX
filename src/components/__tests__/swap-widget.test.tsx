import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the swap widget dependencies
vi.mock("@/lib/stellar/queries", () => ({
  useSwapQuote: () => ({ data: null, isLoading: false, isError: false }),
}));

vi.mock("@/lib/stellar/wallet-store", () => ({
  useWallet: () => ({ address: null, connect: vi.fn() }),
}));

vi.mock("@/lib/hooks/use-keyboard-shortcuts", () => ({
  useKeyboardShortcuts: () => {},
}));

vi.mock("@/lib/hooks/use-debounce", () => ({
  useDebounce: (v: unknown) => v,
}));

describe("SwapWidget", () => {
  it("shows connect wallet when disconnected", async () => {
    const { SwapWidget } = await import("@/components/swap/swap-widget");
    render(<SwapWidget />);
    expect(screen.getByText("Connect Wallet to Swap")).toBeInTheDocument();
  });

  it("renders swap form structure", async () => {
    const { SwapWidget } = await import("@/components/swap/swap-widget");
    render(<SwapWidget />);
    expect(screen.getByText("Swap")).toBeInTheDocument();
    expect(screen.getByLabelText("Amount to pay")).toBeInTheDocument();
    expect(screen.getByLabelText("Amount to receive")).toBeInTheDocument();
  });

  it("shows slippage presets", async () => {
    const { SwapWidget } = await import("@/components/swap/swap-widget");
    render(<SwapWidget />);
    expect(screen.getByText("Max slippage")).toBeInTheDocument();
    expect(screen.getByText("0.1%")).toBeInTheDocument();
    expect(screen.getByText("1%")).toBeInTheDocument();
  });
});
