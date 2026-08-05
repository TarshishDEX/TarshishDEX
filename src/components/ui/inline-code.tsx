import { cn } from "@/lib/utils";

interface InlineCodeProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Inline code display with monospace font and subtle background.
 * Used for addresses, function names, and config keys in documentation text.
 */
export function InlineCode({ children, className }: InlineCodeProps) {
  return (
    <code
      className={cn(
        "bg-surface-elevated text-primary inline rounded-md px-1.5 py-0.5 font-mono text-[0.85em]",
        className
      )}
    >
      {children}
    </code>
  );
}
