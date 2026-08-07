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
        "border-border bg-surface-elevated inline-flex h-5 items-center rounded border px-1.5",
        "text-foreground-muted font-mono text-[11px] leading-none font-medium",
        "shadow-[0_1px_0_var(--color-border)]",
        className
      )}
    >
      {children}
    </kbd>
  );
}
