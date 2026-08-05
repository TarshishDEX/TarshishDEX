"use client";

import { useMemo } from "react";
import { getActiveNetwork } from "@/lib/stellar/config";

/**
 * Returns the active Stellar network's display name.
 * "Testnet" or "Public Network" — reactive when the network changes.
 */
export function useNetworkName(): string {
  return useMemo(() => getActiveNetwork().label, []);
}

/** Returns a short network identifier: "testnet" or "public". */
export function useNetworkId(): string {
  return useMemo(() => getActiveNetwork().name, []);
}
