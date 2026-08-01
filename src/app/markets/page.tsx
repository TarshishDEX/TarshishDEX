import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/ui/page-placeholder";

export const metadata: Metadata = { title: "Markets" };

export default function MarketsPage() {
  return (
    <PagePlaceholder
      title="Markets"
      description="Live market pricing, orderbook depth, volume, and liquidity trends for every Stellar trading pair."
      phase="2"
    />
  );
}
