"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { streamAccountOperations, streamTrades } from "@/lib/stellar/live";
import { isValidPublicKey } from "@/lib/stellar/account";
import type { StellarAsset } from "@/lib/stellar/types";

/**
 * Live-sync hooks. Each subscribes to a Horizon SSE stream and invalidates
 * the affected react-query caches on every new event, so the UI refreshes
 * automatically without manual reloads.
 */

/** Keep an account's portfolio + trade history fresh in real time. */
export function useLiveAccountStream(address: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!address || !isValidPublicKey(address)) return;

    const close = streamAccountOperations(address, () => {
      void queryClient.invalidateQueries({ queryKey: ["portfolio", address] });
      void queryClient.invalidateQueries({ queryKey: ["trade-history", address] });
    });

    return close;
  }, [address, queryClient]);
}

/** Keep an orderbook fresh by streaming trades for the pair. */
export function useLiveOrderbookStream(base: StellarAsset, counter: StellarAsset) {
  const queryClient = useQueryClient();
  const baseCode = base.code;
  const baseIssuer = base.issuer ?? "";
  const counterCode = counter.code;
  const counterIssuer = counter.issuer ?? "";

  useEffect(() => {
    const close = streamTrades(base, counter, () => {
      void queryClient.invalidateQueries({
        queryKey: ["orderbook", baseCode, baseIssuer, counterCode, counterIssuer],
      });
    });

    return close;
    // Re-subscribe only when the pair (primitives) changes, not on object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, baseCode, baseIssuer, counterCode, counterIssuer]);
}
