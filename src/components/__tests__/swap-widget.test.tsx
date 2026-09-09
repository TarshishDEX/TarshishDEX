import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock the swap widget dependencies
vi.mock("@/lib/stellar/queries", () => ({
  useSwapQuote: () => ({ data: null, isLoading: false, isError: false }),
}));

vi.mock("@/lib/stellar/wallet-store", () => ({
  useWallet: vi.fn(() => ({ address: null, connect: vi.fn() })),
}));

vi.mock("@/lib/hooks/use-token-balance", () => ({
  useTokenBalance: vi.fn(() => ({ data: undefined })),
}));

vi.mock("@/lib/hooks/use-keyboard-shortcuts", () => ({
  useKeyboardShortcuts: () => {},
}));

vi.mock("@/lib/hooks/use-debounce", () => ({
  useDebounce: (v: unknown) => v,
}));

import { useWallet } from "@/lib/stellar/wallet-store";
import { useTokenBalance } from "@/lib/hooks/use-token-balance";

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

  it("renders percentage quick-select buttons for the input balance", async () => {
    const { SwapWidget } = await import("@/components/swap/swap-widget");
    render(<SwapWidget />);
    expect(screen.getByRole("button", { name: "25%" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "50%" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "MAX" })).toBeInTheDocument();
  });

  it("sets the amount to a percentage of the input balance", async () => {
    vi.mocked(useWallet).mockReturnValue({ address: "GALICE", connect: vi.fn() } as never);
    vi.mocked(useTokenBalance).mockReturnValue({ data: "100" } as never);
    const { SwapWidget } = await import("@/components/swap/swap-widget");
    render(<SwapWidget />);

    fireEvent.click(screen.getByRole("button", { name: "50%" }));
    expect(screen.getByLabelText("Amount to pay")).toHaveValue("50");

    fireEvent.click(screen.getByRole("button", { name: "MAX" }));
    expect(screen.getByLabelText("Amount to pay")).toHaveValue("100");
  });
});
