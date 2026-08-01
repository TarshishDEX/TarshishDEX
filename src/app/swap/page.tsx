import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/ui/page-placeholder";

export const metadata: Metadata = { title: "Swap" };

export default function SwapPage() {
  return (
    <PagePlaceholder
      title="Swap"
      description="Swap Stellar assets through the native DEX with intelligent routing, slippage protection, and pre-execution simulation."
      phase="2"
    />
  );
}
