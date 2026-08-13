import { describe, it, expect, vi, beforeEach } from "vitest";
import { useWalletStore, useWallet } from "@/lib/stellar/wallet-store";
import { act } from "@testing-library/react";

// Mock wallet-kit
vi.mock("@/lib/stellar/wallet-kit", () => ({
  connectWallet: vi.fn(),
  disconnectWallet: vi.fn(),
}));

// Mock config
vi.mock("@/lib/stellar/config", () => ({
  getActiveNetwork: () => ({
    name: "testnet",
    passphrase: "Test SDF Network ; September 2015",
    horizonUrl: "https://horizon-testnet.stellar.org",
    rpcUrl: "https://soroban-testnet.stellar.org",
  }),
}));

import { connectWallet, disconnectWallet } from "@/lib/stellar/wallet-kit";

beforeEach(() => {
  // Reset store state between tests
  act(() => {
    useWalletStore.setState({
      address: null,
      status: "disconnected",
      networkPassphrase: "Test SDF Network ; September 2015",
    });
  });
  vi.clearAllMocks();
});

describe("useWalletStore", () => {
  it("starts disconnected with null address", () => {
    const state = useWalletStore.getState();
    expect(state.status).toBe("disconnected");
    expect(state.address).toBeNull();
  });

  it("transitions to connecting then connected on successful connect", async () => {
    vi.mocked(connectWallet).mockResolvedValue("GABC123...");

    const promise = act(() => useWalletStore.getState().connect());

    // Immediately after calling connect, status should be "connecting"
    expect(useWalletStore.getState().status).toBe("connecting");

    await promise;

    expect(useWalletStore.getState().status).toBe("connected");
    expect(useWalletStore.getState().address).toBe("GABC123...");
  });

  it("returns true on successful connect", async () => {
    vi.mocked(connectWallet).mockResolvedValue("GABC123...");
    const result = await act(() => useWalletStore.getState().connect());
    expect(result).toBe(true);
  });

  it("returns false and resets to disconnected on connect failure", async () => {
    vi.mocked(connectWallet).mockRejectedValue(new Error("User cancelled"));

    const result = await act(() => useWalletStore.getState().connect());

    expect(result).toBe(false);
    expect(useWalletStore.getState().status).toBe("disconnected");
    expect(useWalletStore.getState().address).toBeNull();
  });

  it("disconnect clears address and sets status to disconnected", async () => {
    vi.mocked(connectWallet).mockResolvedValue("GABC123...");
    await act(() => useWalletStore.getState().connect());

    await act(() => useWalletStore.getState().disconnect());

    expect(useWalletStore.getState().address).toBeNull();
    expect(useWalletStore.getState().status).toBe("disconnected");
  });

  it("disconnect handles kit errors gracefully", async () => {
    vi.mocked(disconnectWallet).mockRejectedValue(new Error("Kit error"));

    // Should not throw
    await act(() => useWalletStore.getState().disconnect());

    expect(useWalletStore.getState().status).toBe("disconnected");
    expect(useWalletStore.getState().address).toBeNull();
  });

  it("setConnected updates address and passphrase", () => {
    act(() => {
      useWalletStore
        .getState()
        .setConnected("GDEF456...", "Public Global Stellar Network ; September 2015");
    });

    const state = useWalletStore.getState();
    expect(state.address).toBe("GDEF456...");
    expect(state.networkPassphrase).toBe("Public Global Stellar Network ; September 2015");
    expect(state.status).toBe("connected");
  });

  it("setDisconnected clears address", () => {
    act(() => {
      useWalletStore.getState().setConnected("GABC...", "test");
    });
    act(() => {
      useWalletStore.getState().setDisconnected();
    });

    expect(useWalletStore.getState().address).toBeNull();
    expect(useWalletStore.getState().status).toBe("disconnected");
  });

  it("useWallet is callable (convenience hook)", () => {
    // useWallet is a thin wrapper around useWalletStore
    // Verify it exists and is callable (hook call requires React context,
    // tested indirectly via component smoke tests)
    expect(typeof useWallet).toBe("function");
  });
});
