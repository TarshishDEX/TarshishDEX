import type { Metadata } from "next";
import { PortfolioWidget } from "@/components/portfolio/portfolio-widget";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <PortfolioWidget />
    </section>
  );
}
