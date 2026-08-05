import { getActiveNetwork, NETWORKS, type NetworkName } from "@/lib/stellar/config";

/**
 * Network metadata helpers for the active Stellar network.
 */

/** Get the explorer base URL for the active network. */
export function getExplorerUrl(): string {
  return getActiveNetwork().explorerUrl;
}

/** Get the Horizon URL for the active network. */
export function getHorizonNetworkUrl(): string {
  return getActiveNetwork().horizonUrl;
}

/** Check if we're on testnet. */
export function isTestnet(): boolean {
  return getActiveNetwork().name === "testnet";
}

/** Check if we're on the public network (mainnet). */
export function isMainnet(): boolean {
  return getActiveNetwork().name === "public";
}

/** Get all available network configurations. */
export function getAvailableNetworks(): Array<{ name: NetworkName; label: string }> {
  return Object.entries(NETWORKS).map(([name, config]) => ({
    name: name as NetworkName,
    label: config.label,
  }));
}
