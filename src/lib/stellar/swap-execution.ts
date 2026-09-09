import { Operation, TransactionBuilder, BASE_FEE } from "@stellar/stellar-sdk";
import { getHorizonServer } from "@/lib/stellar/horizon";
import { toSdkAsset } from "@/lib/stellar/asset";
import { explorerTxUrl, getActiveNetwork } from "@/lib/stellar/config";
import { signTransactionXdr } from "@/lib/stellar/wallet-kit";
import { calculateFee, getFeeCollector, getFeeBps } from "@/lib/stellar/fee-collector";
import { sleep } from "@/lib/utils/async";
import type { StellarAsset } from "@/lib/stellar/types";

/** Minimal surface of a Horizon server needed for transaction polling. */
interface PollableServer {
  transactions: () => {
    transaction: (hash: string) => { call: () => Promise<unknown> };
  };
}

/** How many times to poll Horizon for an ambiguously-submitted transaction. */
export const AMBIGUOUS_TX_POLL_ATTEMPTS = 5;
/** Delay between polls, in milliseconds. */
export const AMBIGUOUS_TX_POLL_DELAY_MS = 1000;

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
} /** Native XLM reserve required to open a trustline (Stellar base reserve). */
export const TRUSTLINE_RESERVE_XLM = 0.5;

/** Stroops per XLM — 1 XLM = 10^7 stroops. */
const STROOPS_PER_XLM = 10_000_000; /**
 * Fetch the network's current base reserve (the XLM required to open a
 * trustline) from Horizon's latest ledger. Falls back to the hardcoded
 * default when the lookup fails so swap checks still work during outages.
 *
 * `fetchLatestLedger` is injected so callers own the (loosely-typed)
 * Horizon call-builder cast and the helper stays trivially unit-testable.
 */
export async function getBaseReserveXlm(
  fetchLatestLedger: () => Promise<{ base_reserve_in_stroops?: number }>,
  fallbackXlm = TRUSTLINE_RESERVE_XLM
): Promise<number> {
  try {
    const ledger = await fetchLatestLedger();
    if (typeof ledger.base_reserve_in_stroops === "number" && ledger.base_reserve_in_stroops > 0) {
      return ledger.base_reserve_in_stroops / STROOPS_PER_XLM;
    }
  } catch {
    // Horizon unavailable — fall through to the fallback.
  }
  return fallbackXlm;
}

/**
 * Whether the account can fund the XLM trustline reserve. Returns true when
 * no trustline is needed, so callers can guard a change-trust op with a
 * single check. A missing native balance entry counts as zero.
 */
export function hasTrustlineReserve(
  balances: ReadonlyArray<{
    asset_type?: string;
    asset_code?: string;
    asset_issuer?: string;
    balance?: string;
  }>,
  output: StellarAsset,
  reserveXlm = TRUSTLINE_RESERVE_XLM
): boolean {
  if (!needsTrustline(balances, output)) return true;
  const native = balances.find((b) => b.asset_type === "native");
  return Number(native?.balance ?? 0) >= reserveXlm;
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
 * Poll Horizon for a transaction until it appears or the attempt budget is
 * exhausted. Returns the hash when found, `null` otherwise.
 *
 * Used after a submission that may or may not have reached the network
 * (timeout / connection drop): declaring failure immediately would let a
 * user retry a swap that actually succeeded, double-spending funds.
 */
export async function pollForTransaction(
  server: PollableServer,
  hash: string,
  attempts = AMBIGUOUS_TX_POLL_ATTEMPTS,
  delayMs = AMBIGUOUS_TX_POLL_DELAY_MS
): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    await sleep(delayMs);
    try {
      await server.transactions().transaction(hash).call();
      return hash;
    } catch {
      // Not confirmed yet — keep polling until the budget runs out.
    }
  }
  return null;
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
  // Hoisted so the catch block can recompute the tx hash for recovery polling.
  let parsed: ReturnType<typeof TransactionBuilder.fromXDR> | null = null;

  try {
    report("checking");
    const account = await server.loadAccount(params.address);

    const needTrustline = needsTrustline(account.balances, params.output);

    // Pre-execution check: creating a trustline locks the network's current
    // base reserve (nominally 0.5 XLM, but read from Horizon so a protocol
    // change can't silently break the check). Fail fast with a clear message
    // instead of surfacing Horizon's cryptic op_underfunded after signing.
    // Horizon's ledger("latest") call builder is loosely typed in the SDK;
    // the /ledgers/:id endpoint resolves to a single ledger record, so cast
    // once here and keep the helper type-clean.
    const reserveXlm = needTrustline
      ? await getBaseReserveXlm(
          () =>
            server.ledgers().ledger("latest").call() as Promise<{
              base_reserve_in_stroops?: number;
            }>
        )
      : TRUSTLINE_RESERVE_XLM;
    if (needTrustline && !hasTrustlineReserve(account.balances, params.output, reserveXlm)) {
      report("failed");
      return {
        phase: "failed",
        error: `Insufficient XLM for trustline reserve (${reserveXlm} XLM required)`,
        errorKind: "insufficient-balance",
      };
    }

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
    parsed = TransactionBuilder.fromXDR(signedXdr, network.passphrase);
    const result = await server.submitTransaction(parsed);

    if (result.successful === false) {
      // The network received the transaction and rejected it (bad sequence,
      // op_underfunded, …). This is a definite failure — do not report success.
      report("failed");
      return {
        phase: "failed",
        error: `Transaction rejected by the network (hash ${result.hash}).`,
        errorKind: "invalid-transaction",
      };
    }

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
    // A submission that threw a network/timeout error may still have been
    // accepted by Horizon — the client just never saw the response. Poll for
    // the transaction by its locally-computed hash before declaring failure,
    // so users don't retry a swap that already succeeded (double spend).
    if (classifySwapError(error) === "network" && parsed) {
      try {
        const hash = parsed.hash().toString("hex");
        const confirmed = await pollForTransaction(server, hash);
        if (confirmed) {
          report("success");
          if (onSuccess) {
            try {
              await onSuccess(confirmed);
            } catch {
              // Non-fatal: order marking failed but swap succeeded.
            }
          }
          return {
            phase: "success",
            hash: confirmed,
            explorerUrl: explorerTxUrl(confirmed),
          };
        }
      } catch {
        // Polling itself failed — fall through to the failure path.
      }
    }

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
