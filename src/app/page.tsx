import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

const FEATURES = [
  {
    title: "Native DEX Swaps",
    description:
      "Execute trades directly through Stellar's built-in decentralized exchange — no bridges, no wrapping, just fast and near-zero-cost settlement.",
    icon: "⇄",
  },
  {
    title: "Intelligent Routing",
    description:
      "Path-finding across the Stellar orderbook selects the most efficient execution route for every trade, minimizing cost and maximizing output.",
    icon: "◈",
  },
  {
    title: "Liquidity Insights",
    description:
      "Orderbook depth, volume, and liquidity trends rendered in real time so you always know the market before you trade.",
    icon: "▥",
  },
  {
    title: "Transaction Simulation",
    description:
      "Preview expected output, price impact, and fees before broadcasting. Detect failed transactions before they ever hit the network.",
    icon: "✓",
  },
  {
    title: "Portfolio Intelligence",
    description:
      "Multi-account portfolio tracking with allocation, valuation, and trade history across all your Stellar assets.",
    icon: "◉",
  },
  {
    title: "Soroban Smart Contracts",
    description:
      "Modular Soroban contracts extend the platform with advanced order logic, analytics, and event-driven automation.",
    icon: "{}",
  },
];

export default function Home() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto w-full max-w-7xl px-4 pt-24 pb-20 sm:px-6 sm:pt-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="border-border bg-surface text-foreground-muted inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium">
              <span className="bg-accent h-1.5 w-1.5 rounded-full" />
              Built on the Stellar Network
            </span>
            <h1 className="font-display mt-6 text-4xl leading-tight font-bold tracking-tight sm:text-6xl">
              The trading gateway to the <span className="text-gradient">Stellar ecosystem</span>
            </h1>
            <p className="text-foreground-muted mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
              TarshishDEX is a complete decentralized trading platform on Stellar&apos;s native DEX
              — intelligent execution, liquidity transparency, portfolio analytics, and
              Soroban-powered automation. Fast. Transparent. Yours.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/swap"
                className="bg-primary-solid shadow-primary/25 hover:bg-primary-solid-hover hover:shadow-primary/40 w-full rounded-xl px-8 py-3.5 text-center text-sm font-semibold text-white shadow-lg transition-all duration-200 active:scale-[0.98] sm:w-auto"
              >
                Launch Swap
              </Link>
              <Link
                href="/markets"
                className="border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-elevated w-full rounded-xl border px-8 py-3.5 text-center text-sm font-semibold transition-all duration-200 active:scale-[0.98] sm:w-auto"
              >
                Explore Markets
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="glass-card group hover:border-border-strong rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="bg-primary-soft font-display text-primary group-hover:bg-primary-solid flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-colors duration-300 group-hover:text-white">
                {feature.icon}
              </div>
              <h2 className="font-display mt-4 text-lg font-semibold">{feature.title}</h2>
              <p className="text-foreground-muted mt-2 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="glass-card relative overflow-hidden rounded-3xl p-10 text-center sm:p-16">
          <div className="bg-primary/15 pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full blur-3xl" />
          <LogoMark className="mx-auto h-14 w-14" />
          <h2 className="font-display mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Trade the native DEX. Own your orders.
          </h2>
          <p className="text-foreground-muted mx-auto mt-4 max-w-xl">
            Connect your wallet and start trading Stellar assets with full transparency — every
            quote, impact, and fee shown before you confirm.
          </p>
          <div className="mt-8">
            <Link
              href="/swap"
              className="bg-primary-solid shadow-primary/25 hover:bg-primary-solid-hover inline-block rounded-xl px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 active:scale-[0.98]"
            >
              Start Trading
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
