import { cn } from "@/lib/utils";

interface SkeletonGroupProps {
  count?: number;
  rows?: number;
  className?: string;
}

/**
 * Renders a group of skeleton rows with varying widths for realistic loading states.
 */
export function SkeletonGroup({ count = 3, rows = 4, className }: SkeletonGroupProps) {
  return (
    <div className={cn("space-y-4 p-6", className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div
            className="bg-surface-elevated animate-pulse rounded-md"
            style={{ height: "1rem", width: `${30 + Math.random() * 40}%` }}
          />
          {Array.from({ length: rows }).map((_, j) => (
            <div
              key={j}
              className="bg-surface-elevated animate-pulse rounded-md"
              style={{ height: "0.75rem", width: `${50 + Math.random() * 50}%`, animationDelay: `${j * 100}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
