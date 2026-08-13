import type { Metadata } from "next";
import { SwapWidget } from "@/components/swap/swap-widget";
import { OnChainPreferences } from "@/components/swap/on-chain-preferences";

export const metadata: Metadata = { title: "Swap" };

export default function SwapPage() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">Swap</h1>
      <div className="mt-6 w-full max-w-md space-y-6">
        <SwapWidget />
        <OnChainPreferences />
      </div>
    </section>
  );
}
