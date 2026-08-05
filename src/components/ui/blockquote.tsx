import { cn } from "@/lib/utils";

interface BlockquoteProps {
  children: React.ReactNode;
  variant?: "info" | "warning" | "danger" | "success";
  className?: string;
}

const variantMap = {
  info: "border-primary/40 bg-primary-soft/50 text-foreground",
  warning: "border-warning/40 bg-warning-soft/50 text-warning",
  danger: "border-danger/40 bg-danger-soft/50 text-danger",
  success: "border-success/40 bg-success-soft/50 text-success",
};

/**
 * Blockquote-style callout for important notices, warnings, and tips.
 */
export function Blockquote({ children, variant = "info", className }: BlockquoteProps) {
  return (
    <blockquote className={cn("rounded-xl border-l-4 px-4 py-3 text-sm", variantMap[variant], className)}>
      {children}
    </blockquote>
  );
}
