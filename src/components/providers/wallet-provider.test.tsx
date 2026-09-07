import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { WalletProvider } from "@/components/providers/wallet-provider";
import { toast } from "@/components/ui/toast";
import { getActiveNetwork, type NetworkConfig } from "@/lib/stellar/config";
import {
  disconnectWallet,
  isWalletAvailable,
  subscribeWalletEvents,
} from "@/lib/stellar/wallet-kit";
import { useWalletStore } from "@/lib/stellar/wallet-store";

vi.mock("@/lib/stellar/wallet-kit", () => ({
  subscribeWalletEvents: vi.fn(),
  disconnectWallet: vi.fn(),
  isWalletAvailable: vi.fn(),
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
    vi.mocked(isWalletAvailable).mockResolvedValue(true);
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

  it("auto-disconnects when the wallet extension is no longer detected", async () => {
    vi.useFakeTimers();
    try {
      useWalletStore.setState({ address: "GABC", status: "connected" });
      vi.mocked(isWalletAvailable).mockResolvedValue(false);

      render(<WalletProvider>child</WalletProvider>);
      // Flush the mount-time availability check.
      await act(async () => {});

      expect(isWalletAvailable).toHaveBeenCalled();
      expect(useWalletStore.getState().address).toBeNull();
      expect(useWalletStore.getState().status).toBe("disconnected");
      expect(toast.error).toHaveBeenCalledWith(
        "Wallet extension no longer detected — disconnected."
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps the session when the wallet extension is still available", async () => {
    vi.useFakeTimers();
    try {
      useWalletStore.setState({ address: "GABC", status: "connected" });
      vi.mocked(isWalletAvailable).mockResolvedValue(true);

      render(<WalletProvider>child</WalletProvider>);
      await act(async () => {});

      expect(useWalletStore.getState().address).toBe("GABC");
      expect(toast.error).not.toHaveBeenCalled();
      expect(disconnectWallet).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("re-checks availability on the 30s polling interval", async () => {
    vi.useFakeTimers();
    try {
      useWalletStore.setState({ address: "GABC", status: "connected" });
      vi.mocked(isWalletAvailable).mockResolvedValue(true);

      render(<WalletProvider>child</WalletProvider>);
      await act(async () => {});
      const callsAfterMount = vi.mocked(isWalletAvailable).mock.calls.length;

      // Extension disappears on the next poll tick.
      vi.mocked(isWalletAvailable).mockResolvedValue(false);
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });

      expect(vi.mocked(isWalletAvailable).mock.calls.length).toBeGreaterThan(callsAfterMount);
      expect(useWalletStore.getState().address).toBeNull();
      expect(toast.error).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
