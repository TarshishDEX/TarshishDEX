"use client";

import { useMemo } from "react";
import { useOrderbook } from "@/lib/stellar/queries";
import { useLiveOrderbookStream } from "@/components/providers/live-sync-hooks";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatNumber, formatPrice } from "@/lib/utils";
import type { StellarAsset } from "@/lib/stellar/types";

export function OrderbookDepth({
  base,
  counter,
  height = 8,
}: {
  base: StellarAsset;
  counter: StellarAsset;
  height?: number;
}) {
  const { data: orderbook, isLoading, isError } = useOrderbook(base, counter);
  useLiveOrderbookStream(base, counter);

  const { bids, asks, maxValue } = useMemo(() => {
    if (!orderbook) return { bids: [], asks: [], maxValue: 0 };
    const all = [...orderbook.bids, ...orderbook.asks];
    const max = Math.max(...all.map((l) => l.value), 1);
    return {
      bids: orderbook.bids.slice(0, height),
      asks: orderbook.asks.slice(0, height),
      maxValue: max,
    };
  }, [orderbook, height]);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">Orderbook Depth</h3>
        <Badge tone="primary">
          {base.code}/{counter.code}
        </Badge>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : isError || !orderbook || (bids.length === 0 && asks.length === 0) ? (
        <p className="text-foreground-muted mt-4 text-sm">
          No active orderbook for this pair on the current network.
        </p>
      ) : (
        <>
          {orderbook.midPrice !== null && (
            <div className="border-border bg-surface mt-4 flex items-center justify-between rounded-xl border px-4 py-2.5">
              <span className="text-foreground-muted text-xs tracking-wider uppercase">
                Mid price
              </span>
              <span className="font-display text-primary text-lg font-semibold tabular-nums">
                {formatPrice(orderbook.midPrice)}
              </span>
            </div>
          )}

          {/* Asks (sell side) */}
          <div className="mt-4 space-y-1">
            {asks.length === 0 ? (
              <p className="text-foreground-faint py-1 text-center text-xs">No asks</p>
            ) : (
              asks.map((level, i) => (
                <DepthRow key={`ask-${i}`} level={level} maxValue={maxValue} side="ask" />
              ))
            )}
          </div>

          <div className="border-border my-3 flex items-center justify-between border-y py-2 text-xs">
            <span className="text-success">Spread {orderbook.spreadPct?.toFixed(3) ?? "—"}%</span>
            <span className="text-foreground-faint">
              Bids {bids.length} · Asks {asks.length}
            </span>
          </div>

          {/* Bids (buy side) */}
          <div className="space-y-1">
            {bids.length === 0 ? (
              <p className="text-foreground-faint py-1 text-center text-xs">No bids</p>
            ) : (
              bids.map((level, i) => (
                <DepthRow key={`bid-${i}`} level={level} maxValue={maxValue} side="bid" />
              ))
            )}
          </div>
        </>
      )}
    </Card>
  );
}

function DepthRow({
  level,
  maxValue,
  side,
}: {
  level: { price: number; amount: number; value: number };
  maxValue: number;
  side: "bid" | "ask";
}) {
  const pct = Math.min(100, (level.value / maxValue) * 100);
  return (
    <div className="relative flex items-center justify-between rounded px-2 py-1 text-xs tabular-nums">
      <div
        className={cn(
          "absolute inset-y-0 right-0 rounded transition-all duration-500",
          side === "bid" ? "bg-success/10" : "bg-danger/10"
        )}
        style={{ width: `${pct}%` }}
      />
      <span
        className={cn(
          "relative font-mono font-medium",
          side === "bid" ? "text-success" : "text-danger"
        )}
      >
        {formatPrice(level.price)}
      </span>
      <span className="text-foreground-muted relative">{formatNumber(level.amount)}</span>
      <span className="text-foreground-faint relative w-20 text-right">
        {formatNumber(level.value)}
      </span>
    </div>
  );
}
