import { cn } from "@/lib/utils";

interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

/**
 * Thin separator line — horizontal by default, vertical via prop.
 */
export function Separator({ orientation = "horizontal", className }: SeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "border-border shrink-0",
        orientation === "horizontal" ? "h-px w-full border-t" : "h-full w-px border-l",
        className
      )}
    />
  );
}
