import { cn } from "@/lib/utils";

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

/**
 * Realistic table skeleton with header and staggered row animations.
 */
export function SkeletonTable({ rows = 5, columns = 4, className }: SkeletonTableProps) {
  return (
    <div className={cn("animate-pulse", className)} aria-hidden="true">
      {/* Header */}
      <div className="border-border flex gap-6 border-b px-6 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-elevated h-3 rounded"
            style={{ width: `${60 + Math.random() * 40}%` }}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="border-border/50 flex gap-6 border-b px-6 py-4"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className="bg-surface-elevated h-4 rounded"
              style={{ width: `${40 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
