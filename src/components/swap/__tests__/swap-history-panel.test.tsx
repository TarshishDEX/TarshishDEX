import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SwapHistoryPanel } from "@/components/swap/swap-history-panel";
import { recordSwapHistory, clearSwapHistory } from "@/lib/hooks/use-swap-history";

describe("SwapHistoryPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    let counter = 0;
    vi.stubGlobal("crypto", {
      randomUUID: () => `uuid-${counter++}`,
    });
  });

  it("shows an empty state when no swaps recorded", () => {
    render(<SwapHistoryPanel />);
    expect(screen.getByText("Swap History")).toBeTruthy();
    expect(screen.getByText(/No swaps yet/)).toBeTruthy();
  });

  it("lists recent swap entries with amounts, status, and explorer link", () => {
    recordSwapHistory({
      inputAsset: "XLM",
      outputAsset: "USDC",
      inputAmount: "100",
      outputAmount: "90",
      status: "success",
      txHash: "abc123def456",
      explorerUrl: "https://explorer/tx/abc123def456",
    });
    recordSwapHistory({
      inputAsset: "USDC",
      outputAsset: "XLM",
      inputAmount: "50",
      outputAmount: "55",
      status: "pending",
    });
    render(<SwapHistoryPanel />);
    expect(screen.getByText(/100 XLM → 90 USDC/)).toBeTruthy();
    expect(screen.getByText(/50 USDC → 55 XLM/)).toBeTruthy();
    expect(screen.getByText("Success")).toBeTruthy();
    expect(screen.getByText("Pending")).toBeTruthy();
    const link = screen.getByRole("link", { name: /abc123de/ });
    expect(link).toHaveAttribute("href", "https://explorer/tx/abc123def456");
  });

  it("caps the list at the 10 most recent entries", () => {
    for (let i = 0; i < 12; i++) {
      recordSwapHistory({
        inputAsset: "XLM",
        outputAsset: "USDC",
        inputAmount: String(i),
        outputAmount: "1",
      });
    }
    render(<SwapHistoryPanel />);
    expect(screen.getByText(/11 XLM → 1 USDC/)).toBeTruthy();
    // Only the ten most recent (11 → 2) are shown; the oldest (0, 1) are not.
    expect(screen.queryByText(/^0 XLM → 1 USDC$/)).toBeNull();
    expect(screen.queryByText(/^1 XLM → 1 USDC$/)).toBeNull();
  });

  it("clears history when the Clear button is clicked", async () => {
    recordSwapHistory({
      inputAsset: "XLM",
      outputAsset: "USDC",
      inputAmount: "5",
      outputAmount: "4.5",
    });
    render(<SwapHistoryPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(screen.getByText(/No swaps yet/)).toBeTruthy());
    expect(clearSwapHistory).toBeDefined();
  });
});
