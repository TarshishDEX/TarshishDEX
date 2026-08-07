import { cn } from "@/lib/utils";

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: "span" | "div";
  className?: string;
}

/**
 * Content that is visually hidden but accessible to screen readers.
 * Used for labels, status messages, and skip links.
 */
export function VisuallyHidden({ children, as: Tag = "span", className }: VisuallyHiddenProps) {
  return (
    <Tag
      className={cn(
        "absolute -m-px h-px w-px overflow-hidden border-0 p-0 whitespace-nowrap [clip:rect(0,0,0,0)]",
        className
      )}
    >
      {children}
    </Tag>
  );
}
