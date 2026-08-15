"use client";

import { useEffect, useRef, useState } from "react";
import { KNOWN_TOKENS } from "@/lib/stellar/tokens";
import { assetToString, parseAssetString } from "@/lib/stellar/asset";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type { StellarAsset } from "@/lib/stellar/types";

interface TokenSelectorProps {
  value: StellarAsset | null;
  onSelect: (asset: StellarAsset) => void;
  exclude?: StellarAsset | null;
}

export function TokenSelector({ value, onSelect, exclude }: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const excludeKey = exclude ? assetToString(exclude) : null;
  const filtered = KNOWN_TOKENS.filter((t) => {
    const key = assetToString(t);
    if (key === excludeKey) return false;
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      t.code.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      (t.issuer ?? "").toLowerCase().includes(q)
    );
  });

  const customAsset = parseAssetString(debouncedQuery);
  const canAddCustom = debouncedQuery.includes(":") && customAsset !== null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border-border bg-surface-elevated hover:border-border-strong flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{value ? tokenIcon(value) : "⬡"}</span>
        <span>{value ? value.code : "Select"}</span>
        <svg
          className={cn(
            "text-foreground-muted h-3.5 w-3.5 transition-transform",
            open && "rotate-180"
          )}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          className="animate-fade-in border-border bg-surface-overlay absolute top-12 right-0 z-30 w-72 overflow-hidden rounded-2xl border shadow-2xl shadow-black/50 backdrop-blur-xl"
          role="listbox"
        >
          <div className="border-border border-b p-3">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search code, name or issuer…"
              className="border-border bg-surface placeholder:text-foreground-faint focus:border-primary/60 h-9 w-full rounded-lg border px-3 text-sm"
              aria-label="Search tokens"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto p-1.5">
            {filtered.map((token) => (
              <li key={assetToString(token)}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(token);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="hover:bg-primary-soft flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
                  role="option"
                  aria-selected={value?.code === token.code}
                >
                  <span className="bg-surface flex h-8 w-8 items-center justify-center rounded-lg text-sm">
                    {token.icon ?? "◈"}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{token.code}</span>
                    <span className="text-foreground-faint block truncate text-xs">
                      {token.name}
                      {token.domain ? ` · ${token.domain}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && !canAddCustom && (
              <li className="text-foreground-faint px-3 py-6 text-center text-xs">
                No matching assets
              </li>
            )}
          </ul>
          {canAddCustom && (
            <div className="border-border border-t p-2">
              <button
                type="button"
                onClick={() => {
                  onSelect(customAsset!);
                  setOpen(false);
                  setQuery("");
                }}
                className="border-primary/40 bg-primary-soft text-primary hover:bg-primary/20 flex w-full items-center justify-between rounded-lg border border-dashed px-3 py-2 text-sm font-medium transition-colors"
              >
                <span className="truncate font-mono">{query.trim().toUpperCase()}</span>
                <span className="text-xs">Add custom</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function tokenIcon(asset: StellarAsset): string {
  const known = KNOWN_TOKENS.find((t) => t.code === asset.code);
  return known?.icon ?? (asset.isNative ? "⬡" : "◈");
}
