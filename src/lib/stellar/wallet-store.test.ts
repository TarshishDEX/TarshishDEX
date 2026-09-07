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

  it("switches to a new account when connect is called while already connected", async () => {
    vi.mocked(connectWallet)
      .mockResolvedValueOnce("GACCOUNT-OLD...")
      .mockResolvedValueOnce("GACCOUNT-NEW...");

    await act(() => useWalletStore.getState().connect());
    expect(useWalletStore.getState().address).toBe("GACCOUNT-OLD...");
    expect(useWalletStore.getState().status).toBe("connected");

    // Simulate the user switching accounts in the wallet picker.
    await act(() => useWalletStore.getState().connect());

    expect(useWalletStore.getState().address).toBe("GACCOUNT-NEW...");
    expect(useWalletStore.getState().status).toBe("connected");
  });

  it("setConnected replaces the active account (kit account switch)", () => {
    act(() => {
      useWalletStore.getState().setConnected("GACCOUNT-A...", "Test SDF Network ; September 2015");
    });
    act(() => {
      useWalletStore.getState().setConnected("GACCOUNT-B...", "Test SDF Network ; September 2015");
    });

    expect(useWalletStore.getState().address).toBe("GACCOUNT-B...");
    expect(useWalletStore.getState().status).toBe("connected");
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

  it("persists the connected address and rehydrates it on a fresh session (round-trip)", async () => {
    vi.mocked(connectWallet).mockResolvedValue("GABC123...");
    await act(() => useWalletStore.getState().connect());

    // The persist middleware writes only the selected slice of state to storage.
    const raw = localStorage.getItem("tarshishdex-wallet");
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw!) as { state: { address: string | null } };
    expect(persisted.state.address).toBe("GABC123...");
    // Derived runtime fields are intentionally stripped from persistence.
    expect(persisted.state).not.toHaveProperty("status");

    // Simulate a fresh page load: wipe in-memory state (setState re-persists
    // the reset, so restore the ORIGINAL snapshot to storage first), then
    // rehydrate from the persisted session data.
    act(() => {
      useWalletStore.setState({ address: null, status: "disconnected" });
    });
    expect(useWalletStore.getState().address).toBeNull();
    localStorage.setItem("tarshishdex-wallet", raw!);

    await act(async () => {
      await useWalletStore.persist.rehydrate();
    });

    expect(useWalletStore.getState().address).toBe("GABC123...");
    // status is derived at runtime and intentionally not persisted.
    expect(useWalletStore.getState().status).toBe("disconnected");
  });

  it("persisted address survives an account switch and rehydrate", async () => {
    act(() => {
      useWalletStore.getState().setConnected("GACCOUNT123...", "Test SDF Network ; September 2015");
    });

    const raw = localStorage.getItem("tarshishdex-wallet");
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw!) as { state: { address: string | null } };
    expect(persisted.state.address).toBe("GACCOUNT123...");

    act(() => {
      useWalletStore.setState({ address: null, status: "disconnected" });
    });
    localStorage.setItem("tarshishdex-wallet", raw!);
    await act(async () => {
      await useWalletStore.persist.rehydrate();
    });
    expect(useWalletStore.getState().address).toBe("GACCOUNT123...");
  });
});
