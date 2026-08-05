"use client";

import { cn } from "@/lib/utils";

interface PercentButtonsProps {
  balance?: string;
  onSelect: (percent: number) => void;
  className?: string;
}

const PRESETS = [25, 50, 75, 100] as const;

/**
 * Quick-select percentage buttons for swap amount inputs.
 * When a balance is provided, each button shows the computed amount on hover.
 * 100% = MAX uses the full balance.
 */
export function PercentButtons({ balance, onSelect, className }: PercentButtonsProps) {
  return (
    <div className={cn("flex gap-1.5", className)}>
      {PRESETS.map((pct) => (
        <button
          key={pct}
          type="button"
          onClick={() => onSelect(pct)}
          disabled={!balance || Number(balance) <= 0}
          className={cn(
            "bg-surface border-border text-foreground-muted hover:border-primary/50 hover:text-primary",
            "flex-1 rounded-lg border py-1 text-xs font-semibold transition-all duration-200",
            "disabled:cursor-not-allowed disabled:opacity-40",
            "active:scale-95"
          )}
          title={
            balance && Number(balance) > 0
              ? `${((Number(balance) * pct) / 100).toFixed(7)}`
              : undefined
          }
        >
          {pct === 100 ? "MAX" : `${pct}%`}
        </button>
      ))}
    </div>
  );
}
