import { cn } from "@/lib/utils";

interface EmptyStateIconProps {
  icon: string;
  className?: string;
}

export function EmptyStateIcon({ icon, className }: EmptyStateIconProps) {
  return (
    <span className={cn("text-foreground-faint text-3xl select-none", className)} aria-hidden="true">
      {icon}
    </span>
  );
}
