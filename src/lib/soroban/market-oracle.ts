import { contract, nativeToScVal, scValToNative, xdr } from "@stellar/stellar-sdk";
import { getActiveNetwork } from "@/lib/stellar/config";
import { getMarketOracleContractId, getSorobanRpcServer } from "@/lib/soroban/config";

/**
 * Null source account (all-zero ed25519 public key) for read-only contract
 * simulations that never require a real signer.
 */
const NULL_ACCOUNT = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

/** A price observation published to the market-oracle contract. */
export interface PriceObservation {
  price: number;
  ledger: number;
  publisher: string;
}

/** Decode an Observation struct ScVal into a typed object. */
export function observationFromScVal(scv: xdr.ScVal): PriceObservation {
  const native = scValToNative(scv) as Record<string, unknown>;
  const price = BigInt(String(native.price ?? "0"));
  return {
    price: Number(price),
    ledger: Number(native.ledger ?? 0),
    publisher: String(native.publisher ?? ""),
  };
}

/** Read the latest observation for a base/counter pair. Returns null when unconfigured/unset. */
export async function readPriceObservation(
  base: string,
  counter: string
): Promise<PriceObservation | null> {
  const contractId = getMarketOracleContractId();
  if (!contractId) return null;

  const network = getActiveNetwork();
  try {
    const tx = await contract.AssembledTransaction.build({
      contractId,
      method: "get_observation",
      args: [nativeToScVal(base, { type: "symbol" }), nativeToScVal(counter, { type: "symbol" })],
      // Read-only call — the SDK accepts a null source account for simulation.
      publicKey: NULL_ACCOUNT,
      networkPassphrase: network.passphrase,
      rpcUrl: network.rpcUrl,
      server: getSorobanRpcServer(),
      parseResultXdr: (scv: xdr.ScVal) =>
        scv.switch() === xdr.ScValType.scvVoid() ? null : observationFromScVal(scv),
    });
    const { result } = await tx.simulate();
    return result;
  } catch {
    return null;
  }
}
