"use client";

import { cn } from "@/lib/utils";

interface BadgeCounterProps {
  count: number;
  max?: number;
  variant?: "primary" | "success" | "warning" | "danger";
  className?: string;
}

const variantMap = {
  primary: "bg-primary-solid text-white",
  success: "bg-success text-background",
  warning: "bg-warning text-background",
  danger: "bg-danger text-white",
};

export function BadgeCounter({
  count,
  max = 99,
  variant = "primary",
  className,
}: BadgeCounterProps) {
  const display = count > max ? `${max}+` : String(count);
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] leading-none font-bold",
        variantMap[variant],
        className
      )}
    >
      {display}
    </span>
  );
}
