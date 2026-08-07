"use client";

import { useMemo, useState } from "react";
import { useUserLimitOrders } from "@/lib/stellar/limit-order-queries";
import { useOraclePrice } from "@/lib/stellar/queries";
import { useWallet } from "@/lib/stellar/wallet-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";const SIDE_LABELS: Record<string, { label: string; tone: "primary" | "accent" }> = {
  buy: { label: "Buy", tone: "accent" },
  sell: { label: "Sell", tone: "primary" },
};

/** Inline cell that fetches the oracle price for a pair and compares it to the order target. */
function OraclePriceCell({
  base,
  counter,
  targetPrice,
  side,
}: {
  base: string;
  counter: string;
  targetPrice: number;
  side: "buy" | "sell";
}) {
  const { data: obs, isLoading } = useOraclePrice(base, counter);

  if (isLoading) {
    return <span className="text-foreground-faint animate-pulse text-xs">…</span>;
  }

  if (!obs || obs.price <= 0) {
    return (
      <span className="text-foreground-faint text-xs" title="Oracle price unavailable">
        —
      </span>
    );
  }

  const oraclePrice = obs.price / 1e7;
  const distancePct = ((oraclePrice - targetPrice) / targetPrice) * 100;
  const fillable =
    side === "buy" ? oraclePrice <= targetPrice : oraclePrice >= targetPrice;

  return (
    <div className="flex flex-col text-right">
      <span className="font-mono text-xs tabular-nums">{formatNumber(oraclePrice)}</span>
      <span
        className={cn(
          "text-[11px] tabular-nums",
          fillable ? "text-success" : "text-foreground-faint"
        )}
      >
        {fillable ? "✓ fillable" : `${distancePct >= 0 ? "+" : ""}${distancePct.toFixed(1)}%`}
      </span>
    </div>
  );
}

export function LimitOrderTable() {
  const { address } = useWallet();
  const { data: orders, isLoading, isError } = useUserLimitOrders(address);
  const [cancelling, setCancelling] = useState<Set<number>>(new Set());

  const sorted = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => b.placedAt - a.placedAt);
  }, [orders]);

  async function handleCancel(id: number) {
    setCancelling((prev) => new Set(prev).add(id));
    try {
      // In production, this calls the Soroban contract cancel_order()
      await fetch(`/api/orders`, { method: "DELETE", body: JSON.stringify({ id }) });
    } catch {
      // Silently fail — user can retry
    } finally {
      setCancelling((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-border flex items-center justify-between border-b px-6 py-4">
        <h2 className="font-display text-base font-semibold">Limit Orders</h2>
        {address && (
          <span className="text-foreground-faint text-xs">
            {sorted.length} open {sorted.length === 1 ? "order" : "orders"}
          </span>
        )}
      </div>

      {!address ? (
        <div className="p-10 text-center">
          <p className="font-display text-base font-semibold">Connect your wallet</p>
          <p className="text-foreground-muted mt-2 text-sm">
            View and manage your limit orders after connecting.
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3 p-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-foreground-muted p-6 text-sm">
          Could not load limit orders. The contract may not be deployed on this network.
        </p>
      ) : sorted.length === 0 ? (
        <div className="p-10 text-center">
          <p className="font-display text-base font-semibold">No open orders</p>
          <p className="text-foreground-muted mt-2 text-sm">
            Place a limit order to buy or sell at your target price.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border text-foreground-faint border-b text-left text-xs tracking-wider uppercase">
                <th className="px-6 py-3 font-medium">Side</th>
                <th className="px-6 py-3 font-medium">Pair</th>
                <th className="px-6 py-3 text-right font-medium">Target</th>
                <th className="px-6 py-3 text-right font-medium">Amount</th>
                <th className="px-6 py-3 text-right font-medium">Total</th>
                <th className="px-6 py-3 text-right font-medium">Oracle</th>
                <th className="px-6 py-3 font-medium">Placed</th>
                <th className="px-6 py-3 text-right font-medium" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((order) => {
                const total = order.price * order.amount;
                const side = SIDE_LABELS[order.side] ?? { label: order.side, tone: "neutral" as const };
                return (
                  <tr
                    key={order.id}
                    className="border-border/50 hover:bg-surface border-b transition-colors last:border-0"
                  >
                    <td className="px-6 py-3.5">
                      <Badge tone={side.tone}>{side.label}</Badge>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-semibold">{order.base}</span>
                      <span className="text-foreground-faint"> / {order.counter}</span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono tabular-nums">
                      {formatNumber(order.price)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono tabular-nums">
                      {formatNumber(order.amount)}
                    </td>
                    <td className="text-foreground-muted px-6 py-3.5 text-right font-mono tabular-nums">
                      {formatNumber(total)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <OraclePriceCell
                        base={order.base}
                        counter={order.counter}
                        targetPrice={order.price}
                        side={order.side}
                      />
                    </td>
                    <td className="text-foreground-faint px-6 py-3.5 text-xs">
                      {new Date(order.placedAt * 1000).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCancel(order.id)}
                        disabled={cancelling.has(order.id)}
                        isLoading={cancelling.has(order.id)}
                      >
                        Cancel
                      </Button>
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
