"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { explorerTxUrl } from "@/lib/stellar/config";
import type { TradeHistoryEntry, TradeType } from "@/lib/stellar/history";

const TYPE_LABEL: Record<TradeType, { label: string; tone: "primary" | "accent" | "neutral" }> = {
  swap: { label: "Swap", tone: "primary" },
  offer: { label: "Offer", tone: "accent" },
  trustline: { label: "Account", tone: "neutral" },
};

export function TradeHistory({
  entries,
  loading,
  showExplorer = false,
}: {
  entries: TradeHistoryEntry[];
  loading?: boolean;
  showExplorer?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TradeType>("all");

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        e.summary.toLowerCase().includes(q) ||
        e.source.toLowerCase().includes(q) ||
        (e.hash ?? "").toLowerCase().includes(q);
      const matchesType = typeFilter === "all" || e.type === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [entries, query, typeFilter]);

  return (
    <Card className="overflow-hidden">
      <div className="border-border flex flex-col gap-3 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-base font-semibold">Trade History</h2>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pairs, hashes…"
            aria-label="Search trade history"
            className="border-border bg-surface placeholder:text-foreground-faint focus:border-primary/60 h-8 w-44 rounded-lg border px-3 text-xs"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | TradeType)}
            aria-label="Filter by type"
            className="border-border bg-surface text-foreground-muted focus:border-primary/60 h-8 rounded-lg border px-2 text-xs"
          >
            <option value="all">All types</option>
            <option value="swap">Swaps</option>
            <option value="offer">Offers</option>
            <option value="trustline">Accounts</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-foreground-muted p-6 text-sm">
          {entries.length === 0
            ? "No trading activity found for this account."
            : "No entries match your filters."}
        </p>
      ) : (
        <div className="divide-border/50 divide-y">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="hover:bg-surface flex items-center gap-4 px-6 py-3.5 transition-colors"
            >
              <Badge tone={TYPE_LABEL[entry.type].tone}>{TYPE_LABEL[entry.type].label}</Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm font-medium">{entry.summary}</p>
                <p className="text-foreground-faint mt-0.5 flex items-center gap-2 text-xs">
                  <span>{formatDate(entry.createdAt)}</span>
                  <span aria-hidden="true">·</span>
                  <span>ledger {entry.ledger}</span>
                  {showExplorer && entry.hash && (
                    <>
                      <span aria-hidden="true">·</span>
                      <a
                        href={explorerTxUrl(entry.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-hover transition-colors"
                      >
                        View on explorer ↗
                      </a>
                    </>
                  )}
                </p>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <Badge tone="success" dot>
                  {entry.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
