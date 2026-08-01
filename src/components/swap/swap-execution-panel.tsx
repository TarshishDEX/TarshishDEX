"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatNumber } from "@/lib/utils";
import { executeSwap, type SwapExecutionPhase } from "@/lib/stellar/swap-execution";
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
}: {
  address: string;
  input: StellarAsset;
  output: StellarAsset;
  amountIn: string;
  quote: SwapRoute;
  onReset: () => void;
}) {
  const [phase, setPhase] = useState<SwapExecutionPhase>("idle");
  const [hash, setHash] = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = phase !== "idle" && phase !== "success" && phase !== "failed";
  const success = phase === "success";

  async function handleConfirm() {
    setError(null);
    setHash(null);
    const result = await executeSwap(
      {
        address,
        input,
        output,
        amountIn,
        minReceived: quote.minReceived,
        path: quote.path,
      },
      setPhase
    );
    if (result.phase === "success") {
      setHash(result.hash ?? null);
      setExplorerUrl(result.explorerUrl ?? null);
    } else {
      setError(result.error ?? "The swap could not be completed.");
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

      {/* Error */}
      {phase === "failed" && error && (
        <div className="bg-danger-soft text-danger rounded-xl px-4 py-3 text-sm">
          <p className="font-semibold">Swap failed</p>
          <p className="mt-1 text-xs break-words">{error}</p>
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
