"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import type { AccountBalance } from "@/lib/stellar/account";

export function BalanceTable({
  balances,
  loading,
}: {
  balances: AccountBalance[];
  loading?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-border border-b px-6 py-4">
        <h2 className="font-display text-base font-semibold">Asset Balances</h2>
      </div>

      {loading ? (
        <div className="space-y-3 p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : balances.length === 0 ? (
        <p className="text-foreground-muted p-6 text-sm">No assets found for this account.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border text-foreground-faint border-b text-left text-xs tracking-wider uppercase">
                <th className="px-6 py-3 font-medium">Asset</th>
                <th className="px-6 py-3 text-right font-medium">Balance</th>
                <th className="px-6 py-3 text-right font-medium">Value (XLM)</th>
                <th className="px-6 py-3 text-right font-medium">Allocation</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((b) => {
                const allocation =
                  b.valueInXlm !== null ? (b.valueInXlm / totalValue(balances)) * 100 : 0;
                return (
                  <tr
                    key={`${b.token.code}:${b.token.issuer ?? "native"}`}
                    className="border-border/50 hover:bg-surface border-b transition-colors last:border-0"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="bg-surface-elevated flex h-8 w-8 items-center justify-center rounded-lg text-sm">
                          {b.token.icon ?? "◈"}
                        </span>
                        <div>
                          <p className="font-semibold">{b.token.code}</p>
                          {b.token.issuer ? (
                            <p className="text-foreground-faint max-w-40 truncate font-mono text-[10px]">
                              {b.token.issuer}
                            </p>
                          ) : (
                            <p className="text-foreground-faint text-xs">Native</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-medium tabular-nums">
                      {formatNumber(b.balance)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono tabular-nums">
                      {b.valueInXlm !== null ? (
                        <span className="text-foreground">{formatNumber(b.valueInXlm)}</span>
                      ) : (
                        <Badge tone="neutral">No market</Badge>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-foreground-muted font-mono text-xs tabular-nums">
                          {allocation.toFixed(1)}%
                        </span>
                        <div className="bg-surface-elevated h-1.5 w-16 overflow-hidden rounded-full">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${Math.min(100, allocation)}%` }}
                          />
                        </div>
                      </div>
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

function totalValue(balances: AccountBalance[]): number {
  return balances.reduce((sum, b) => sum + (b.valueInXlm ?? 0), 0);
}
