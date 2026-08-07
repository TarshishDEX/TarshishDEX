"use client";

import { cn } from "@/lib/utils";

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  className?: string;
}

export function RadioGroup({ options, value, onChange, name, className }: RadioGroupProps) {
  return (
    <div className={cn("space-y-2", className)} role="radiogroup">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all",
            value === opt.value
              ? "border-primary/60 bg-primary-soft"
              : "border-border bg-surface hover:border-border-strong"
          )}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="accent-primary mt-0.5"
          />
          <div>
            <span className="text-sm font-medium">{opt.label}</span>
            {opt.description && (
              <p className="text-foreground-muted mt-0.5 text-xs">{opt.description}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}
