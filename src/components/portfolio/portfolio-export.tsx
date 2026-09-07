"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { objectsToCsv, downloadFile } from "@/lib/utils/export-csv";
import type { AccountBalance } from "@/lib/stellar/account";
import type { TradeHistoryEntry } from "@/lib/stellar/history";

export interface PortfolioExportScope {
  id: "balances" | "trades" | "both";
  label: string;
  description: string;
}

export const EXPORT_OPTIONS: PortfolioExportScope[] = [
  { id: "balances", label: "Balances only", description: "Current asset balances" },
  { id: "trades", label: "Trade history only", description: "Recent trading activity" },
  { id: "both", label: "Both", description: "Balances and trade history" },
];

/** CSV row shape for portfolio balances. */
export interface BalanceCsvRow {
  asset: string;
  issuer: string;
  balance: string;
  value_xlm: string;
}

/** CSV row shape for trade history entries. */
export interface TradeCsvRow {
  date: string;
  type: string;
  summary: string;
  ledger: string;
  status: string;
  hash: string;
}

/** Map portfolio balances to flat CSV rows (drops balances without a market value label). */
export function balancesToCsvRows(balances: AccountBalance[]): BalanceCsvRow[] {
  return balances.map((b) => ({
    asset: b.token.issuer ? `${b.token.code}:${b.token.issuer}` : b.token.code,
    issuer: b.token.issuer ?? "native",
    balance: String(b.balance),
    value_xlm: b.valueInXlm !== null ? String(b.valueInXlm) : "",
  }));
}

/** Map trade history entries to flat CSV rows with human-readable dates. */
export function tradesToCsvRows(entries: TradeHistoryEntry[]): TradeCsvRow[] {
  return entries.map((entry) => ({
    date: new Date(entry.createdAt).toISOString(),
    type: entry.type,
    summary: entry.summary,
    ledger: String(entry.ledger),
    status: entry.status,
    hash: entry.hash ?? "",
  }));
}

function buildCsv(rows: object[], columns: string[], filename: string) {
  if (rows.length === 0) return;
  downloadFile(objectsToCsv(rows, columns), filename);
}

/**
 * CSV export control for the portfolio page. Offers three export options —
 * balances only, trade history only, or both — and downloads the CSV via a
 * blob URL entirely client-side.
 */
export function PortfolioExport({
  balances,
  entries,
}: {
  balances: AccountBalance[];
  entries: TradeHistoryEntry[];
}) {
  const [open, setOpen] = useState(false);

  const hasBalances = balances.length > 0;
  const hasTrades = entries.length > 0;

  function handleExport(scope: PortfolioExportScope["id"]) {
    setOpen(false);
    const date = new Date().toISOString().slice(0, 10);

    if ((scope === "balances" || scope === "both") && hasBalances) {
      const rows = balancesToCsvRows(balances);
      buildCsv(rows, ["asset", "issuer", "balance", "value_xlm"], `balances-${date}.csv`);
    }
    if ((scope === "trades" || scope === "both") && hasTrades) {
      const rows = tradesToCsvRows(entries);
      buildCsv(
        rows,
        ["date", "type", "summary", "ledger", "status", "hash"],
        `trade-history-${date}.csv`
      );
    }
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={!hasBalances && !hasTrades}
        aria-label="Export CSV"
      >
        Export CSV
      </Button>
      {open && (
        <div
          role="menu"
          aria-label="Export options"
          className="border-border bg-surface-overlay animate-fade-in absolute right-0 z-30 mt-1 w-56 rounded-xl border p-1 shadow-xl"
        >
          {EXPORT_OPTIONS.map((option) => {
            const enabled =
              option.id === "balances"
                ? hasBalances
                : option.id === "trades"
                  ? hasTrades
                  : hasBalances || hasTrades;
            return (
              <button
                key={option.id}
                type="button"
                role="menuitem"
                onClick={() => handleExport(option.id)}
                disabled={!enabled}
                className="text-foreground hover:bg-surface-elevated flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="min-w-0">
                  <span className="block font-medium">{option.label}</span>
                  <span className="text-foreground-faint block text-xs">{option.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
