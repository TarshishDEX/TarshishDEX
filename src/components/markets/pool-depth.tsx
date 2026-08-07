"use client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";
import type { PoolSummary } from "@/lib/stellar/pool-types";

export function PoolDepth({ pools, loading }: { pools: PoolSummary[]; loading?: boolean }) {
  return (
    <Card className="p-5">
      <h3 className="font-display text-sm font-semibold">AMM Liquidity Pools</h3>
      {loading ? (
        <Skeleton className="mt-3 h-32 w-full" />
      ) : pools.length === 0 ? (
        <p className="text-foreground-faint mt-3 text-xs">No AMM pools for this pair.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {pools.map((p) => (
            <div key={p.id} className="border-border rounded-lg border p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-foreground-muted">Fee</span>
                <span className="font-mono font-medium">{(p.feeBp / 100).toFixed(2)}%</span>
              </div>
              <div className="mt-1.5 flex justify-between">
                <span className="text-foreground-muted">Mid Price</span>
                <span className="font-mono font-medium">{p.midPrice?.toFixed(6) ?? "—"}</span>
              </div>
              <div className="mt-1.5 flex justify-between">
                <span className="text-foreground-muted">TVL</span>
                <span className="font-mono font-medium">{formatNumber(p.tvl)} XLM</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
