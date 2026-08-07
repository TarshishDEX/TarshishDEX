"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function NumberInput({
  value,
  onChange,
  label,
  min,
  max,
  step = "any",
  placeholder,
  error,
  disabled,
  className,
}: NumberInputProps) {
  const id = useId();

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="text-foreground-muted mb-1.5 block text-xs font-medium tracking-wider uppercase"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        inputMode="decimal"
        className={cn(
          "bg-surface h-10 w-full rounded-xl border px-3 text-sm transition-colors",
          "focus:border-primary/60 focus:ring-primary/20 focus:ring-2 focus:outline-none",
          "placeholder:text-foreground-faint tabular-nums",
          error ? "border-danger/60" : "border-border hover:border-border-strong",
          disabled && "cursor-not-allowed opacity-50"
        )}
      />
      {error && <p className="text-danger mt-1.5 text-xs">{error}</p>}
    </div>
  );
}
