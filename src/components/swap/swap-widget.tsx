"use client";

import { useMemo, useState } from "react";
import { useSwapQuote } from "@/lib/stellar/queries";
import { TokenSelector } from "@/components/swap/token-selector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";
import { isSameAsset } from "@/lib/stellar/asset";
import type { StellarAsset } from "@/lib/stellar/types";

const SLIPPAGE_OPTIONS = [0.1, 0.5, 1, 3];

export function SwapWidget() {
  const [inputAsset, setInputAsset] = useState<StellarAsset | null>({
    code: "XLM",
    isNative: true,
  });
  const [outputAsset, setOutputAsset] = useState<StellarAsset | null>({
    code: "USDC",
    issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  });
  const [amountIn, setAmountIn] = useState("");
  const [slippagePct, setSlippagePct] = useState(1);
  const [customSlippage, setCustomSlippage] = useState(false);

  const {
    data: quote,
    isLoading,
    isError,
  } = useSwapQuote(inputAsset, outputAsset, amountIn, slippagePct);

  const sameAsset = inputAsset && outputAsset && isSameAsset(inputAsset, outputAsset);
  const disabled = !amountIn || Number(amountIn) <= 0 || !inputAsset || !outputAsset || !!sameAsset;

  const impactLevel = useMemo(() => {
    if (!quote) return "none";
    if (quote.priceImpactPct > 5) return "critical";
    if (quote.priceImpactPct > 1) return "high";
    if (quote.priceImpactPct > 0.5) return "medium";
    return "low";
  }, [quote]);

  function handleSwapDirection() {
    setInputAsset(outputAsset);
    setOutputAsset(inputAsset);
    setAmountIn("");
  }

  return (
    <Card className="w-full max-w-md p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Swap</h2>
        <Badge tone="accent">Native DEX</Badge>
      </div>

      {/* Input */}
      <div className="border-border bg-surface focus-within:border-primary/60 mt-5 rounded-2xl border p-4 transition-colors">
        <div className="flex items-center justify-between">
          <label className="text-foreground-muted text-xs font-medium tracking-wider uppercase">
            You pay
          </label>
          <button
            type="button"
            className="text-primary hover:text-primary-hover text-xs font-medium transition-colors"
            onClick={() => setAmountIn("")}
          >
            Clear
          </button>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <input
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0.0"
            inputMode="decimal"
            aria-label="Amount to pay"
            className="font-display placeholder:text-foreground-faint h-12 w-full bg-transparent text-2xl font-semibold tabular-nums"
          />
          <TokenSelector value={inputAsset} onSelect={setInputAsset} exclude={outputAsset} />
        </div>
      </div>

      {/* Reverse */}
      <div className="relative flex justify-center py-1">
        <button
          type="button"
          onClick={handleSwapDirection}
          aria-label="Reverse swap direction"
          className="border-border bg-surface-elevated text-foreground-muted hover:border-primary/50 hover:text-primary absolute -top-3.5 flex h-9 w-9 items-center justify-center rounded-xl border shadow-lg transition-all duration-200 hover:rotate-180 active:scale-90"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path
              d="M4 7h12m0 0l-3-3m3 3l-3 3M16 13H4m0 0l3 3m-3-3l3-3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Output */}
      <div className="border-border bg-surface rounded-2xl border p-4">
        <div className="flex items-center justify-between">
          <label className="text-foreground-muted text-xs font-medium tracking-wider uppercase">
            You receive
          </label>
          {isLoading && amountIn ? (
            <span className="text-foreground-faint animate-pulse text-xs">Calculating…</span>
          ) : null}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <input
            readOnly
            value={quote?.outputAmount ?? ""}
            placeholder="0.0"
            aria-label="Amount to receive"
            className="font-display placeholder:text-foreground-faint h-12 w-full bg-transparent text-2xl font-semibold tabular-nums"
          />
          <TokenSelector value={outputAsset} onSelect={setOutputAsset} exclude={inputAsset} />
        </div>
      </div>

      {/* Slippage */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span className="text-foreground-muted text-xs font-medium tracking-wider uppercase">
            Max slippage
          </span>
          <button
            type="button"
            onClick={() => setCustomSlippage((v) => !v)}
            className="text-primary hover:text-primary-hover text-xs font-medium transition-colors"
          >
            {customSlippage ? "Use presets" : "Custom"}
          </button>
        </div>
        {customSlippage ? (
          <div className="mt-2 flex items-center gap-2">
            <input
              value={slippagePct}
              onChange={(e) => setSlippagePct(Number(e.target.value))}
              type="number"
              min={0}
              max={50}
              step={0.1}
              aria-label="Custom slippage percentage"
              className="border-border bg-surface focus:border-primary/60 h-9 w-24 rounded-lg border px-3 text-sm font-semibold tabular-nums"
            />
            <span className="text-foreground-muted text-sm">%</span>
          </div>
        ) : (
          <div className="mt-2 flex gap-2">
            {SLIPPAGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSlippagePct(option)}
                className={cn(
                  "h-9 flex-1 rounded-lg border text-sm font-semibold transition-all duration-200",
                  slippagePct === option
                    ? "border-primary/60 bg-primary-soft text-primary"
                    : "border-border bg-surface text-foreground-muted hover:border-border-strong"
                )}
              >
                {option}%
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quote details */}
      {(quote || isLoading) && amountIn && Number(amountIn) > 0 && (
        <div className="border-border bg-surface animate-fade-in mt-4 space-y-2.5 rounded-2xl border p-4 text-sm">
          <QuoteRow label="Route" loading={isLoading}>
            {quote ? (
              <span className="font-mono text-xs">
                {quote.path.map((p, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-foreground-faint"> → </span>}
                    {p.code}
                  </span>
                ))}
              </span>
            ) : null}
          </QuoteRow>
          <QuoteRow label="Exchange rate" loading={isLoading}>
            {quote
              ? `1 ${inputAsset?.code} ≈ ${formatNumber(quote.executionPrice)} ${outputAsset?.code}`
              : null}
          </QuoteRow>
          <QuoteRow label="Minimum received" loading={isLoading}>
            {quote ? `${formatNumber(Number(quote.minReceived))} ${outputAsset?.code}` : null}
          </QuoteRow>
          <QuoteRow label="Estimated fee" loading={isLoading}>
            {quote ? `≈ ${formatNumber(Number(quote.feeEstimateXlm))} XLM` : null}
          </QuoteRow>

          {/* Price impact */}
          {quote && (
            <div className="pt-1">
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Price impact</span>
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    impactLevel === "critical" && "text-danger",
                    impactLevel === "high" && "text-warning",
                    (impactLevel === "medium" || impactLevel === "low") && "text-success"
                  )}
                >
                  {quote.priceImpactPct.toFixed(2)}%
                </span>
              </div>
              <div className="bg-surface-elevated mt-1.5 h-1.5 overflow-hidden rounded-full">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    impactLevel === "critical" && "bg-danger",
                    impactLevel === "high" && "bg-warning",
                    (impactLevel === "medium" || impactLevel === "low") && "bg-success"
                  )}
                  style={{
                    width: `${Math.min(100, Math.max(4, quote.priceImpactPct * 20))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warnings */}
      {quote && quote.warnings.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {quote.warnings.map((warning, i) => (
            <p key={i} className="bg-warning-soft text-warning rounded-lg px-3 py-2 text-xs">
              ⚠ {warning}
            </p>
          ))}
        </div>
      )}

      {isError && (
        <p className="bg-danger-soft text-danger mt-3 rounded-lg px-3 py-2 text-xs">
          Could not fetch a quote. The market may be unavailable.
        </p>
      )}

      {/* Action */}
      <Button
        size="lg"
        fullWidth
        className="mt-4"
        disabled={disabled}
        isLoading={isLoading && !!amountIn}
      >
        {sameAsset ? "Select different assets" : "Review Swap"}
      </Button>
      <p className="text-foreground-faint mt-3 text-center text-xs">
        Wallet integration arrives in Phase 4 — quotes are simulated against live orderbook depth.
      </p>
    </Card>
  );
}

function QuoteRow({
  label,
  children,
  loading,
}: {
  label: string;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-foreground-muted">{label}</span>
      <span className="text-right font-medium tabular-nums">
        {loading ? (
          <span className="bg-surface-elevated inline-block h-3.5 w-16 animate-pulse rounded" />
        ) : (
          children
        )}
      </span>
    </div>
  );
}
