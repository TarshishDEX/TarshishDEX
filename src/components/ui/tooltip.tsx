"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delayMs?: number;
}

/**
 * Minimal accessible tooltip. Shows on hover/focus after a short delay and
 * hides on mouse leave / blur. Uses a portal-free inline positioning strategy
 * for simplicity – trade-off is it may clip in overflow-hidden ancestors.
 */
export function Tooltip({ content, children, side = "top", delayMs = 300 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(true), delayMs);
  }, [delayMs]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  const sideClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {visible && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-surface-overlay border border-border px-2.5 py-1.5 text-xs text-foreground shadow-xl backdrop-blur animate-fade-in",
            sideClasses[side]
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
