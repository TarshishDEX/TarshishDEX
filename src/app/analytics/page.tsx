import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/ui/page-placeholder";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <PagePlaceholder
      title="Analytics"
      description="Market trends, trading volume, asset performance, and historical charts with interactive visualizations."
      phase="3"
    />
  );
}
