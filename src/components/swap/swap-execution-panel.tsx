"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { cn, formatNumber } from "@/lib/utils";
import {
  executeSwap,
  type SwapErrorKind,
  type SwapExecutionPhase,
} from "@/lib/stellar/swap-execution";
import { signAndSubmitContractTx } from "@/lib/stellar/contract-submit";
import { useWallet } from "@/lib/stellar/wallet-store";
import type { StellarAsset, SwapRoute } from "@/lib/stellar/types";

const PHASE_LABELS: Record<SwapExecutionPhase, string> = {
  idle: "Ready to submit",
  checking: "Checking account & trustlines…",
  building: "Building transaction…",
  signing: "Waiting for wallet signature…",
  submitting: "Submitting to Stellar…",
  success: "Swap successful",
  failed: "Swap failed",
};

const PHASE_STEPS: Array<SwapExecutionPhase> = ["checking", "building", "signing", "submitting"];

/** User-facing message per error kind (requirement #7: distinct handling). */
const ERROR_MESSAGES: Record<SwapErrorKind, string> = {
  "insufficient-balance": "Insufficient balance for this swap — check your XLM and token balances.",
  "user-cancelled": "Transaction cancelled in your wallet.",
  network: "Network error while submitting — check your connection and try again.",
  "invalid-transaction": "The transaction was rejected as invalid.",
  unknown: "The swap could not be completed.",
};

/**
 * Review + execute panel for the swap widget. Shows the finalized quote and
 * slippage warnings, then drives the swap through build → sign → submit while
 * displaying live status with an explorer link on success.
 */
export function SwapExecutionPanel({
  address,
  input,
  output,
  amountIn,
  quote,
  onReset,
  orderId,
}: {
  address: string;
  input: StellarAsset;
  output: StellarAsset;
  amountIn: string;
  quote: SwapRoute;
  onReset: () => void;
  /** Optional limit order ID — marked as executed on swap success. */
  orderId?: number;
}) {
  const [phase, setPhase] = useState<SwapExecutionPhase>("idle");
  const [hash, setHash] = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<SwapErrorKind | null>(null);
  const [orderMarked, setOrderMarked] = useState(false);
  const wallet = useWallet();

  const busy = phase !== "idle" && phase !== "success" && phase !== "failed";
  const success = phase === "success";

  async function handleConfirm() {
    setError(null);
    setHash(null);
    setOrderMarked(false);
    const result = await executeSwap(
      {
        address,
        input,
        output,
        amountIn,
        minReceived: quote.minReceived,
        path: quote.path,
        method: quote.method,
        orderId,
      },
      setPhase,
      orderId
        ? async (txHash: string) => {
            try {
              const res = await fetch("/api/orders", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: orderId, userAddress: address, txHash }),
              });
              if (!res.ok) throw new Error("Failed to build mark_executed transaction");
              const { xdr } = await res.json();
              const result = await signAndSubmitContractTx(xdr, address, wallet.networkPassphrase);
              if (result.success) {
                setOrderMarked(true);
                toast.info(`Limit order # ${orderId} marked as executed`);
              } else {
                toast.error("Swap succeeded but order marking failed: " + result.error);
              }
            } catch (err) {
              toast.error("Swap succeeded but order marking failed");
            }
          }
        : undefined
    );
    if (result.phase === "success") {
      setHash(result.hash ?? null);
      setExplorerUrl(result.explorerUrl ?? null);
    } else {
      setErrorKind(result.errorKind ?? "unknown");
      setError(result.error ?? ERROR_MESSAGES.unknown);
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      {/* Quote summary */}
      <div className="border-border bg-surface rounded-2xl border p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-foreground-muted">You pay</span>
          <span className="font-semibold tabular-nums">
            {formatNumber(Number(amountIn))} {input.code}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-foreground-muted">You receive</span>
          <span className="font-semibold tabular-nums">
            {formatNumber(Number(quote.outputAmount))} {output.code}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-foreground-muted">Minimum received</span>
          <span className="tabular-nums">
            {formatNumber(Number(quote.minReceived))} {output.code}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-foreground-muted">Price impact</span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              quote.priceImpactPct > 5 ? "text-danger" : "text-warning"
            )}
          >
            {quote.priceImpactPct.toFixed(2)}%
          </span>
        </div>
        {quote.path.length > 2 && (
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-foreground-muted">Route</span>
            <span className="font-mono text-xs">
              {quote.path.map((p, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-foreground-faint"> → </span>}
                  {p.code}
                </span>
              ))}
            </span>
          </div>
        )}
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-foreground-muted">Estimated fee</span>
          <span className="tabular-nums">≈ {formatNumber(Number(quote.feeEstimateXlm))} XLM</span>
        </div>
      </div>

      {/* Warnings */}
      {quote.warnings.length > 0 && (
        <div className="space-y-1.5">
          {quote.warnings.map((warning, i) => (
            <p key={i} className="bg-warning-soft text-warning rounded-lg px-3 py-2 text-xs">
              ⚠ {warning}
            </p>
          ))}
        </div>
      )}

      {/* Status */}
      {busy && (
        <div className="space-y-2">
          {PHASE_STEPS.map((step) => {
            const active = phase === step;
            const done = PHASE_STEPS.indexOf(phase) > PHASE_STEPS.indexOf(step);
            return (
              <div key={step} className="flex items-center gap-2.5 text-sm">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] transition-all",
                    done && "border-success/40 bg-success-soft text-success",
                    active && "border-primary bg-primary-soft text-primary",
                    !done && !active && "border-border text-foreground-faint"
                  )}
                >
                  {done ? "✓" : active ? "•" : ""}
                </span>
                <span
                  className={cn(
                    "transition-colors",
                    done || active ? "text-foreground" : "text-foreground-faint"
                  )}
                >
                  {PHASE_LABELS[step]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Success */}
      {success && hash && (
        <div className="bg-success-soft border-success/30 text-success animate-fade-in rounded-xl border px-4 py-3 text-sm">
          <p className="font-semibold">Swap completed on-chain</p>
          {orderMarked && (
            <p className="mt-1 text-xs">Limit order # {orderId} marked as executed.</p>
          )}
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block font-mono text-xs underline-offset-2 hover:underline"
            >
              View transaction on Stellar Expert ↗
            </a>
          )}
        </div>
      )}

      {/* Error — kind-specific message plus the raw detail */}
      {phase === "failed" && error && (
        <div className="bg-danger-soft text-danger rounded-xl px-4 py-3 text-sm">
          <p className="font-semibold">Swap failed</p>{" "}
          <p className="mt-1 text-xs">
            {errorKind ? ERROR_MESSAGES[errorKind] : ERROR_MESSAGES.unknown}
          </p>
          {/* Raw detail is most useful for unexpected (unknown) errors — always show it. */}
          {error && error !== ERROR_MESSAGES[errorKind ?? "unknown"] && (
            <p className="text-foreground-faint mt-1 font-mono text-[11px] break-words">{error}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button size="lg" variant="secondary" className="flex-1" onClick={onReset} disabled={busy}>
          {success ? "New Swap" : "Cancel"}
        </Button>
        <Button
          size="lg"
          fullWidth
          className="flex-[2]"
          onClick={handleConfirm}
          disabled={busy || success}
          isLoading={busy}
        >
          {busy ? PHASE_LABELS[phase] : success ? "Done" : "Confirm & Swap"}
        </Button>
      </div>

      <p className="text-foreground-faint flex items-center justify-center gap-1.5 text-center text-xs">
        <Badge tone="neutral" dot>
          Native DEX
        </Badge>
        Execution is protected by your {quote.slippagePct}% slippage limit.
      </p>
    </div>
  );
}
