import { Address, contract, rpc, scValToNative, xdr } from "@stellar/stellar-sdk";
import { getActiveNetwork } from "@/lib/stellar/config";
import { getSorobanRpcServer, getTradingPreferencesContractId } from "@/lib/soroban/config";
import { signTransactionXdr } from "@/lib/stellar/wallet-kit";

/** On-chain trading preferences mirroring the Rust contract struct. */
export interface OnChainPreferences {
  /** Maximum acceptable slippage in basis points (1% = 100 bps). */
  max_slippage_bps: number;
  /** Preferred routing mode ("direct" | "auto" | "bridge"). */
  routing_mode: string;
  /** Assets the account is willing to trade (empty = all allowed). */
  allowed_assets: string[];
}

/** Result of a contract write — distinguishes cancellation from failure. */
export type ContractWriteResult =
  { ok: true; hash: string } | { ok: false; reason: "not-configured" | "cancelled" | "failed" };

/**
 * Build the Preferences struct ScVal. Rust structs encode as an ScMap keyed
 * by symbol, so we construct it explicitly (nativeToScVal map hints are
 * tuple-shaped and easy to get wrong).
 */
export function preferencesToScVal(prefs: OnChainPreferences): xdr.ScVal {
  return xdr.ScVal.scvMap([
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol("max_slippage_bps"),
      val: xdr.ScVal.scvU32(prefs.max_slippage_bps),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol("routing_mode"),
      val: xdr.ScVal.scvSymbol(prefs.routing_mode),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol("allowed_assets"),
      val: xdr.ScVal.scvVec(prefs.allowed_assets.map((a) => xdr.ScVal.scvSymbol(a))),
    }),
  ]);
}

/** Decode a Preferences struct ScVal into a typed object. */
export function preferencesFromScVal(scv: xdr.ScVal): OnChainPreferences {
  const native = scValToNative(scv) as Record<string, unknown>;
  return {
    max_slippage_bps: Number(native.max_slippage_bps ?? 100),
    routing_mode: String(native.routing_mode ?? "auto"),
    allowed_assets: Array.isArray(native.allowed_assets) ? native.allowed_assets.map(String) : [],
  };
}

/** Read an account's on-chain preferences (defaults when unset). Returns null when unconfigured/offline. */
export async function readTradingPreferences(address: string): Promise<OnChainPreferences | null> {
  const contractId = getTradingPreferencesContractId();
  if (!contractId) return null;

  const network = getActiveNetwork();
  try {
    const tx = await contract.AssembledTransaction.build({
      contractId,
      method: "get_preferences",
      args: [new Address(address).toScVal()],
      publicKey: address,
      networkPassphrase: network.passphrase,
      rpcUrl: network.rpcUrl,
      server: getSorobanRpcServer(),
      parseResultXdr: preferencesFromScVal,
    });
    const { result } = await tx.simulate();
    return result;
  } catch {
    return null;
  }
}

/**
 * Write an account's on-chain preferences via the connected wallet.
 * Returns a discriminated result so the UI can distinguish a cancelled
 * signature from a genuine contract-execution failure.
 */
export async function writeTradingPreferences(
  address: string,
  prefs: OnChainPreferences
): Promise<ContractWriteResult> {
  const contractId = getTradingPreferencesContractId();
  if (!contractId) return { ok: false, reason: "not-configured" };

  const network = getActiveNetwork();
  try {
    const tx = await contract.AssembledTransaction.build({
      contractId,
      method: "set_preferences",
      args: [new Address(address).toScVal(), preferencesToScVal(prefs)],
      publicKey: address,
      networkPassphrase: network.passphrase,
      rpcUrl: network.rpcUrl,
      server: getSorobanRpcServer(),
      parseResultXdr: () => null,
      signTransaction: async (txXdr: string) => {
        const signedTxXdr = await signTransactionXdr(txXdr, {
          networkPassphrase: network.passphrase,
          address,
        });
        return { signedTxXdr };
      },
    });
    // signAndSend() awaits the SDK's internal getTransaction confirmation
    // loop, so once it resolves the transaction has finalized on-chain and
    // getTransactionResponse carries the definitive status + txHash.
    const sent = await tx.signAndSend();
    const confirmed = sent.getTransactionResponse;
    if (confirmed && confirmed.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
      return { ok: false, reason: "failed" };
    }
    const hash = confirmed?.txHash ?? sent.sendTransactionResponse?.hash;
    if (!hash) return { ok: false, reason: "failed" };
    return { ok: true, hash };
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("cancel") || message.includes("decline")) {
      return { ok: false, reason: "cancelled" };
    }
    return { ok: false, reason: "failed" };
  }
}
