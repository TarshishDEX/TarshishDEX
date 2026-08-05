"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAssetCatalog, type AssetCatalogEntry } from "@/lib/stellar/catalog";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SortIndicator } from "@/components/ui/sort-indicator";
import { cn, formatCompact } from "@/lib/utils";

type SortKey = "trustlines" | "supply" | "accounts";

export function AssetBrowser() {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("trustlines");
  const [asc, setAsc] = useState(false);
  const [showAuthRequired, setShowAuthRequired] = useState(false);

  const {
    data: assets,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["asset-catalog"],
    queryFn: () => fetchAssetCatalog(24),
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    if (!assets) return [];
    const q = query.trim().toLowerCase();
    const rows = assets.filter((a) => {
      const matchesQuery =
        !q ||
        a.token.code.toLowerCase().includes(q) ||
        (a.token.issuer ?? "").toLowerCase().includes(q);
      const matchesFlags = !showAuthRequired || a.flags.authRequired;
      return matchesQuery && matchesFlags;
    });
    rows.sort((a, b) => {
      let diff = 0;
      if (sortKey === "trustlines") diff = a.trustlines - b.trustlines;
      if (sortKey === "supply") diff = a.supply - b.supply;
      if (sortKey === "accounts") diff = a.accounts - b.accounts;
      return asc ? diff : -diff;
    });
    return rows;
  }, [assets, query, sortKey, asc, showAuthRequired]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-border flex flex-col gap-3 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-base font-semibold">Asset Catalog</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code or issuer…"
            aria-label="Search assets"
            className="border-border bg-surface placeholder:text-foreground-faint focus:border-primary/60 h-8 w-48 rounded-lg border px-3 text-xs"
          />
          <label className="text-foreground-muted flex cursor-pointer items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={showAuthRequired}
              onChange={(e) => setShowAuthRequired(e.target.checked)}
              className="accent-primary h-3.5 w-3.5"
            />
            Auth required
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-foreground-muted p-6 text-sm">
          Asset catalog is temporarily unavailable.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border text-foreground-faint border-b text-left text-xs tracking-wider uppercase">
                <th className="px-6 py-3 font-medium">Asset</th>
                <th className="px-6 py-3 font-medium">Issuer</th>
                <SortableHeader
                  label="Trustlines"
                  active={sortKey === "trustlines"}
                  direction={asc ? "asc" : "desc"}
                  onClick={() => toggleSort("trustlines")}
                />
                <SortableHeader
                  label="Supply"
                  active={sortKey === "supply"}
                  direction={asc ? "asc" : "desc"}
                  onClick={() => toggleSort("supply")}
                />
                <SortableHeader
                  label="Accounts"
                  active={sortKey === "accounts"}
                  direction={asc ? "asc" : "desc"}
                  onClick={() => toggleSort("accounts")}
                />
                <th className="px-6 py-3 text-right font-medium">Flags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <AssetRow key={`${entry.token.code}:${entry.token.issuer}`} entry={entry} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-foreground-faint px-6 py-8 text-center text-sm">
                    No assets match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function AssetRow({ entry }: { entry: AssetCatalogEntry }) {
  return (
    <tr className="border-border/50 hover:bg-surface border-b transition-colors last:border-0">
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-3">
          <span className="bg-surface-elevated flex h-9 w-9 items-center justify-center rounded-lg text-sm">
            {entry.token.icon ?? "◈"}
          </span>
          <div>
            <p className="font-semibold">{entry.token.code}</p>
            <p className="text-foreground-faint text-xs">{entry.token.name}</p>
          </div>
        </div>
      </td>
      <td className="max-w-44 px-6 py-3.5">
        <p className="text-foreground-muted truncate font-mono text-xs">{entry.token.issuer}</p>
      </td>
      <td className="text-foreground-muted px-6 py-3.5 font-mono tabular-nums">
        {formatCompact(entry.trustlines)}
      </td>
      <td className="text-foreground-muted px-6 py-3.5 font-mono tabular-nums">
        {formatCompact(entry.supply)}
      </td>
      <td className="text-foreground-muted px-6 py-3.5 font-mono tabular-nums">
        {formatCompact(entry.accounts)}
      </td>
      <td className="px-6 py-3.5">
        <div className="flex justify-end gap-1">
          {entry.flags.authRequired && (
            <Badge tone="warning" dot>
              Auth
            </Badge>
          )}
          {entry.flags.authImmutable && (
            <Badge tone="neutral" dot>
              Immutable
            </Badge>
          )}
          {!entry.flags.authRequired && !entry.flags.authImmutable && (
            <span className="text-foreground-faint text-xs">—</span>
          )}
        </div>
      </td>
    </tr>
  );
}

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th className="px-6 py-3 font-medium">
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
    </th>
  );
}
