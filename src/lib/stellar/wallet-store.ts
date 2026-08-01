import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getActiveNetwork } from "@/lib/stellar/config";
import { connectWallet, disconnectWallet } from "@/lib/stellar/wallet-kit";

export type WalletStatus = "disconnected" | "connecting" | "connected";

interface WalletState {
  /** Connected Stellar public key, or null when disconnected. */
  address: string | null;
  /** Kit network passphrase for signing. */
  networkPassphrase: string;
  status: WalletStatus;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  /** Internal — sync state from kit events (account switch, network change). */
  setConnected: (address: string, networkPassphrase: string) => void;
  setDisconnected: () => void;
}

/**
 * Wallet store with `persist` — the connected address and passphrase survive
 * page refreshes. The kit independently restores its own session and emits
 * STATE_UPDATED on load, which keeps this store in sync (see WalletProvider).
 */
export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      networkPassphrase: getActiveNetwork().passphrase,
      status: "disconnected",

      connect: async () => {
        set({ status: "connecting" });
        try {
          const address = await connectWallet();
          set({ address, status: "connected" });
          return true;
        } catch {
          set({ status: "disconnected" });
          return false;
        }
      },

      disconnect: async () => {
        try {
          await disconnectWallet();
        } catch {
          // Kit state is already reset — nothing else to clean up.
        }
        set({ address: null, status: "disconnected" });
      },

      setConnected: (address, networkPassphrase) =>
        set({ address, networkPassphrase, status: "connected" }),

      setDisconnected: () => set({ address: null, status: "disconnected" }),
    }),
    {
      name: "tarshishdex-wallet",
      // Persist only the durable session data — status is derived and can go stale.
      partialize: (state) => ({
        address: state.address,
        networkPassphrase: state.networkPassphrase,
      }),
    }
  )
);

/** Convenience hook binding the wallet store to React. */
export function useWallet() {
  return useWalletStore();
}
