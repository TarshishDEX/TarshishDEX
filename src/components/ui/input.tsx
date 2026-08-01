"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, leftAdornment, rightAdornment, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-foreground-muted mb-1.5 block text-xs font-medium tracking-wider uppercase"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "bg-surface flex items-center gap-2 rounded-xl border px-3 transition-colors duration-200",
            "focus-within:border-primary/60 focus-within:ring-primary/20 focus-within:ring-2",
            error ? "border-danger/60" : "border-border hover:border-border-strong"
          )}
        >
          {leftAdornment}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "text-foreground placeholder:text-foreground-faint h-10 w-full bg-transparent text-sm",
              className
            )}
            {...props}
          />
          {rightAdornment}
        </div>
        {error ? (
          <p className="text-danger mt-1.5 text-xs">{error}</p>
        ) : hint ? (
          <p className="text-foreground-faint mt-1.5 text-xs">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
