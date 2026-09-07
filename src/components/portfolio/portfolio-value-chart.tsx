"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCompact } from "@/lib/utils";
import {
  usePortfolioValueHistory,
  type ValueSnapshot,
} from "@/lib/hooks/use-portfolio-value-history";

type Range = 7 | 30;

/**
 * Portfolio value chart — renders a line chart of the account's daily total
 * value (in XLM) tracked from localStorage snapshots. Supports 7d / 30d
 * toggles and shows an empty state until at least two daily snapshots exist.
 */
export function PortfolioValueChart({
  address,
  currentValueXlm,
  loading,
}: {
  address: string;
  currentValueXlm: number | null | undefined;
  loading?: boolean;
}) {
  const { points } = usePortfolioValueHistory(address, currentValueXlm, Boolean(loading));
  const [range, setRange] = useState<Range>(30);

  // Filter relative to the newest stored snapshot so no wall-clock value is
  // read during render — the chart stays deterministic for the same data.
  const visible = useMemo(() => {
    if (points.length === 0) return [];
    const newest = new Date(`${points[points.length - 1]?.date ?? ""}T00:00:00`).getTime();
    const cutoff = newest - range * 24 * 60 * 60 * 1000;
    return points.filter((p) => {
      const time = new Date(`${p.date}T00:00:00`).getTime();
      return time >= cutoff;
    });
  }, [points, range]);

  const hasTrend = visible.length >= 2;

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-base font-semibold">Portfolio Value</h2>
          <p className="text-foreground-faint mt-0.5 text-xs">Tracked daily · quoted in XLM</p>
        </div>
        <div className="border-border bg-surface-elevated flex rounded-lg border p-0.5">
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                range === r
                  ? "bg-primary-soft text-primary"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Skeleton className="mt-4 h-40 w-full" />
      ) : !hasTrend ? (
        <div className="border-border mt-4 rounded-xl border border-dashed px-6 py-10 text-center">
          <p className="text-foreground-muted text-sm">
            Connect your wallet and check back tomorrow — daily snapshots will build a value chart
            here over time.
          </p>
        </div>
      ) : (
        <ValueLineChart data={visible} />
      )}
    </Card>
  );
}

/** Lightweight SVG line chart without external chart dependencies. */
function ValueLineChart({ data }: { data: ValueSnapshot[] }) {
  const width = 640;
  const height = 160;
  const padX = 8;
  const padY = 12;

  const { min, max } = useMemo(() => {
    const values = data.map((d) => d.value);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [data]);

  const span = max - min || 1;

  const points = useMemo(() => {
    return data.map((d, i) => {
      const x = padX + (i / Math.max(1, data.length - 1)) * (width - padX * 2);
      const y = padY + (1 - (d.value - min) / span) * (height - padY * 2);
      return { x, y, value: d.value, date: d.date };
    });
  }, [data, min, span]);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1]?.x ?? width},${height - padY} L${points[0]?.x ?? 0},${height - padY} Z`;
  const last = points[points.length - 1];

  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-foreground text-2xl font-semibold tabular-nums">
          {last ? `${formatCompact(last.value)} XLM` : "—"}
        </span>
        <span className="text-foreground-faint text-xs">Last snapshot: {last?.date ?? "—"}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-2 h-40 w-full"
        role="img"
        aria-label={`Portfolio value over time: ${data.length} daily snapshots`}
      >
        <defs>
          <linearGradient id="portfolioValueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary, #3e8dfd)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-primary, #3e8dfd)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#portfolioValueFill)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-primary, #3e8dfd)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
