"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
}

const COMMANDS: Command[] = [
  { id: "swap", label: "Swap", description: "Trade assets on the native DEX", href: "/swap", icon: "⇄" },
  { id: "markets", label: "Markets", description: "View market data and orderbooks", href: "/markets", icon: "◈" },
  { id: "portfolio", label: "Portfolio", description: "Track balances and trade history", href: "/portfolio", icon: "◉" },
  { id: "assets", label: "Assets", description: "Browse Stellar asset catalog", href: "/assets", icon: "▥" },
  { id: "analytics", label: "Analytics", description: "Price charts and volume data", href: "/analytics", icon: "{}" },
];

/**
 * Cmd+K / Ctrl+K command palette for quick navigation.
 * Press Cmd+K to open, type to filter, Enter to navigate, Escape to close.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = COMMANDS.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.description.toLowerCase().includes(query.toLowerCase())
  );

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[20vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="glass-card mx-4 w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="border-border border-b px-4 py-3">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search…"
            className="w-full bg-transparent text-sm placeholder:text-foreground-faint outline-none"
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(i - 1, 0));
              }
              if (e.key === "Enter" && filtered[selectedIndex]) {
                navigate(filtered[selectedIndex].href);
              }
            }}
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-foreground-faint px-2 py-4 text-center text-sm">No results</p>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                type="button"
                onClick={() => navigate(cmd.href)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  i === selectedIndex ? "bg-primary-soft" : "hover:bg-surface-elevated"
                )}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-elevated text-sm">
                  {cmd.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold">{cmd.label}</p>
                  <p className="text-foreground-faint text-xs">{cmd.description}</p>
                </div>
                <span className="text-foreground-faint ml-auto text-xs font-mono">
                  {cmd.href}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
