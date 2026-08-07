"use client";

import { cn } from "@/lib/utils";

interface InputSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

/**
 * Search input with magnifying glass icon.
 */
export function InputSearch({
  value,
  onChange,
  placeholder = "Search…",
  className,
  "aria-label": ariaLabel = "Search",
}: InputSearchProps) {
  return (
    <div className={cn("relative", className)}>
      <svg
        className="text-foreground-faint pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="9" cy="9" r="6" />
        <path d="M13.5 13.5L17 17" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="border-border bg-surface placeholder:text-foreground-faint focus:border-primary/60 h-9 w-full rounded-lg border py-2 pr-3 pl-9 text-sm transition-colors"
      />
    </div>
  );
}
