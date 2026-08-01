"use client";

import { useState } from "react";
import { usePortfolioSummary, useTradeHistory } from "@/lib/stellar/queries";
import { isValidPublicKey } from "@/lib/stellar/account";
import { BalanceTable } from "@/components/portfolio/balance-table";
import { TradeHistory } from "@/components/portfolio/trade-history";
import { AllocationDonut } from "@/components/charts/allocation-donut";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCompact, truncateAddress } from "@/lib/utils";

const EXAMPLE_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

export function PortfolioWidget() {
  const [address, setAddress] = useState("");
  const [activeAddress, setActiveAddress] = useState("");

  const valid = isValidPublicKey(address);
  const { data: portfolio, isLoading, isError } = usePortfolioSummary(activeAddress);
  const { data: history, isLoading: historyLoading } = useTradeHistory(activeAddress);

  const allocationData =
    portfolio?.balances
      .filter((b) => b.valueInXlm !== null && b.valueInXlm > 0)
      .map((b) => ({ name: b.token.code, value: b.valueInXlm as number })) ?? [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (valid) setActiveAddress(address.trim());
  }

  return (
    <div className="space-y-6">
      {/* Watch-mode address input */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Portfolio</h1>
            <p className="text-foreground-muted mt-2">
              Track any Stellar account&apos;s balances, allocation, and trade history. Wallet
              connection arrives in Phase 4 — for now, paste a public key to watch.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={EXAMPLE_ADDRESS}
            aria-label="Stellar public key"
            spellCheck={false}
            className="border-border bg-surface placeholder:text-foreground-faint focus:border-primary/60 focus:ring-primary/20 h-11 flex-1 rounded-xl border px-4 font-mono text-sm focus:ring-2"
          />
          <Button type="submit" disabled={!valid} size="lg">
            Load Portfolio
          </Button>
        </form>
        {address && !valid && (
          <p className="text-warning mt-2 text-xs">
            Enter a valid Stellar public key (starts with G, 56 characters).
          </p>
        )}
      </Card>

      {activeAddress && (
        <div className="animate-fade-in-up space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            {" "}
            <StatCard
              label="Total Value"
              value={portfolio ? `${formatCompact(portfolio.totalValueXlm)} XLM` : "—"}
              loading={isLoading}
              hint={portfolio ? `≈ ${formatCompact(portfolio.totalValueXlm)} XLM` : "Quoted in XLM"}
            />
            <StatCard
              label="Assets"
              value={portfolio ? String(portfolio.assetCount) : "—"}
              loading={isLoading}
              hint="Distinct asset balances"
            />
            <StatCard
              label="Account"
              value={portfolio ? truncateAddress(portfolio.address) : "—"}
              loading={isLoading}
              hint="Watched address"
            />
          </div>

          {isError && (
            <p className="bg-danger-soft text-danger rounded-xl px-4 py-3 text-sm">
              Could not load this account. Check the address and network, then try again.
            </p>
          )}

          {/* Allocation + Balances */}
          <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
            <Card className="p-6">
              <h2 className="font-display text-base font-semibold">Allocation</h2>
              <p className="text-foreground-faint mt-1 text-xs">By portfolio value (XLM)</p>
              <div className="mt-4">
                <AllocationDonut data={allocationData} />
              </div>
            </Card>
            <BalanceTable balances={portfolio?.balances ?? []} loading={isLoading} />
          </div>

          {/* Trade history */}
          <TradeHistory entries={history ?? []} loading={historyLoading} showExplorer />
        </div>
      )}

      {!activeAddress && (
        <Card className="border-dashed p-10 text-center">
          <p className="font-display text-lg font-semibold">Watch any Stellar account</p>
          <p className="text-foreground-muted mx-auto mt-2 max-w-md text-sm">
            Paste a public key above to see its portfolio valuation, asset allocation, and complete
            trading history — all powered by live Horizon data.
          </p>
        </Card>
      )}
    </div>
  );
}
