"use client";

import { useMemo, useState } from "react";
import { usePriceHistory } from "@/lib/stellar/queries";
import { KNOWN_TOKENS } from "@/lib/stellar/tokens";
import { CandlestickChart } from "@/components/charts/candlestick-chart";
import { VolumeChart } from "@/components/charts/volume-chart";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Token } from "@/lib/stellar/types";

const XLM: Token = { code: "XLM", name: "Lumen", decimals: 7, isNative: true };

const TIMEFRAMES = [
  { label: "1D", resolutionMs: 3_600_000, rangeMs: 24 * 3_600_000 },
  { label: "1W", resolutionMs: 3_600_000, rangeMs: 7 * 24 * 3_600_000 },
  { label: "1M", resolutionMs: 86_400_000, rangeMs: 30 * 24 * 3_600_000 },
];

export function PriceChartPanel() {
  const [token, setToken] = useState<Token>(KNOWN_TOKENS[1]!); // USDC
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[2]!); // 1M

  const {
    data: candles,
    isLoading,
    isError,
  } = usePriceHistory(token, XLM, timeframe.resolutionMs, timeframe.rangeMs);

  const stats = useMemo(() => {
    if (!candles || candles.length === 0) return null;
    const first = candles[0]!;
    const last = candles[candles.length - 1]!;
    const change = first.open > 0 ? ((last.close - first.open) / first.open) * 100 : 0;
    const high = Math.max(...candles.map((c) => c.high));
    const low = Math.min(...candles.map((c) => c.low));
    const volume = candles.reduce((sum, c) => sum + c.volumeCounter, 0);
    return { change, high, low, volume };
  }, [candles]);

  return (
    <Card className="p-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold">
            {token.code} <span className="text-foreground-faint">/</span> XLM
          </h2>
          <select
            value={token.code}
            onChange={(e) => {
              const next = KNOWN_TOKENS.find((t) => t.code === e.target.value);
              if (next) setToken(next);
            }}
            aria-label="Select token"
            className="border-border bg-surface text-foreground-muted focus:border-primary/60 h-8 rounded-lg border px-2 text-xs"
          >
            {KNOWN_TOKENS.map((t) => (
              <option key={t.code} value={t.code}>
                {t.code}
              </option>
            ))}
          </select>
        </div>
        <div className="border-border bg-surface flex gap-1 rounded-lg border p-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.label}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                timeframe.label === tf.label
                  ? "bg-primary text-white"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      {stats && !isLoading && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat
            label="Change"
            value={`${stats.change >= 0 ? "+" : ""}${stats.change.toFixed(2)}%`}
            positive={stats.change >= 0}
          />
          <Stat label="Period High" value={stats.high.toFixed(6)} />
          <Stat label="Period Low" value={stats.low.toFixed(6)} />
          <Stat label="Volume" value={`${stats.volume.toFixed(1)} XLM`} />
        </div>
      )}

      {/* Chart */}
      <div className="mt-4">
        {isLoading ? (
          <Skeleton className="h-[420px] w-full rounded-xl" />
        ) : isError || !candles || candles.length === 0 ? (
          <div className="border-border text-foreground-faint flex h-[420px] items-center justify-center rounded-xl border border-dashed text-sm">
            No price history available for this pair on the current network.
          </div>
        ) : (
          <CandlestickChart candles={candles} />
        )}
      </div>

      {/* Volume */}
      <div className="mt-4">
        <h3 className="text-foreground-muted mb-2 text-xs font-medium tracking-wider uppercase">
          Trading Volume (XLM)
        </h3>
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : candles && candles.length > 0 ? (
          <VolumeChart candles={candles} />
        ) : null}
      </div>
    </Card>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <p className="text-foreground-faint text-xs tracking-wider uppercase">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono text-sm font-semibold tabular-nums",
          positive === undefined ? "text-foreground" : positive ? "text-success" : "text-danger"
        )}
      >
        {value}
      </p>
    </div>
  );
}
