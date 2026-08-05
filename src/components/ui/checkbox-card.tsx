"use client";

import { cn } from "@/lib/utils";

interface CheckboxCardProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description?: string;
  className?: string;
}

/**
 * Card-style checkbox — the entire card is clickable.
 * Used for selecting options in settings panels.
 */
export function CheckboxCard({ checked, onChange, title, description, className }: CheckboxCardProps) {
  return (
    <label
      className={cn(
        "block cursor-pointer rounded-xl border p-4 transition-all",
        checked
          ? "border-primary/60 bg-primary-soft"
          : "border-border bg-surface hover:border-border-strong",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 accent-primary"
        />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {description && <p className="text-foreground-muted mt-1 text-xs">{description}</p>}
        </div>
      </div>
    </label>
  );
}
