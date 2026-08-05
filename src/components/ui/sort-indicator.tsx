import { cn } from "@/lib/utils";

interface SortIndicatorProps {
  active: boolean;
  direction: "asc" | "desc";
  className?: string;
}

/**
 * Unified sort arrow indicator for table headers.
 * Shows a highlighted arrow when the column is the active sort key,
 * and a muted double-arrow placeholder otherwise.
 */
export function SortIndicator({ active, direction, className }: SortIndicatorProps) {
  return (
    <svg
      className={cn(
        "h-3 w-3 transition-colors",
        active ? "text-primary" : "text-foreground-faint",
        className
      )}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      {active && direction === "asc" ? (
        <path d="M5 12l5-4 5 4" strokeLinecap="round" strokeLinejoin="round" />
      ) : active && direction === "desc" ? (
        <path d="M5 8l5 4 5-4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <>
          <path d="M5 12l5-4 5 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 8l5 4 5-4" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
        </>
      )}
    </svg>
  );
}
