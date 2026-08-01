import { rpc } from "@stellar/stellar-sdk";
import { getActiveNetwork } from "@/lib/stellar/config";

/**
 * Soroban contract configuration.
 *
 * Contract IDs are resolved from NEXT_PUBLIC_* environment variables so the
 * deployed addresses can differ per environment (testnet vs mainnet). When a
 * contract is not deployed yet, the getter returns null and the UI shows a
 * "not configured" state instead of failing.
 */

/** Trading-preferences contract (per-account slippage, routing, allow-list). */
export function getTradingPreferencesContractId(): string | null {
  return process.env.NEXT_PUBLIC_TRADING_PREFERENCES_CONTRACT_ID ?? null;
}

/** Market-oracle contract (admin-gated price observations). */
export function getMarketOracleContractId(): string | null {
  return process.env.NEXT_PUBLIC_MARKET_ORACLE_CONTRACT_ID ?? null;
}

/** Lazily-created Soroban RPC client for the active network. */
let rpcServer: rpc.Server | null = null;

export function getSorobanRpcServer(): rpc.Server {
  if (!rpcServer) {
    rpcServer = new rpc.Server(getActiveNetwork().rpcUrl, {
      allowHttp: process.env.NODE_ENV !== "production",
    });
  }
  return rpcServer;
}
