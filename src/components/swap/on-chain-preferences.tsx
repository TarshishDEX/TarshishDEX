"use client";

import { useState } from "react";
import { useWallet } from "@/lib/stellar/wallet-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { readTradingPreferences, writeTradingPreferences } from "@/lib/soroban/trading-preferences";
import { getTradingPreferencesContractId } from "@/lib/soroban/config";
import { explorerTxUrl } from "@/lib/stellar/config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";

const ROUTING_MODES = ["auto", "direct", "bridge"] as const;

/**
 * On-chain trading preferences panel. Reads the connected account's
 * preferences from the trading-preferences Soroban contract and lets the
 * account write them back (authorized via `require_auth` in the contract).
 * When the contract isn't deployed yet, shows a "not configured" state.
 *
 * The form holds a local draft; displayed values fall back to the on-chain
 * data (`prefs`) until the user edits, so there's no set-state-in-effect.
 */
export function OnChainPreferences() {
  const { address, status } = useWallet();
  const queryClient = useQueryClient();
  // Local draft overrides; null = follow the on-chain values.
  const [draft, setDraft] = useState<{ bps: number; mode: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastHash, setLastHash] = useState<string | null>(null);

  const configured = Boolean(getTradingPreferencesContractId());

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["on-chain-preferences", address],
    queryFn: () => readTradingPreferences(address ?? ""),
    enabled: Boolean(address && configured),
    staleTime: 30_000,
  });

  const slippageBps = draft?.bps ?? prefs?.max_slippage_bps ?? 100;
  const routingMode = draft?.mode ?? prefs?.routing_mode ?? "auto";

  /** Updaters keep the full draft shape so the state type stays consistent. */
  function updateDraft(patch: { bps?: number; mode?: string }) {
    setDraft((d) => ({ bps: d?.bps ?? 100, mode: d?.mode ?? "auto", ...patch }));
  }

  if (!configured) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">On-chain preferences</h2>
          <Badge tone="neutral">Not configured</Badge>
        </div>
        <p className="text-foreground-muted mt-2 text-sm">
          Set <code className="font-mono">NEXT_PUBLIC_TRADING_PREFERENCES_CONTRACT_ID</code> to the
          deployed contract address to enable reading and writing preferences on-chain.
        </p>
      </Card>
    );
  }

  if (status !== "connected" || !address) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">On-chain preferences</h2>
          <Badge tone="accent">Contract ready</Badge>
        </div>
        <p className="text-foreground-muted mt-2 text-sm">
          Connect your wallet to read and update your stored trading preferences on the
          trading-preferences contract.
        </p>
      </Card>
    );
  }

  async function handleSave() {
    if (!address) return;
    setSaving(true);
    setLastHash(null);
    const result = await writeTradingPreferences(address, {
      max_slippage_bps: slippageBps,
      routing_mode: routingMode,
      allowed_assets: [],
    });
    setSaving(false);
    if (result.ok) {
      setLastHash(result.hash);
      setDraft(null); // follow the freshly written on-chain values
      toast.success("On-chain preferences updated");
      void queryClient.invalidateQueries({ queryKey: ["on-chain-preferences", address] });
    } else if (result.reason === "cancelled") {
      toast.info("Transaction cancelled in your wallet");
    } else {
      toast.error("Contract execution failed");
    }
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold">On-chain preferences</h2>
        {isLoading ? (
          <Badge tone="neutral" dot>
            Loading…
          </Badge>
        ) : (
          <Badge tone="success" dot>
            Synced
          </Badge>
        )}
      </div>

      <label className="block">
        <span className="text-foreground-muted text-xs font-medium tracking-wider uppercase">
          Max slippage (bps)
        </span>
        <input
          type="number"
          min={1}
          max={10_000}
          value={slippageBps}
          onChange={(e) =>
            updateDraft({ bps: e.target.value === "" ? 100 : Number(e.target.value) })
          }
          aria-label="Max slippage in basis points"
          className="border-border bg-surface focus:border-primary/60 mt-1.5 h-10 w-full rounded-lg border px-3 text-sm font-semibold tabular-nums"
        />
      </label>

      <div>
        <span className="text-foreground-muted text-xs font-medium tracking-wider uppercase">
          Routing mode
        </span>
        <div className="mt-1.5 flex gap-2">
          {ROUTING_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => updateDraft({ mode })}
              className={`h-9 flex-1 rounded-lg border text-sm font-semibold transition-all ${
                routingMode === mode
                  ? "border-primary/60 bg-primary-soft text-primary"
                  : "border-border bg-surface text-foreground-muted hover:border-border-strong"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <Button size="lg" fullWidth onClick={handleSave} isLoading={saving} disabled={saving}>
        {saving ? "Submitting…" : "Save on-chain"}
      </Button>

      {lastHash && (
        <p className="bg-success-soft border-success/30 text-success rounded-lg border px-3 py-2 text-xs">
          Updated in{" "}
          <a
            href={explorerTxUrl(lastHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono underline-offset-2 hover:underline"
          >
            tx {lastHash.slice(0, 16)}…
          </a>
        </p>
      )}
    </Card>
  );
}
