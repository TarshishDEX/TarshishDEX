import type { Metadata } from "next";
import { PriceChartPanel } from "@/components/analytics/price-chart-panel";
import { getActiveNetwork } from "@/lib/stellar/config";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-foreground-muted mt-2">
            Historical price movement, trading volume, and market trends for Stellar pairs —
            interactive candlestick charts from live trade aggregations.
          </p>
        </div>
        <span className="border-border bg-surface text-foreground-muted rounded-full border px-3 py-1.5 text-xs font-medium">
          Live on {getActiveNetwork().label}
        </span>
      </div>
      <div className="mt-8">
        <PriceChartPanel />
      </div>
    </section>
  );
}
