import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { WalletProvider } from "@/components/providers/wallet-provider";
import { toast } from "@/components/ui/toast";
import { getActiveNetwork, type NetworkConfig } from "@/lib/stellar/config";
import { disconnectWallet, subscribeWalletEvents } from "@/lib/stellar/wallet-kit";
import { useWalletStore } from "@/lib/stellar/wallet-store";

vi.mock("@/lib/stellar/wallet-kit", () => ({
  subscribeWalletEvents: vi.fn(),
  disconnectWallet: vi.fn(),
}));

vi.mock("@/lib/stellar/config", () => ({
  getActiveNetwork: vi.fn(() => ({
    name: "testnet",
    label: "Testnet",
    horizonUrl: "https://horizon-testnet.stellar.org",
    rpcUrl: "https://soroban-testnet.stellar.org",
    passphrase: "Test SDF Network ; September 2015",
    explorerUrl: "https://stellar.expert/explorer/testnet",
  })),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
const PUBLIC_PASSPHRASE = "Public Global Stellar Network ; September 2015";

const TESTNET: NetworkConfig = {
  name: "testnet",
  label: "Testnet",
  horizonUrl: "https://horizon-testnet.stellar.org",
  rpcUrl: "https://soroban-testnet.stellar.org",
  passphrase: TESTNET_PASSPHRASE,
  explorerUrl: "https://stellar.expert/explorer/testnet",
};

describe("WalletProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getActiveNetwork).mockReturnValue(TESTNET);
    vi.mocked(subscribeWalletEvents).mockResolvedValue(() => {});
    vi.mocked(disconnectWallet).mockResolvedValue();
    useWalletStore.setState({ address: null, status: "disconnected" });
  });

  function getCallbacks() {
    return vi.mocked(subscribeWalletEvents).mock.calls[0]![0];
  }

  it("connects the store when the wallet network matches", () => {
    render(<WalletProvider>child</WalletProvider>);
    getCallbacks().onStateUpdated?.("GABC", TESTNET_PASSPHRASE);

    expect(useWalletStore.getState().address).toBe("GABC");
    expect(useWalletStore.getState().status).toBe("connected");
    expect(toast.error).not.toHaveBeenCalled();
    expect(disconnectWallet).not.toHaveBeenCalled();
  });

  it("warns and disconnects when the wallet network mismatches", () => {
    render(<WalletProvider>child</WalletProvider>);
    getCallbacks().onStateUpdated?.("GABC", PUBLIC_PASSPHRASE);

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(disconnectWallet).toHaveBeenCalledTimes(1);
    expect(useWalletStore.getState().address).toBeNull();
  });

  it("does not treat a missing passphrase as a mismatch", () => {
    render(<WalletProvider>child</WalletProvider>);
    getCallbacks().onStateUpdated?.("GABC", "");

    expect(useWalletStore.getState().address).toBe("GABC");
    expect(disconnectWallet).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("disconnects the store when no address is reported", () => {
    render(<WalletProvider>child</WalletProvider>);
    getCallbacks().onStateUpdated?.(undefined, TESTNET_PASSPHRASE);

    expect(useWalletStore.getState().address).toBeNull();
  });
});
