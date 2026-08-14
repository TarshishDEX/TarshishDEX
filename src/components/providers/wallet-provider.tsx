"use client";

import { useEffect } from "react";
import { useWalletStore } from "@/lib/stellar/wallet-store";
import { disconnectWallet, subscribeWalletEvents } from "@/lib/stellar/wallet-kit";
import { getActiveNetwork } from "@/lib/stellar/config";
import { toast } from "@/components/ui/toast";

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

  return <>{children}</>;
}
