"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Collapsible section with smooth height animation.
 * Uses a ref-based max-height approach for CSS-transition compatibility.
 */
export function ExpandableSection({
  title,
  children,
  defaultOpen = false,
  className,
}: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(defaultOpen ? undefined : 0);

  useEffect(() => {
    if (open && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [open]);

  return (
    <div className={cn("border-border rounded-xl border", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-surface"
        aria-expanded={open}
      >
        <span>{title}</span>
        <svg
          className={cn(
            "text-foreground-muted h-4 w-4 shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: height !== undefined ? `${height}px` : "9999px" }}
      >
        <div ref={contentRef} className="border-border border-t px-4 py-3">
          {children}
        </div>
      </div>
    </div>
  );
}
