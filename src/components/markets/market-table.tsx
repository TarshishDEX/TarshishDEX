"use client";

import { useMemo, useState } from "react";
import { useMarketStats } from "@/lib/stellar/queries";
import { useLiveMarketStream } from "@/components/providers/live-sync-hooks";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SortIndicator } from "@/components/ui/sort-indicator";
import { Tooltip } from "@/components/ui/tooltip";
import { cn, formatCompact, formatPrice } from "@/lib/utils";
import type { StellarAsset } from "@/lib/stellar/types";

/** A selectable trading pair: the quoted asset against XLM. */
export interface MarketPair {
  base: StellarAsset;
  counter: StellarAsset;
}

type SortKey = "price" | "change" | "volume";

/** 1-2 sentence explanation for each market metric shown in the table. */
const METRIC_DESCRIPTIONS: {
  price: string;
  change: string;
  volume: string;
  bidAsk: string;
} = {
  price:
    "The latest market price of this asset quoted in XLM, derived from the native DEX orderbook.",
  change:
    "Percentage price change over the trailing 24 hours. Positive values mean the asset gained value against XLM.",
  volume:
    "Total trading volume of this asset against XLM over the last 24 hours — a measure of market activity and liquidity.",
  bidAsk:
    "The best bid (highest buy price) and best ask (lowest sell price) currently on the orderbook. The gap between them is the spread.",
};

export function MarketTable({
  onSelectPair,
}: {
  /** Called when the user clicks a market row, e.g. to load its orderbook. */
  onSelectPair?: (pair: MarketPair) => void;
}) {
  const { data: stats, isLoading, isError } = useMarketStats();
  useLiveMarketStream();
  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    if (!stats) return [];
    const rows = [...stats].filter((s) => s.priceInXlm !== null);
    rows.sort((a, b) => {
      let diff = 0;
      if (sortKey === "price") diff = (a.priceInXlm ?? 0) - (b.priceInXlm ?? 0);
      if (sortKey === "change") diff = (a.change24hPct ?? 0) - (b.change24hPct ?? 0);
      if (sortKey === "volume") diff = a.volume24hXlm - b.volume24hXlm;
      return asc ? diff : -diff;
    });
    return rows;
  }, [stats, sortKey, asc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-border flex items-center justify-between border-b px-6 py-4">
        <h2 className="font-display text-base font-semibold">Top Markets</h2>
        <span className="text-foreground-faint text-xs">Auto-refreshing · quoted in XLM</span>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-foreground-muted p-6 text-sm">
          Market data is temporarily unavailable. Please try again shortly.
        </p>
      ) : sorted.length === 0 ? (
        <div className="p-10 text-center">
          <p className="font-display text-base font-semibold">No active XLM markets</p>
          <p className="text-foreground-muted mx-auto mt-2 max-w-md text-sm">
            The top assets on this network don&apos;t currently have a live orderbook against XLM.
            This is common on testnet where markets are sparse.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border text-foreground-faint border-b text-left text-xs tracking-wider uppercase">
                <th className="px-6 py-3 font-medium">Asset</th>
                <SortableHeader
                  label="Price (XLM)"
                  hint={METRIC_DESCRIPTIONS.price}
                  active={sortKey === "price"}
                  direction={asc ? "asc" : "desc"}
                  onClick={() => toggleSort("price")}
                />
                <SortableHeader
                  label="24h Change"
                  hint={METRIC_DESCRIPTIONS.change}
                  active={sortKey === "change"}
                  direction={asc ? "asc" : "desc"}
                  onClick={() => toggleSort("change")}
                />
                <SortableHeader
                  label="24h Volume (XLM)"
                  hint={METRIC_DESCRIPTIONS.volume}
                  active={sortKey === "volume"}
                  direction={asc ? "asc" : "desc"}
                  onClick={() => toggleSort("volume")}
                />
                <th className="px-6 py-3 text-right font-medium">
                  <span className="inline-flex items-center justify-end gap-1">
                    Best Bid / Ask
                    <MetricInfo label={METRIC_DESCRIPTIONS.bidAsk} />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const change = row.change24hPct;
                return (
                  <tr
                    key={row.token.code}
                    tabIndex={onSelectPair ? 0 : undefined}
                    role={onSelectPair ? "button" : undefined}
                    aria-label={onSelectPair ? `Show depth for ${row.token.code}/XLM` : undefined}
                    onClick={() =>
                      onSelectPair?.({
                        base: { code: "XLM", isNative: true },
                        counter: {
                          code: row.token.code,
                          issuer: row.token.issuer,
                        },
                      })
                    }
                    onKeyDown={(e) => {
                      if (!onSelectPair) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectPair({
                          base: { code: "XLM", isNative: true },
                          counter: { code: row.token.code, issuer: row.token.issuer },
                        });
                      }
                    }}
                    className={cn(
                      "border-border/50 border-b transition-colors last:border-0",
                      onSelectPair &&
                        "hover:bg-surface focus-visible:bg-surface cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    )}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="bg-surface-elevated flex h-9 w-9 items-center justify-center rounded-lg text-sm">
                          {row.token.icon ?? "◈"}
                        </span>
                        <div>
                          <p className="font-semibold">{row.token.code}</p>
                          <p className="text-foreground-faint text-xs">{row.token.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-mono font-medium tabular-nums">
                      {formatPrice(row.priceInXlm ?? 0)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={cn(
                          "font-semibold tabular-nums",
                          change === null
                            ? "text-foreground-faint"
                            : change >= 0
                              ? "text-success"
                              : "text-danger"
                        )}
                      >
                        {change === null ? "—" : `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`}
                      </span>
                    </td>
                    <td className="text-foreground-muted px-6 py-3.5 font-mono tabular-nums">
                      {formatCompact(row.volume24hXlm)}
                    </td>
                    <td className="text-foreground-faint px-6 py-3.5 text-right font-mono text-xs tabular-nums">
                      {row.bestBid !== null ? formatPrice(row.bestBid) : "—"} /{" "}
                      {row.bestAsk !== null ? formatPrice(row.bestAsk) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function SortableHeader({
  label,
  hint,
  active,
  direction,
  onClick,
}: {
  label: string;
  hint?: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th className="px-6 py-3 font-medium">
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "hover:text-foreground inline-flex items-center gap-1 tracking-wider uppercase transition-colors",
            active && "text-primary"
          )}
        >
          {label}
          <SortIndicator active={active} direction={direction} />
        </button>
        {hint && <MetricInfo label={hint} />}
      </span>
    </th>
  );
}

/** Info icon that reveals a metric explanation in a tooltip on hover/focus. */
function MetricInfo({ label }: { label: string }) {
  return (
    <Tooltip content={label} side="bottom">
      <span
        role="img"
        aria-label={label}
        tabIndex={0}
        className="text-foreground-faint hover:text-foreground cursor-help rounded-full transition-colors focus:outline-none"
      >
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="8" />
          <path d="M10 9v5M10 6.2v.1" strokeLinecap="round" />
        </svg>
      </span>
    </Tooltip>
  );
}
