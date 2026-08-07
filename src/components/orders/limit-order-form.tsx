"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TokenSelector } from "@/components/swap/token-selector";
import { useWallet } from "@/lib/stellar/wallet-store";
import { signAndSubmitContractTx } from "@/lib/stellar/contract-submit";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { StellarAsset } from "@/lib/stellar/types";

const USDC: StellarAsset = {
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};
const XLM: StellarAsset = { code: "XLM", isNative: true };

const EXPIRY_OPTIONS = [
  { label: "Never", ledgers: 0 },
  { label: "1 hour", ledgers: 720 },
  { label: "1 day", ledgers: 17_280 },
  { label: "1 week", ledgers: 120_960 },
];

export function LimitOrderForm() {
  const { address, connect, networkPassphrase } = useWallet();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [base, setBase] = useState<StellarAsset | null>(XLM);
  const [counter, setCounter] = useState<StellarAsset | null>(USDC);
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [expiryLedgers, setExpiryLedgers] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<"idle" | "building" | "signing" | "submitting">("idle");

  const disabled = !price || Number(price) <= 0 || !amount || Number(amount) <= 0 || !base || !counter;

  async function handlePlace() {
    if (disabled) return;

    if (!address) {
      const ok = await connect();
      if (!ok) {
        toast.error("Please connect your wallet to place limit orders.");
        return;
      }
    }

    setSubmitting(true);
    setPhase("building");
    try {
      // Step 1: Get the transaction XDR from the API
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: address,
          base: base?.code,
          counter: counter?.code,
          price: Math.floor(Number(price) * 1e7),
          amount: Math.floor(Number(amount) * 1e7),
          expiryLedger: expiryLedgers,
          side,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to build transaction");
      }

      const { xdr } = await res.json();
      if (!xdr) throw new Error("Contract not deployed on this network");

      // Step 2: Sign with wallet and submit
      setPhase("signing");
      const result = await signAndSubmitContractTx(xdr, address!, networkPassphrase);

      if (result.success) {
        toast.success(`Limit order placed successfully`);
        setPrice("");
        setAmount("");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to place order";
      toast.error(message);
    } finally {
      setSubmitting(false);
      setPhase("idle");
    }
  }

  const total = price && amount ? (Number(price) * Number(amount)).toFixed(2) : "—";

  const phaseLabel =
    phase === "building" ? "Building transaction…" :
    phase === "signing" ? "Signing in wallet…" :
    phase === "submitting" ? "Submitting…" : undefined;

  return (
    <Card className="p-6">
      <h2 className="font-display text-lg font-semibold">Place Limit Order</h2>
      <p className="text-foreground-muted mt-1 text-sm">
        Set a target price — your order executes when the market reaches it.
      </p>

      {/* Buy/Sell toggle */}
      <div className="bg-surface-elevated mt-4 flex rounded-lg p-1">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-semibold transition-all",
              side === s
                ? s === "buy"
                  ? "bg-success text-white"
                  : "bg-danger text-white"
                : "text-foreground-muted hover:text-foreground"
            )}
          >
            {s === "buy" ? "Buy" : "Sell"}
          </button>
        ))}
      </div>

      {/* Pair */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="text-foreground-faint text-xs font-medium tracking-wider uppercase">
            {side === "buy" ? "Buy" : "Sell"}
          </label>
          <div className="mt-1">
            <TokenSelector value={base} onSelect={setBase} />
          </div>
        </div>
        <div>
          <label className="text-foreground-faint text-xs font-medium tracking-wider uppercase">
            For
          </label>
          <div className="mt-1">
            <TokenSelector value={counter} onSelect={setCounter} />
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="mt-4">
        <label className="text-foreground-faint text-xs font-medium tracking-wider uppercase">
          Price ({counter?.code ?? "—"} per {base?.code ?? "—"})
        </label>
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.0"
          inputMode="decimal"
          aria-label="Limit price"
          className="border-border bg-surface placeholder:text-foreground-faint focus:border-primary/60 mt-1 h-12 w-full rounded-xl border px-4 text-lg font-semibold tabular-nums"
        />
      </div>

      {/* Amount */}
      <div className="mt-3">
        <label className="text-foreground-faint text-xs font-medium tracking-wider uppercase">
          Amount ({base?.code ?? "—"})
        </label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          inputMode="decimal"
          aria-label="Order amount"
          className="border-border bg-surface placeholder:text-foreground-faint focus:border-primary/60 mt-1 h-12 w-full rounded-xl border px-4 text-lg font-semibold tabular-nums"
        />
      </div>

      {/* Total */}
      <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-elevated px-4 py-3">
        <span className="text-foreground-faint text-xs tracking-wider uppercase">Total</span>
        <span className="font-mono text-lg font-semibold tabular-nums">
          {total} {counter?.code ?? ""}
        </span>
      </div>

      {/* Expiry */}
      <div className="mt-4">
        <label className="text-foreground-faint text-xs font-medium tracking-wider uppercase">
          Expiry
        </label>
        <div className="mt-1.5 flex gap-2">
          {EXPIRY_OPTIONS.map((opt) => (
            <button
              key={opt.ledgers}
              type="button"
              onClick={() => setExpiryLedgers(opt.ledgers)}
              className={cn(
                "flex-1 rounded-lg border py-2 text-xs font-medium transition-all",
                expiryLedgers === opt.ledgers
                  ? "border-primary/60 bg-primary-soft text-primary"
                  : "border-border bg-surface text-foreground-muted hover:border-border-strong"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button
        size="lg"
        fullWidth
        className="mt-5"
        disabled={disabled}
        isLoading={submitting}
        onClick={handlePlace}
      >
        {phaseLabel ?? `Place ${side === "buy" ? "Buy" : "Sell"} Order`}
      </Button>

      <p className="text-foreground-faint mt-3 text-center text-xs">
        Orders are stored on-chain via the limit-order Soroban contract.
        {!address && " Connect your wallet to get started."}
      </p>
    </Card>
  );
}
