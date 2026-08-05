import { cn } from "@/lib/utils";

interface HelpTextProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Supplementary help text displayed below or beside form fields.
 * Lighter weight than error text — just informational.
 */
export function HelpText({ children, className }: HelpTextProps) {
  return (
    <p className={cn("text-foreground-faint mt-1.5 text-xs leading-relaxed", className)}>
      {children}
    </p>
  );
}
