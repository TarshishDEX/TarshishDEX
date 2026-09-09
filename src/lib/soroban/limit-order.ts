import { contract, nativeToScVal, scValToNative, xdr, Address } from "@stellar/stellar-sdk";
import { getActiveNetwork } from "@/lib/stellar/config";
import { getLimitOrderContractId, getSorobanRpcServer } from "@/lib/soroban/config";
import type { LimitOrder, OnChainAsset } from "@/lib/stellar/limit-order-types";

/** Null source account for read-only simulations. */
const NULL_ACCOUNT = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

/**
 * Decode an on-chain Asset ScVal (a symbol-keyed map, per the contract's
 * `Asset` struct) into an OnChainAsset. Also tolerates the legacy plain-
 * symbol form (no issuer) so stale RPC results never crash the decoder.
 */
function decodeAsset(native: unknown): OnChainAsset {
  if (typeof native === "string") {
    return { code: native, issuer: null };
  }
  const n = (native ?? {}) as { code?: unknown; issuer?: unknown };
  return { code: String(n.code ?? ""), issuer: n.issuer == null ? null : String(n.issuer) };
}

/**
 * Encode an OnChainAsset into the contract's `Asset` struct. The contract
 * derives its identity from code + issuer, so the issuer (or None for the
 * native asset) must be carried in the call args.
 */
function assetToScVal(asset: OnChainAsset): xdr.ScVal {
  return xdr.ScVal.scvMap([
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol("code"),
      val: xdr.ScVal.scvSymbol(asset.code),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol("issuer"),
      val: asset.issuer ? Address.fromString(asset.issuer).toScVal() : xdr.ScVal.scvVoid(),
    }),
  ]);
}

/** Decode an on-chain Order ScVal into a typed LimitOrder. */
function orderFromScVal(scv: xdr.ScVal): LimitOrder {
  const native = scValToNative(scv) as Record<string, unknown>;
  const price = BigInt(String(native.price ?? "0"));
  const amount = BigInt(String(native.amount ?? "0"));
  return {
    id: Number(native.id ?? 0),
    owner: String(native.owner ?? ""),
    base: decodeAsset(native.base),
    counter: decodeAsset(native.counter),
    price: Number(price),
    amount: Number(amount),
    expiryLedger: Number(native.expiry_ledger ?? 0),
    side: String(native.side ?? "") as "buy" | "sell",
    placedAt: Number(native.placed_at ?? 0),
  };
}

/** Simulate a read-only contract call. Returns null when contract is not deployed. */
async function simulateRead<T>(
  method: string,
  args: xdr.ScVal[],
  parseResult: (scv: xdr.ScVal) => T
): Promise<T | null> {
  const contractId = getLimitOrderContractId();
  if (!contractId) return null;

  const network = getActiveNetwork();
  try {
    const tx = await contract.AssembledTransaction.build({
      contractId,
      method,
      args,
      publicKey: NULL_ACCOUNT,
      networkPassphrase: network.passphrase,
      rpcUrl: network.rpcUrl,
      server: getSorobanRpcServer(),
      parseResultXdr: parseResult,
    });
    const { result } = await tx.simulate();
    return result;
  } catch {
    return null;
  }
}

/** Query a single order by ID from the limit-order contract. */
export async function queryOrder(id: number): Promise<LimitOrder | null> {
  return simulateRead("get_order", [nativeToScVal(id, { type: "u64" })], (scv) => {
    if (scv.switch() === xdr.ScValType.scvVoid()) return null;
    return orderFromScVal(scv);
  });
}

/** Query all order IDs for a user, then fetch each order. */
export async function queryUserOrders(userAddress: string): Promise<LimitOrder[]> {
  const contractId = getLimitOrderContractId();
  if (!contractId) return [];

  const network = getActiveNetwork();
  try {
    // First, get the list of order IDs for this user
    const tx = await contract.AssembledTransaction.build({
      contractId,
      method: "get_user_orders",
      args: [Address.fromString(userAddress).toScVal()],
      publicKey: NULL_ACCOUNT,
      networkPassphrase: network.passphrase,
      rpcUrl: network.rpcUrl,
      server: getSorobanRpcServer(),
      parseResultXdr: (scv: xdr.ScVal) => scValToNative(scv) as number[],
    });
    const { result: orderIds } = await tx.simulate();

    if (!orderIds || orderIds.length === 0) return [];

    // Fetch each order individually
    const orders = await Promise.all(orderIds.map((id: number) => queryOrder(id)));
    return orders.filter((o): o is LimitOrder => o !== null);
  } catch {
    return [];
  }
}

/** Get the total order count from the contract. */
export async function queryOrderCount(): Promise<number> {
  return (await simulateRead("get_order_count", [], (scv) => scValToNative(scv) as number)) ?? 0;
}

/**
 * Build a place_order transaction XDR for the user to sign.
 * Returns the transaction XDR string, or null if the contract is not deployed.
 */
export async function buildPlaceOrderTx(
  userAddress: string,
  base: OnChainAsset,
  counter: OnChainAsset,
  price: number,
  amount: number,
  expiryLedger: number,
  side: "buy" | "sell"
): Promise<string | null> {
  const contractId = getLimitOrderContractId();
  if (!contractId) return null;

  const network = getActiveNetwork();
  try {
    const tx = await contract.AssembledTransaction.build({
      contractId,
      method: "place_order",
      args: [
        Address.fromString(userAddress).toScVal(),
        assetToScVal(base),
        assetToScVal(counter),
        nativeToScVal(Math.floor(price), { type: "i128" }),
        nativeToScVal(Math.floor(amount), { type: "i128" }),
        nativeToScVal(expiryLedger, { type: "u32" }),
        nativeToScVal(side, { type: "symbol" }),
      ],
      publicKey: userAddress,
      networkPassphrase: network.passphrase,
      rpcUrl: network.rpcUrl,
      server: getSorobanRpcServer(),
      parseResultXdr: (scv: xdr.ScVal) => scValToNative(scv),
    });
    return tx.toXDR();
  } catch {
    return null;
  }
}

/**
 * Build a cancel_order or mark_executed transaction XDR.
 * Pass txHash to mark as executed; omit to cancel.
 */
export async function buildCancelOrExecuteTx(
  userAddress: string,
  orderId: number,
  txHash?: string
): Promise<string | null> {
  const contractId = getLimitOrderContractId();
  if (!contractId) return null;

  const method = txHash ? "mark_executed" : "cancel_order";
  const args: xdr.ScVal[] = [
    Address.fromString(userAddress).toScVal(),
    nativeToScVal(orderId, { type: "u64" }),
  ];
  if (txHash) {
    args.push(nativeToScVal(txHash, { type: "symbol" }));
  }

  const network = getActiveNetwork();
  try {
    const tx = await contract.AssembledTransaction.build({
      contractId,
      method,
      args,
      publicKey: userAddress,
      networkPassphrase: network.passphrase,
      rpcUrl: network.rpcUrl,
      server: getSorobanRpcServer(),
      parseResultXdr: () => undefined,
    });
    return tx.toXDR();
  } catch {
    return null;
  }
}
