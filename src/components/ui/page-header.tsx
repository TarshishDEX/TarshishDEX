import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standard page header with title, description, and action slot.
 * Used consistently across all page layouts for visual harmony.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center",
        className
      )}
    >
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-foreground-muted mt-2 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
