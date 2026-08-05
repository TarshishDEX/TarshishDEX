import type { Metadata } from "next";
import { MarketTable } from "@/components/markets/market-table";
import { OrderbookDepth } from "@/components/markets/orderbook-depth";
import { getActiveNetwork } from "@/lib/stellar/config";

export const metadata: Metadata = { title: "Markets" };

const DEFAULT_USDC = {
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};

export default function MarketsPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Markets</h1>
          <p className="text-foreground-muted mt-2">
            Live pricing, volume, and liquidity for the most traded Stellar assets — quoted against
            XLM on the native DEX.
          </p>
        </div>
        <span className="border-border bg-surface text-foreground-muted rounded-full border px-3 py-1.5 text-xs font-medium">
          Network: {getActiveNetwork().label}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <MarketTable />
        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderbookDepth base={{ code: "XLM", isNative: true }} counter={DEFAULT_USDC} />
        </div>
      </div>
    </section>
  );
}
