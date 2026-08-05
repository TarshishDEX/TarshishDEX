"use client";

import { useEffect, useState } from "react";

interface ShortcutEntry {
  keys: string;
  description: string;
}

const SHORTCUTS: ShortcutEntry[] = [
  { keys: "Cmd/Ctrl + K", description: "Open command palette" },
  { keys: "S", description: "Focus swap amount input" },
  { keys: "Esc", description: "Close modal or dismiss toast" },
  { keys: "?", description: "Show this help dialog" },
  { keys: "Tab", description: "Navigate between form fields" },
  { keys: "Enter", description: "Submit focused form" },
];

/**
 * Keyboard shortcuts help dialog triggered by pressing "?".
 * Shows a modal overlay listing all available shortcuts.
 */
export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (
        e.key === "?" &&
        !(e.target as HTMLElement)?.matches?.("input, textarea, select")
      ) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="glass-card mx-4 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Keyboard Shortcuts</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-foreground-faint hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.keys} className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">{shortcut.description}</span>
              <kbd className="inline-flex h-6 items-center rounded-md border border-border bg-surface-elevated px-2 text-xs font-mono font-medium text-foreground">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-foreground-faint mt-4 text-center text-xs">
          Press <kbd className="rounded bg-surface-elevated px-1 py-0.5 font-mono text-[10px]">?</kbd> to toggle this dialog
        </p>
      </div>
    </div>
  );
}
