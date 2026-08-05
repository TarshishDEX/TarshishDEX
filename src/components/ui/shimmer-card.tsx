import { cn } from "@/lib/utils";

interface ShimmerCardProps {
  lines?: number;
  className?: string;
}

/**
 * Shimmer placeholder card with animated gradient sweep.
 * Mimics the shape of a content card while data loads.
 */
export function ShimmerCard({ lines = 4, className }: ShimmerCardProps) {
  return (
    <div
      className={cn("glass-card rounded-2xl overflow-hidden", className)}
      aria-hidden="true"
    >
      <div className="p-6 space-y-4">
        <div className="bg-surface-elevated h-5 w-1/3 rounded-md shimmer-line" />
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 rounded-md shimmer-line"
            style={{ width: `${60 + Math.random() * 40}%` }}
          />
        ))}
      </div>
    </div>
  );
}
