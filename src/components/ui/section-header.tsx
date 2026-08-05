import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Section-level header with title, optional description, and action slot.
 * Used inside cards and panels for consistent layout.
 */
export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div>
        <h3 className="font-display text-base font-semibold">{title}</h3>
        {description && <p className="text-foreground-faint mt-1 text-xs">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
