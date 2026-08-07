import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface SkeletonGroupProps {
  count?: number;
  rows?: number;
  className?: string;
}

// Deterministic widths for skeleton lines — avoids Math.random() during render.
const HEADER_WIDTHS = [30, 45, 38, 42, 35, 48, 40, 50];
const ROW_WIDTHS = [55, 70, 82, 65, 90, 75, 60, 85, 95, 58, 80, 72];

/**
 * Renders a group of skeleton rows with varying widths for realistic loading states.
 */
export function SkeletonGroup({ count = 3, rows = 4, className }: SkeletonGroupProps) {
  const groups = useMemo(
    () =>
      Array.from({ length: count }).map((_, groupIdx) => ({
        headerWidth: `${HEADER_WIDTHS[groupIdx % HEADER_WIDTHS.length]}%`,
        lines: Array.from({ length: rows }).map((__, lineIdx) => ({
          width: `${ROW_WIDTHS[(groupIdx * rows + lineIdx) % ROW_WIDTHS.length]}%`,
          delay: `${lineIdx * 100}ms`,
        })),
      })),
    [count, rows]
  );

  return (
    <div className={cn("space-y-4 p-6", className)} aria-hidden="true">
      {groups.map((group, i) => (
        <div key={i} className="space-y-2">
          <div
            className="bg-surface-elevated animate-pulse rounded-md"
            style={{ height: "1rem", width: group.headerWidth }}
          />
          {group.lines.map((line, j) => (
            <div
              key={j}
              className="bg-surface-elevated animate-pulse rounded-md"
              style={{ height: "0.75rem", width: line.width, animationDelay: line.delay }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
