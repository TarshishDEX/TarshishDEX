"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type NetworkStatus = "online" | "offline" | "slow";

/**
 * Network status indicator. Shows a coloured dot and label for
 * online / offline / slow-connection states. Revalidates every 5s.
 */
export function NetworkIndicator({ className }: { className?: string }) {
  const [status, setStatus] = useState<NetworkStatus>("online");

  useEffect(() => {
    function update() {
      if (typeof navigator === "undefined") return;
      if (!navigator.onLine) {
        setStatus("offline");
        return;
      }
      // Heuristic: if connection has effectiveType and it's slow-2g/2g, flag as slow.
      const conn = (navigator as Navigator & { connection?: { effectiveType?: string } })
        .connection;
      if (conn?.effectiveType && ["slow-2g", "2g"].includes(conn.effectiveType)) {
        setStatus("slow");
        return;
      }
      setStatus("online");
    }

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const interval = setInterval(update, 5_000);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      clearInterval(interval);
    };
  }, []);

  const config: Record<NetworkStatus, { color: string; label: string }> = {
    online: { color: "bg-success", label: "Online" },
    offline: { color: "bg-danger", label: "Offline" },
    slow: { color: "bg-warning", label: "Slow network" },
  };

  const { color, label } = config[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", className)}>
      <span className="relative flex h-2 w-2">
        {status !== "offline" && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
              color
            )}
          />
        )}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", color)} />
      </span>
      <span className="text-foreground-muted">{label}</span>
    </span>
  );
}
