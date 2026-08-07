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
  const lineWidths = useMemo(() => Array.from({ length: lines }, (_, i) => getWidth(i)), [lines]);

  return (
    <div className={cn("glass-card overflow-hidden rounded-2xl", className)} aria-hidden="true">
      <div className="space-y-4 p-6">
        <div className="bg-surface-elevated shimmer-line h-5 w-1/3 rounded-md" />
        {lineWidths.map((width, i) => (
          <div key={i} className="shimmer-line h-4 rounded-md" style={{ width }} />
        ))}
      </div>
    </div>
  );
}
