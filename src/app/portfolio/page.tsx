import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/ui/page-placeholder";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return (
    <PagePlaceholder
      title="Portfolio"
      description="Multi-account portfolio management — balances, allocation, valuation, performance, and complete trade history."
      phase="3"
    />
  );
}
