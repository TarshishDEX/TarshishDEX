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
    <div className={cn("sticky top-16 z-10 bg-background/95 backdrop-blur-sm", className)}>
      {children}
    </div>
  );
}
