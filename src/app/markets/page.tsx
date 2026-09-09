"use client";

import { useState } from "react";
import { MarketTable } from "@/components/markets/market-table";
import { OrderbookDepth } from "@/components/markets/orderbook-depth";
import { getActiveNetwork } from "@/lib/stellar/config";
import type { StellarAsset } from "@/lib/stellar/types";

const DEFAULT_USDC: StellarAsset = {
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};

const DEFAULT_PAIR = {
  base: { code: "XLM", isNative: true } as StellarAsset,
  counter: DEFAULT_USDC,
};

export default function MarketsPage() {
  const [pair, setPair] = useState(DEFAULT_PAIR);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Markets</h1>
          <p className="text-foreground-muted mt-2">
            Live pricing, volume, and liquidity for the most traded Stellar assets — quoted against
            XLM on the native DEX. Click a market to load its orderbook depth.
          </p>
        </div>
        <span className="border-border bg-surface text-foreground-muted rounded-full border px-3 py-1.5 text-xs font-medium">
          Network: {getActiveNetwork().label}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <MarketTable onSelectPair={setPair} />
        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderbookDepth base={pair.base} counter={pair.counter} />
        </div>
      </div>
    </section>
  );
}
