import { cn } from "@/lib/utils";

interface LabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Standard label for form fields.
 */
export function Label({ htmlFor, children, className }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "text-foreground-muted block text-xs font-medium tracking-wider uppercase",
        className
      )}
    >
      {children}
    </label>
  );
}
