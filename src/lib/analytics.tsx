"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Client-only analytics wrapper. Renders Vercel Analytics and Speed Insights
 * only in production to avoid skewing development data.
 *
 * Usage: add <Analytics /> to the root layout.
 */
export function Analytics() {
  if (process.env.NODE_ENV !== "production") return null;
  return (
    <>
      <VercelAnalytics />
      <SpeedInsights />
    </>
  );
}
