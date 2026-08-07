import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Reusable empty-state placeholder for tables, lists, and panels.
 * Centralizes the styling and messaging so every "no data" view is consistent.
 */
export function EmptyState({ icon = "◈", title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <span className="text-foreground-faint mb-3 text-3xl" aria-hidden="true">
        {icon}
      </span>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      {description && (
        <p className="text-foreground-muted mx-auto mt-2 max-w-md text-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
