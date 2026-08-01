import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/ui/page-placeholder";

export const metadata: Metadata = { title: "Assets" };

export default function AssetsPage() {
  return (
    <PagePlaceholder
      title="Assets"
      description="Discover Stellar assets — search, filter, and inspect issuers, trustlines, and market data across the ecosystem."
      phase="3"
    />
  );
}
