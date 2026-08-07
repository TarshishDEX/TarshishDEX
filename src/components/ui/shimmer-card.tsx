import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface ShimmerCardProps {
  lines?: number;
  className?: string;
}

// Deterministic widths for shimmer lines based on index.
const WIDTHS = [85, 92, 78, 95, 70, 88, 98, 75, 90, 82];

function getWidth(index: number): string {
  return `${WIDTHS[index % WIDTHS.length]}%`;
}

/**
 * Shimmer placeholder card with animated gradient sweep.
 * Mimics the shape of a content card while data loads.
 */
export function ShimmerCard({ lines = 4, className }: ShimmerCardProps) {
  // Memoize the widths so they remain stable across re-renders.
  const lineWidths = useMemo(
    () => Array.from({ length: lines }, (_, i) => getWidth(i)),
    [lines]
  );

  return (
    <div
      className={cn("glass-card rounded-2xl overflow-hidden", className)}
      aria-hidden="true"
    >
      <div className="p-6 space-y-4">
        <div className="bg-surface-elevated h-5 w-1/3 rounded-md shimmer-line" />
        {lineWidths.map((width, i) => (
          <div
            key={i}
            className="h-4 rounded-md shimmer-line"
            style={{ width }}
          />
        ))}
      </div>
    </div>
  );
}
