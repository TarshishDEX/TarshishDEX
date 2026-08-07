import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "success" | "warning" | "danger";
  className?: string;
}

const sizeMap = { sm: "h-1", md: "h-1.5", lg: "h-2.5" };
const variantMap = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/**
 * Animated progress bar with color-coded variants and sizes.
 */
export function ProgressBar({
  value,
  max = 100,
  size = "md",
  variant = "primary",
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={cn("bg-surface-elevated overflow-hidden rounded-full", sizeMap[size], className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out",
          variantMap[variant]
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
