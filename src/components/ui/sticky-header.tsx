import { cn } from "@/lib/utils";

interface StickyHeaderProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Sticky container for table headers that remain visible when scrolling.
 * Uses position: sticky with the same top offset as the main header.
 */
export function StickyHeader({ children, className }: StickyHeaderProps) {
  return (
    <div className={cn("bg-background/95 sticky top-16 z-10 backdrop-blur-sm", className)}>
      {children}
    </div>
  );
}
