import { cn } from "@/lib/utils";

interface ChipListProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Flex-wrap container for chips/tags/badges.
 * Automatically wraps when content overflows.
 */
export function ChipList({ children, className }: ChipListProps) {
  return <div className={cn("flex flex-wrap gap-1.5", className)}>{children}</div>;
}
