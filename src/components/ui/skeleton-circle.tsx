import { cn } from "@/lib/utils";

interface SkeletonCircleProps {
  size?: number;
  className?: string;
}

/**
 * Circular skeleton placeholder for avatars, token icons, and round badges.
 */
export function SkeletonCircle({ size = 40, className }: SkeletonCircleProps) {
  return (
    <div
      className={cn("bg-surface-elevated animate-pulse rounded-full", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
