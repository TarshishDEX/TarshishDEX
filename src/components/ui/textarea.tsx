"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = ({ className, label, error, id, ...props }: TextareaProps) => {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-foreground-muted mb-1.5 block text-xs font-medium tracking-wider uppercase"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          "bg-surface placeholder:text-foreground-faint min-h-[80px] w-full resize-y rounded-xl border px-3 py-2.5 text-sm transition-colors",
          "focus:border-primary/60 focus:ring-primary/20 focus:ring-2 focus:outline-none",
          error ? "border-danger/60" : "border-border hover:border-border-strong",
          className
        )}
        {...props}
      />
      {error && <p className="text-danger mt-1.5 text-xs">{error}</p>}
    </div>
  );
};
Textarea.displayName = "Textarea";
