"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Styled checkbox with label and optional indeterminate state.
 */
export function Checkbox({
  label,
  checked,
  onChange,
  indeterminate = false,
  disabled = false,
  className,
}: CheckboxProps) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 text-sm select-none",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
          ref={(el) => {
            if (el) el.indeterminate = indeterminate;
          }}
        />
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded border transition-all",
            "border-border bg-surface peer-focus-visible:ring-primary/40 peer-focus-visible:ring-2",
            checked || indeterminate ? "border-primary bg-primary" : "hover:border-border-strong"
          )}
        >
          {checked && !indeterminate && (
            <svg
              className="h-3 w-3 text-white"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              aria-hidden="true"
            >
              <path d="M5 10l3.5 3.5L15 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {indeterminate && <span className="h-0.5 w-2 rounded-full bg-white" />}
        </span>
      </span>
      {label && <span className="text-foreground-muted">{label}</span>}
    </label>
  );
}
