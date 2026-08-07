import type { Metadata } from "next";
import { LimitOrderForm } from "@/components/orders/limit-order-form";
import { LimitOrderTable } from "@/components/orders/limit-order-table";
import { getActiveNetwork } from "@/lib/stellar/config";

export const metadata: Metadata = { title: "Limit Orders" };

export default function OrdersPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Limit Orders</h1>
          <p className="text-foreground-muted mt-2">
            Place price-conditional orders stored on-chain via Soroban. Set a target price and let
            the market come to you — no need to watch charts all day.
          </p>
        </div>
        <span className="border-border bg-surface text-foreground-muted rounded-full border px-3 py-1.5 text-xs font-medium">
          {getActiveNetwork().label}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <LimitOrderForm />
        </div>
        <LimitOrderTable />
      </div>
    </section>
  );
}
