import { Operation, TransactionBuilder, BASE_FEE, Asset } from "@stellar/stellar-sdk";
import { getHorizonServer } from "@/lib/stellar/horizon";
import { toSdkAsset } from "@/lib/stellar/asset";
import { explorerTxUrl, getActiveNetwork } from "@/lib/stellar/config";
import { signTransactionXdr } from "@/lib/stellar/wallet-kit";
import { calculateFee, getFeeCollector, getFeeBps } from "@/lib/stellar/fee-collector";
import type { StellarAsset } from "@/lib/stellar/types";

export type SwapExecutionPhase =
  "idle" | "checking" | "building" | "signing" | "submitting" | "success" | "failed";

/** Error category for a failed swap — surfaced distinctly in the UI. */
export type SwapErrorKind =
  "insufficient-balance" | "user-cancelled" | "network" | "invalid-transaction" | "unknown";

export interface SwapExecutionState {
  phase: SwapExecutionPhase;
  hash?: string;
  explorerUrl?: string;
  error?: string;
  errorKind?: SwapErrorKind;
}

export interface SwapExecutionParams {
  /** Source account that pays for and receives the swap. */
  address: string;
  input: StellarAsset;
  output: StellarAsset;
  /** Raw amount of the input asset to send. */
  amountIn: string;
  /** Minimum output amount the user will accept (slippage-protected). */
  minReceived: string;
  /** Full route path, including input and output as first/last elements. */
  path: StellarAsset[];
  /** Route method used for fee calculation. */
  method?: string;
  /** Optional limit order ID to mark as executed on success. */
  orderId?: number;
}

/** Whether the destination asset needs a trustline created before receiving. */
export function needsTrustline(
  balances: ReadonlyArray<{ asset_type?: string; asset_code?: string; asset_issuer?: string }>,
  output: StellarAsset
): boolean {
  if (output.isNative || (output.code === "XLM" && !output.issuer)) return false;
  return !balances.some(
    (b) =>
      b.asset_type !== "native" && b.asset_code === output.code && b.asset_issuer === output.issuer
  );
}

/** Intermediate hops for a path payment — excludes the input and output assets. */
export function intermediatePath(path: StellarAsset[]): StellarAsset[] {
  return path.length > 2 ? path.slice(1, -1) : [];
} /** Build the path-payment strict-send operations for a swap, including fee. */
export function buildSwapOperations(
  params: SwapExecutionParams
): ReturnType<typeof Operation.pathPaymentStrictSend>[] {
  const { address, input, output, amountIn, minReceived, path, method } = params;
  const ops: ReturnType<typeof Operation.pathPaymentStrictSend>[] = [];

  // Fee collection: send a small percentage to the fee collector
  const feeAmount = calculateFee(amountIn, method ?? "direct");
  const feeBps = getFeeBps(method ?? "direct");
  if (feeBps > 0 && Number(feeAmount) > 0 && !input.isNative) {
    ops.push(
      Operation.payment({
        destination: getFeeCollector(),
        asset: toSdkAsset(input),
        amount: feeAmount,
      })
    );
  }

  // For native XLM input, add fee as a createAccount-like payment or skip
  // (XLM fees are collected via the Stellar base fee mechanism)

  ops.push(
    Operation.pathPaymentStrictSend({
      sendAsset: toSdkAsset(input),
      sendAmount: amountIn,
      destination: address,
      destAsset: toSdkAsset(output),
      destMin: minReceived,
      path: intermediatePath(path).map(toSdkAsset),
    })
  );
  return ops;
}

/**
 * Execute a swap end-to-end: load the source account, add a change-trust
 * operation when the destination asset is new, build + sign via the wallet,
 * then submit to Horizon. Reports progress through `onPhase`.
 */
export async function executeSwap(
  params: SwapExecutionParams,
  onPhase?: (phase: SwapExecutionPhase) => void,
  onSuccess?: (hash: string) => Promise<void>
): Promise<SwapExecutionState> {
  const report = (phase: SwapExecutionPhase) => onPhase?.(phase);
  const network = getActiveNetwork();
  const server = getHorizonServer();

  try {
    report("checking");
    const account = await server.loadAccount(params.address);

    const needTrustline = needsTrustline(account.balances, params.output);

    report("building");
    const builder = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: network.passphrase,
    });

    if (needTrustline) {
      builder.addOperation(Operation.changeTrust({ asset: toSdkAsset(params.output) }));
    }
    for (const operation of buildSwapOperations(params)) {
      builder.addOperation(operation);
    }
    const transaction = builder.setTimeout(180).build();

    report("signing");
    const signedXdr = await signTransactionXdr(transaction.toXDR(), {
      networkPassphrase: network.passphrase,
      address: params.address,
    });

    report("submitting");
    const parsed = TransactionBuilder.fromXDR(signedXdr, network.passphrase);
    const result = await server.submitTransaction(parsed);

    report("success");
    if (onSuccess) {
      try {
        await onSuccess(result.hash);
      } catch {
        // Non-fatal: order marking failed but swap succeeded
      }
    }
    return {
      phase: "success",
      hash: result.hash,
      explorerUrl: explorerTxUrl(result.hash),
    };
  } catch (error) {
    report("failed");
    const message = error instanceof Error ? error.message : "Transaction failed.";
    return {
      phase: "failed",
      error: message,
      errorKind: classifySwapError(error),
    };
  }
}

/** Map an execution error to a user-facing category for distinct messaging. */
export function classifySwapError(error: unknown): SwapErrorKind {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("op_underfunded") ||
      msg.includes("insufficient") ||
      msg.includes("underfunded")
    ) {
      return "insufficient-balance";
    }
    if (msg.includes("cancel") || msg.includes("reject") || msg.includes("decline")) {
      return "user-cancelled";
    }
    if (msg.includes("network") || msg.includes("timeout") || msg.includes("fetch")) {
      return "network";
    }
    if (
      msg.includes("invalid") ||
      msg.includes("malformed") ||
      msg.includes("bad") ||
      msg.includes("no_source")
    ) {
      return "invalid-transaction";
    }
  }
  return "unknown";
}
