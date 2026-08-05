"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  options, value, onChange, label, placeholder, error, disabled, className,
}: SelectProps) {
  const id = useId();

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="text-foreground-muted mb-1.5 block text-xs font-medium tracking-wider uppercase">
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "h-10 w-full rounded-xl border bg-surface px-3 text-sm transition-colors appearance-none",
          "focus:border-primary/60 focus:ring-primary/20 focus:ring-2 focus:outline-none",
          error ? "border-danger/60" : "border-border hover:border-border-strong",
          disabled && "cursor-not-allowed opacity-50"
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%235c6a8f' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: "2.25rem",
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-danger mt-1.5 text-xs">{error}</p>}
    </div>
  );
}
