import { cn } from "@/lib/utils";

interface KeyValuePairProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}

/**
 * Label-value row used in detail panels and transaction summaries.
 */
export function KeyValuePair({ label, value, mono, className }: KeyValuePairProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-1.5", className)}>
      <span className="text-foreground-muted text-sm shrink-0">{label}</span>
      <span className={cn("text-right text-sm font-medium", mono && "font-mono tabular-nums")}>
        {value}
      </span>
    </div>
  );
}
