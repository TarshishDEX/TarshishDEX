import { cn } from "@/lib/utils";

interface PanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

/**
 * Generic bordered panel with optional title and header right slot.
 * Used for grouping related content in detail views.
 */
export function Panel({ title, children, className, headerRight }: PanelProps) {
  return (
    <div className={cn("border-border rounded-xl border", className)}>
      {(title || headerRight) && (
        <div className="border-border flex items-center justify-between border-b px-5 py-3.5">
          {title && <h3 className="font-display text-base font-semibold">{title}</h3>}
          {headerRight}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
