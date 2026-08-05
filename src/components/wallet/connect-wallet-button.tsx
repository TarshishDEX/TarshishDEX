"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@/lib/stellar/wallet-store";
import { useXlmBalance } from "@/lib/stellar/queries";
import { isWalletAvailable } from "@/lib/stellar/wallet-kit";
import { explorerAccountUrl } from "@/lib/stellar/config";
import { toast } from "@/components/ui/toast";
import { DisconnectDialog } from "@/components/wallet/disconnect-dialog";
import { cn, formatCompact, truncateAddress } from "@/lib/utils";

const FREIGHTER_INSTALL_URL = "https://www.freighter.app/";

/**
 * Header wallet control. Disconnected: renders the primary "Connect Wallet"
 * button, which opens the StellarWalletsKit wallet picker. Connected: renders
 * the truncated address with a dropdown for account switching (re-open the
 * picker) and disconnect.
 */
export function ConnectWalletButton() {
  const { address, status, connect, disconnect } = useWallet();
  const { data: xlmBalance } = useXlmBalance(address ?? "");
  const [open, setOpen] = useState(false);
  const [showInstallHint, setShowInstallHint] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the dropdown on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function handleConnect() {
    // If no wallet extension is present, surface an onboarding hint instead of
    // opening an empty picker.
    if (!(await isWalletAvailable())) {
      setShowInstallHint(true);
      toast.error("No wallet extension detected — install Freighter to continue.");
      return;
    }
    const ok = await connect();
    setOpen(false);
    if (ok) {
      toast.success("Wallet connected");
    } else {
      toast.error("Wallet connection failed or was rejected.");
    }
  }

  if (!address) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <button
          type="button"
          onClick={handleConnect}
          disabled={status === "connecting"}
          className="bg-primary shadow-primary/25 hover:bg-primary-hover hover:shadow-primary/40 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-200 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
        >
          {status === "connecting" ? "Connecting…" : "Connect Wallet"}
        </button>
        {showInstallHint && (
          <a
            href={FREIGHTER_INSTALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-hover text-xs font-medium underline-offset-2 hover:underline"
          >
            Install Freighter →
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="border-border bg-surface hover:border-border-strong flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
      >
        <span className="bg-success relative flex h-2 w-2">
          <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
          <span className="bg-success relative inline-flex h-2 w-2 rounded-full" />
        </span>
        <span className="font-mono">{truncateAddress(address)}</span>
        <svg
          className={cn(
            "text-foreground-muted h-3.5 w-3.5 transition-transform",
            open && "rotate-180"
          )}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M5 8l5 4 5-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="glass-card animate-fade-in absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl p-2 shadow-2xl"
        >
          <div className="border-border/60 mb-1 border-b px-3 py-2.5">
            <p className="text-foreground-faint text-xs tracking-wider uppercase">
              Connected account
            </p>
            <p className="mt-1 font-mono text-sm break-all">{address}</p>
            <p className="text-foreground-muted mt-1 text-sm">
              Balance:{" "}
              <span className="font-semibold tabular-nums">
                {xlmBalance != null ? `${formatCompact(Number(xlmBalance))} XLM` : "—"}
              </span>
            </p>
            <a
              href={explorerAccountUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-hover mt-1.5 inline-block text-xs font-medium transition-colors"
            >
              View on explorer ↗
            </a>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              void handleConnect();
            }}
            className="hover:bg-surface-elevated flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors"
          >
            <span className="bg-primary-soft text-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path
                  d="M4 7h12m0 0l-3-3m3 3l-3 3M16 13H4m0 0l3 3m-3-3l3-3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>
              <span className="block font-medium">Switch account</span>
              <span className="text-foreground-faint block text-xs">Open wallet picker</span>
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirmDisconnect(true);
            }}
            className="hover:bg-danger-soft text-danger flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors"
          >
            <span className="bg-danger-soft flex h-8 w-8 items-center justify-center rounded-lg">
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M6 6L14 14M14 6L6 14" strokeLinecap="round" />
              </svg>
            </span>
            <span className="font-medium">Disconnect</span>
          </button>
        </div>
      )}

      {confirmDisconnect && address && (
        <DisconnectDialog
          address={address}
          onConfirm={() => {
            setConfirmDisconnect(false);
            void disconnect();
            toast.info("Wallet disconnected");
          }}
          onCancel={() => setConfirmDisconnect(false)}
        />
      )}
    </div>
  );
}
