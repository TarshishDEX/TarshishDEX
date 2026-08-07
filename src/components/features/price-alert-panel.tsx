"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/lib/stellar/wallet-store";
import { toast } from "@/components/ui/toast";

interface PriceAlert {
  id: string;
  asset: string;
  targetPrice: number;
  direction: "above" | "below";
  enabled: boolean;
}

const STORAGE_KEY = "tarshishdex-price-alerts";

/**
 * Price alert configuration panel. Alerts are stored in localStorage
 * and surfaced as toasts when the target price is hit (requires a
 * price polling mechanism to trigger — this component handles the UI).
 */
export function PriceAlertPanel() {
  const { address } = useWallet();
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
      return [];
    }
  });
  const [asset, setAsset] = useState("XLM");
  const [targetPrice, setTargetPrice] = useState("");
  const [direction, setDirection] = useState<"above" | "below">("above");

  function persist(updated: PriceAlert[]) {
    setAlerts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function addAlert() {
    if (!targetPrice || Number(targetPrice) <= 0) return;
    const newAlert: PriceAlert = {
      id: crypto.randomUUID(),
      asset,
      targetPrice: Number(targetPrice),
      direction,
      enabled: true,
    };
    persist([...alerts, newAlert]);
    setTargetPrice("");
    toast.success(`Alert set: ${asset} ${direction} ${targetPrice}`);
  }

  function removeAlert(id: string) {
    persist(alerts.filter((a) => a.id !== id));
  }

  function toggleAlert(id: string) {
    persist(alerts.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  }

  if (!address) {
    return (
      <Card className="p-5">
        <h3 className="font-display text-base font-semibold">Price Alerts</h3>
        <p className="text-foreground-muted mt-2 text-sm">
          Connect your wallet to set price alerts in the browser.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <h3 className="font-display text-base font-semibold">Price Alerts</h3>

      <div className="flex gap-2">
        <input
          value={asset}
          onChange={(e) => setAsset(e.target.value.toUpperCase())}
          placeholder="Asset code"
          className="border-border bg-surface h-10 w-24 rounded-lg border px-3 font-mono text-sm"
          maxLength={12}
        />
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value as "above" | "below")}
          className="border-border bg-surface text-foreground h-10 rounded-lg border px-2 text-xs"
        >
          <option value="above">Above ↑</option>
          <option value="below">Below ↓</option>
        </select>
        <input
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          placeholder="Price"
          type="number"
          min="0"
          step="0.0000001"
          className="border-border bg-surface h-10 flex-1 rounded-lg border px-3 text-sm tabular-nums"
        />
        <Button size="sm" onClick={addAlert} disabled={!targetPrice}>
          Set
        </Button>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="border-border flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <Badge tone={alert.direction === "above" ? "success" : "danger"} dot>
                  {alert.asset} {alert.direction} {alert.targetPrice}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleAlert(alert.id)}
                  className={`text-xs ${alert.enabled ? "text-success" : "text-foreground-faint"}`}
                >
                  {alert.enabled ? "ON" : "OFF"}
                </button>
                <button
                  type="button"
                  onClick={() => removeAlert(alert.id)}
                  className="text-foreground-faint hover:text-danger text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {alerts.length === 0 && (
        <p className="text-foreground-faint text-xs">No price alerts set. Add one above.</p>
      )}
    </Card>
  );
}
