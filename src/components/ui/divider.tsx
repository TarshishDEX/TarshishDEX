import { cn } from "@/lib/utils";

interface DividerProps {
  label?: string;
  className?: string;
}

/**
 * Horizontal divider with optional centered label.
 * Used to visually separate content sections.
 */
export function Divider({ label, className }: DividerProps) {
  if (!label) {
    return <hr className={cn("border-border", className)} />;
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <hr className="border-border flex-1" />
      <span className="text-foreground-faint text-xs font-medium tracking-wider uppercase whitespace-nowrap">
        {label}
      </span>
      <hr className="border-border flex-1" />
    </div>
  );
}
