import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/lib/stellar/wallet-store", () => ({
  useWallet: () => ({
    address: null,
    connect: vi.fn(),
    status: "disconnected" as const,
  }),
}));

vi.mock("@/lib/stellar/wallet-kit", () => ({
  isWalletAvailable: () => Promise.resolve(false),
}));

function withProviders(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("ConnectWalletButton", () => {
  it("shows connect prompt when disconnected", async () => {
    const { ConnectWalletButton } = await import("@/components/wallet/connect-wallet-button");
    withProviders(<ConnectWalletButton />);
    expect(screen.getByText(/Connect Wallet/)).toBeInTheDocument();
  });

  it("renders the Freighter install link after clicking connect without wallet", async () => {
    const { ConnectWalletButton } = await import("@/components/wallet/connect-wallet-button");
    withProviders(<ConnectWalletButton />);
    fireEvent.click(screen.getByText("Connect Wallet"));
    // After clicking, isWalletAvailable returns false → install hint appears
    expect(await screen.findByText(/Install Freighter/)).toBeInTheDocument();
  });
});
