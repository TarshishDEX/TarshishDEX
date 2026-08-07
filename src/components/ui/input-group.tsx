import { cn } from "@/lib/utils";

interface InputGroupProps {
  prepend?: React.ReactNode;
  append?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Groups an input with prepended and/or appended elements (icons, labels, etc.).
 */
export function InputGroup({ prepend, append, children, className }: InputGroupProps) {
  return (
    <div
      className={cn(
        "border-border bg-surface focus-within:border-primary/60 focus-within:ring-primary/20 flex items-center rounded-xl border transition-colors focus-within:ring-2",
        className
      )}
    >
      {prepend && (
        <span className="text-foreground-muted flex shrink-0 items-center pl-3 text-sm">
          {prepend}
        </span>
      )}
      <div className="flex-1">{children}</div>
      {append && (
        <span className="text-foreground-muted flex shrink-0 items-center pr-3 text-sm">
          {append}
        </span>
      )}
    </div>
  );
}
