import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/stellar/wallet-store", () => ({
  useWallet: () => ({ address: null, connect: vi.fn(), status: "disconnected" }),
}));

describe("ConnectWalletButton", () => {
  it("shows connect prompt when disconnected", async () => {
    const { ConnectWalletButton } = await import("@/components/wallet/connect-wallet-button");
    render(<ConnectWalletButton />);
    expect(screen.getByText(/Connect Wallet/)).toBeInTheDocument();
  });

  it("renders the Freighter install link", async () => {
    const { ConnectWalletButton } = await import("@/components/wallet/connect-wallet-button");
    render(<ConnectWalletButton />);
    expect(screen.getByText(/Install Freighter/)).toBeInTheDocument();
  });
});
