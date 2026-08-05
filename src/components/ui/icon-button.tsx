"use client";

import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

interface IconButtonProps {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * Compact icon button with accessible tooltip label.
 * Used for action icons in table rows, cards, and toolbars.
 */
export function IconButton({ onClick, label, children, disabled, className }: IconButtonProps) {
  return (
    <Tooltip content={label}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors",
          "hover:bg-surface-elevated hover:text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "focus-visible:ring-primary/40 ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-1",
          className
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}
