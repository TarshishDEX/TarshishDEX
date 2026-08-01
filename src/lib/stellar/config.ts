export type NetworkName = "testnet" | "public";

export interface NetworkConfig {
  name: NetworkName;
  label: string;
  horizonUrl: string;
  rpcUrl: string;
  passphrase: string;
  explorerUrl: string;
}

export const NETWORKS: Record<NetworkName, NetworkConfig> = {
  testnet: {
    name: "testnet",
    label: "Testnet",
    horizonUrl: "https://horizon-testnet.stellar.org",
    rpcUrl: "https://soroban-testnet.stellar.org",
    passphrase: "Test SDF Network ; September 2015",
    explorerUrl: "https://stellar.expert/explorer/testnet",
  },
  public: {
    name: "public",
    label: "Public Network",
    horizonUrl: "https://horizon.stellar.org",
    rpcUrl: "https://soroban.stellar.org",
    passphrase: "Public Global Stellar Network ; September 2015",
    explorerUrl: "https://stellar.expert/explorer/public",
  },
};

/** Stellar issued assets and XLM use 7 decimal places. */
export const STELLAR_DECIMALS = 7;

/** Approximate minimum network fee per operation (XLM). */
export const BASE_FEE_XLM = "0.00001";

/** Resolve the active network, overridable via NEXT_PUBLIC_STELLAR_NETWORK. */
export function getActiveNetwork(): NetworkConfig {
  const override = process.env.NEXT_PUBLIC_STELLAR_NETWORK;
  if (override === "public") return NETWORKS.public;
  return NETWORKS.testnet;
}

/** Build an explorer URL for a transaction hash on the active network. */
export function explorerTxUrl(hash: string): string {
  return `${getActiveNetwork().explorerUrl}/tx/${hash}`;
}

/** Build an explorer URL for an account on the active network. */
export function explorerAccountUrl(address: string): string {
  return `${getActiveNetwork().explorerUrl}/account/${address}`;
}
