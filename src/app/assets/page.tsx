import type { Metadata } from "next";
import { AssetBrowser } from "@/components/assets/asset-browser";
import { getActiveNetwork } from "@/lib/stellar/config";

export const metadata: Metadata = { title: "Assets" };

export default function AssetsPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-foreground-muted mt-2">
            Discover Stellar assets — browse issuers, trustline counts, supply, and authorization
            flags across the ecosystem.
          </p>
        </div>
        <span className="border-border bg-surface text-foreground-muted rounded-full border px-3 py-1.5 text-xs font-medium">
          Live on {getActiveNetwork().label}
        </span>
      </div>
      <div className="mt-8">
        <AssetBrowser />
      </div>
    </section>
  );
}
