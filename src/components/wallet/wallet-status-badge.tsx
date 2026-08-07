"use client";

import { cn } from "@/lib/utils";
import type { WalletStatus } from "@/lib/stellar/wallet-store";

interface WalletStatusBadgeProps {
  status: WalletStatus;
  className?: string;
}

const statusConfig: Record<WalletStatus, { label: string; color: string; pulse: boolean }> = {
  disconnected: { label: "Disconnected", color: "bg-foreground-faint", pulse: false },
  connecting: { label: "Connecting…", color: "bg-warning", pulse: true },
  connected: { label: "Connected", color: "bg-success", pulse: false },
};

export function WalletStatusBadge({ status, className }: WalletStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", className)}>
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
              config.color
            )}
          />
        )}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", config.color)} />
      </span>
      <span className="text-foreground-muted">{config.label}</span>
    </span>
  );
}
