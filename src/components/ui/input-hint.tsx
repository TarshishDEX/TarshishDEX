import { cn } from "@/lib/utils";

interface InputHintProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Standard hint text displayed below form inputs.
 */
export function InputHint({ children, className }: InputHintProps) {
  return (
    <p className={cn("text-foreground-faint mt-1.5 text-xs", className)}>
      {children}
    </p>
  );
}
