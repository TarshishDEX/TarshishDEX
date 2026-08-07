"use client";

import { Button } from "@/components/ui/button";

interface DisconnectDialogProps {
  address: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation dialog shown before disconnecting a wallet.
 * Prevents accidental disconnection and reminds the user which
 * address they're about to disconnect.
 */
export function DisconnectDialog({ address, onConfirm, onCancel }: DisconnectDialogProps) {
  const shortAddr = `${address.slice(0, 6)}…${address.slice(-6)}`;

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="glass-card animate-fade-in-up mx-4 w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Disconnect wallet confirmation"
      >
        <h3 className="font-display text-lg font-semibold">Disconnect wallet?</h3>
        <p className="text-foreground-muted mt-2 text-sm">
          You&apos;ll need to reconnect <span className="font-mono font-medium">{shortAddr}</span>{" "}
          to execute swaps or view your on-chain preferences.
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" size="lg" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="lg" className="flex-1" onClick={onConfirm}>
            Disconnect
          </Button>
        </div>
      </div>
    </div>
  );
}
