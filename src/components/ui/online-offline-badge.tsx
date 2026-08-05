"use client";

import { cn } from "@/lib/utils";

interface OnlineOfflineBadgeProps {
  online: boolean;
  label?: string;
  className?: string;
}

/**
 * Simple online/offline indicator badge.
 * Green dot + "Online" text when connected, red dot + "Offline" otherwise.
 */
export function OnlineOfflineBadge({ online, label, className }: OnlineOfflineBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        online
          ? "border-success/30 bg-success-soft text-success"
          : "border-danger/30 bg-danger-soft text-danger",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", online ? "bg-success" : "bg-danger")} />
      {label ?? (online ? "Online" : "Offline")}
    </span>
  );
}
