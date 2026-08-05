import { cn } from "@/lib/utils";

interface MeterProps {
  value: number;
  min?: number;
  max?: number;
  low?: number;
  high?: number;
  optimum?: number;
  label?: string;
  className?: string;
}

/**
 * HTML <meter> replacement with custom styling.
 * Shows a gauged value with color transitions at low/high thresholds.
 */
export function Meter({
  value, min = 0, max = 100, low, high, optimum, label, className,
}: MeterProps) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const color = optimum !== undefined
    ? value >= optimum ? "bg-success" : value >= (low ?? 30) ? "bg-warning" : "bg-danger"
    : pct > (high ?? 80) ? "bg-danger" : pct > (low ?? 50) ? "bg-warning" : "bg-success";

  return (
    <div className={cn("w-full", className)} role="meter" aria-valuenow={value} aria-valuemin={min} aria-valuemax={max} aria-label={label}>
      {label && <span className="text-foreground-muted mb-1 block text-xs">{label}</span>}
      <div className="bg-surface-elevated h-2 overflow-hidden rounded-full">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
