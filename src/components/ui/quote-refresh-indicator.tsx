"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface QuoteRefreshIndicatorProps {
  staleTimeMs: number;
  onRefresh: () => void;
  className?: string;
}

/**
 * Visual countdown bar that indicates when a quote is about to go stale.
 * Shows a shrinking progress bar over `staleTimeMs` and fires `onRefresh`.
 * Click to force-refresh immediately.
 */
export function QuoteRefreshIndicator({
  staleTimeMs,
  onRefresh,
  className,
}: QuoteRefreshIndicatorProps) {
  const [progress, setProgress] = useState(100);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = Date.now();
    setProgress(100);

    function tick() {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / staleTimeMs) * 100);
      setProgress(pct);
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onRefresh();
        startRef.current = Date.now();
        setProgress(100);
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [staleTimeMs, onRefresh]);

  return (
    <button
      type="button"
      onClick={() => {
        startRef.current = Date.now();
        setProgress(100);
        onRefresh();
      }}
      className={cn("group w-full", className)}
      aria-label="Refresh quote"
      title="Click to refresh"
    >
      <div className="bg-surface-elevated h-1 overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            progress > 60 ? "bg-success" : progress > 30 ? "bg-warning" : "bg-danger"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </button>
  );
}
