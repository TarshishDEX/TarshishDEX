"use client";

import { useEffect } from "react";
import { useWalletStore } from "@/lib/stellar/wallet-store";
import {
  disconnectWallet,
  isWalletAvailable,
  subscribeWalletEvents,
} from "@/lib/stellar/wallet-kit";
import { getActiveNetwork } from "@/lib/stellar/config";
import { toast } from "@/components/ui/toast";

/** How often to re-check that the wallet extension is still installed/reachable. */
const WALLET_AVAILABILITY_POLL_MS = 30_000;

/**
 * Client-side wallet bridge: subscribes to kit lifecycle events and keeps the
 * zustand store in sync (account switches, network changes, disconnects).
 */
export function WalletProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    subscribeWalletEvents({
      onStateUpdated: (address, networkPassphrase) => {
        const store = useWalletStore.getState();
        const activeNetwork = getActiveNetwork();

        // Reject a wallet connected to a different network than the app expects.
        if (address && networkPassphrase && networkPassphrase !== activeNetwork.passphrase) {
          toast.error(
            `Wrong network detected — your wallet is not connected to ${activeNetwork.label}. Switch networks and reconnect.`
          );
          store.setDisconnected();
          void disconnectWallet();
          return;
        }

        if (address) {
          store.setConnected(address, networkPassphrase);
        } else {
          store.setDisconnected();
        }
      },
      onDisconnect: () => {
        useWalletStore.getState().setDisconnected();
      },
    }).then((cleanup) => {
      if (cancelled) {
        // Component unmounted before the async subscription resolved —
        // clean up immediately to avoid leaking the SSE/kit listeners.
        cleanup();
      } else {
        unsubscribe = cleanup;
      }
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  // If the extension is disabled/uninstalled while connected, the kit never
  // emits a DISCONNECT event, so the store would stay "connected" forever.
  // Poll for availability and auto-disconnect (with a toast) when the
  // extension disappears.
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const checkAvailability = async () => {
      if (cancelled) return;
      const store = useWalletStore.getState();
      // Only care about an established session — nothing to clean up otherwise.
      if (store.status !== "connected" || !store.address) return;

      const available = await isWalletAvailable();
      if (cancelled) return;
      if (!available) {
        store.setDisconnected();
        toast.error("Wallet extension no longer detected — disconnected.");
      }
    };

    // Check once on mount so a stale persisted session is reconciled quickly,
    // then poll every 30s to catch the extension being disabled later.
    void checkAvailability();
    const interval = setInterval(checkAvailability, WALLET_AVAILABILITY_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return <>{children}</>;
}
