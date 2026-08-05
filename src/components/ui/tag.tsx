"use client";

import { cn } from "@/lib/utils";

interface TagProps {
  label: string;
  onRemove?: () => void;
  className?: string;
}

/**
 * Removable chip/tag used for filters, search terms, and selected items.
 */
export function Tag({ label, onRemove, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-xs font-medium text-foreground-muted",
        className
      )}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="hover:text-danger ml-0.5 transition-colors"
        >
          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l8 8M14 6L6 14" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </span>
  );
}
