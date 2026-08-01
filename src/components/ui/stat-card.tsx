import { cn, formatPercent } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  delta?: number;
  hint?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export function StatCard({ label, value, delta, hint, loading, className }: StatCardProps) {
  const deltaPositive = (delta ?? 0) >= 0;
  return (
    <Card className={cn("p-5", className)}>
      <p className="text-foreground-muted text-xs font-medium tracking-wider uppercase">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        {loading ? (
          <div className="bg-surface-elevated h-8 w-28 animate-pulse rounded-md" />
        ) : (
          <span className="font-display text-2xl font-semibold tabular-nums">{value}</span>
        )}
        {delta !== undefined && !loading && (
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              deltaPositive ? "text-success" : "text-danger"
            )}
          >
            {formatPercent(delta, true)}
          </span>
        )}
      </div>
      {hint && !loading && <p className="text-foreground-faint mt-1 text-xs">{hint}</p>}
    </Card>
  );
}
