"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LastUpdatedProps {
  timestamp: number | null;
  className?: string;
}

/**
 * Displays a relative time string ("just now", "2m ago", etc.) since the
 * last data refresh. Auto-updates every 30 seconds.
 */
export function LastUpdated({ timestamp, className }: LastUpdatedProps) {
  // Track the current time in state so we never call Date.now() during render.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!timestamp) return null;

  const seconds = Math.floor((now - timestamp) / 1000);
  const text =
    seconds < 10
      ? "just now"
      : seconds < 60
        ? `${seconds}s ago`
        : seconds < 3600
          ? `${Math.floor(seconds / 60)}m ago`
          : `${Math.floor(seconds / 3600)}h ago`;

  return (
    <span className={cn("text-foreground-faint text-xs tabular-nums", className)}>
      Updated {text}
    </span>
  );
}
