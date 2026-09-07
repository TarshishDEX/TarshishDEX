"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransactionStatusIcon } from "@/components/ui/transaction-status-icon";
import { useSwapHistory } from "@/lib/hooks/use-swap-history";
import { explorerTxUrl } from "@/lib/stellar/config";
import { formatNumber } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  success: "Success",
  failed: "Failed",
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Swap history panel — shows the last 10 swaps executed in this browser
 * (persisted in localStorage), including amounts, timestamp, and a status
 * icon with an explorer link for confirmed transactions.
 */
export function SwapHistoryPanel() {
  const { entries, clearHistory } = useSwapHistory();
  const recent = entries.slice(0, 10);

  return (
    <Card className="w-full p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-semibold">Swap History</h2>
          <p className="text-foreground-faint mt-0.5 text-xs">
            Recent transactions from this browser
          </p>
        </div>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="text-foreground-muted hover:text-danger text-xs font-medium transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {recent.length === 0 ? (
        <div className="border-border text-foreground-muted mt-4 rounded-xl border border-dashed px-6 py-8 text-center text-sm">
          No swaps yet — your executed swaps will appear here.
        </div>
      ) : (
        <ul className="mt-4 divide-y">
          {recent.map((entry) => {
            const status = entry.status ?? "success";
            return (
              <li key={entry.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <TransactionStatusIcon status={status} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium tabular-nums">
                    {formatNumber(Number(entry.inputAmount))} {entry.inputAsset} →{" "}
                    {formatNumber(Number(entry.outputAmount))} {entry.outputAsset}
                  </p>
                  <p className="text-foreground-faint text-xs">
                    {formatTime(entry.timestamp)}
                    {entry.txHash && (
                      <>
                        {" · "}
                        <a
                          href={entry.explorerUrl ?? explorerTxUrl(entry.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-hover transition-colors"
                        >
                          tx {entry.txHash.slice(0, 8)}…
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <Badge
                  tone={
                    status === "failed" ? "danger" : status === "pending" ? "warning" : "success"
                  }
                >
                  {STATUS_LABEL[status] ?? "Success"}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
