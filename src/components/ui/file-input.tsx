"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

interface FileInputProps {
  accept?: string;
  onChange: (file: File | null) => void;
  label?: string;
  className?: string;
}

export function FileInput({ accept, onChange, label = "Choose file", className }: FileInputProps) {
  const id = useId();
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className={cn("w-full", className)}>
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-sm transition-colors",
          "border-border bg-surface hover:border-border-strong hover:bg-surface-elevated"
        )}
      >
        <svg
          className="text-foreground-faint h-5 w-5"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path
            d="M4 13v2a2 2 0 002 2h8a2 2 0 002-2v-2M12 6v7m0-7l-2.5 2.5M12 6l2.5 2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-foreground-muted">{fileName ?? label}</span>
      </label>
      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          setFileName(file?.name ?? null);
          onChange(file);
        }}
      />
    </div>
  );
}
