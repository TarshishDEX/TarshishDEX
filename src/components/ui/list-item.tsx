import { cn } from "@/lib/utils";

interface ListItemProps {
  icon?: React.ReactNode;
  primary: string;
  secondary?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Generic list item row used in dropdowns, notifications, asset pickers, etc.
 */
export function ListItem({ icon, primary, secondary, action, className }: ListItemProps) {
  return (
    <div className={cn("flex items-center gap-3 px-3 py-2.5", className)}>
      {icon && (
        <span className="bg-surface-elevated flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{primary}</p>
        {secondary && (
          <p className="text-foreground-faint truncate text-xs">{secondary}</p>
        )}
      </div>
      {action && <span className="shrink-0">{action}</span>}
    </div>
  );
}
