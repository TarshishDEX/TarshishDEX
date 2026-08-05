import { cn } from "@/lib/utils";

interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Keyboard key indicator — styled like a physical key cap.
 * Use for shortcut hints and keyboard navigation documentation.
 */
export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 items-center rounded border border-border bg-surface-elevated px-1.5",
        "text-[11px] font-mono font-medium text-foreground-muted leading-none",
        "shadow-[0_1px_0_var(--color-border)]",
        className
      )}
    >
      {children}
    </kbd>
  );
}
