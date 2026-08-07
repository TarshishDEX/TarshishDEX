"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PriceImpactBadgeProps {
  impactPct: number;
  className?: string;
}

type ImpactLevel = "low" | "medium" | "high" | "critical";

function getImpactLevel(pct: number): ImpactLevel {
  if (pct <= 0) return "low";
  if (pct <= 0.5) return "low";
  if (pct <= 1) return "medium";
  if (pct <= 5) return "high";
  return "critical";
}

const IMPACT_STYLES: Record<
  ImpactLevel,
  { tone: "success" | "warning" | "danger"; label: string }
> = {
  low: { tone: "success", label: "Low impact" },
  medium: { tone: "success", label: "Medium impact" },
  high: { tone: "warning", label: "High impact" },
  critical: { tone: "danger", label: "Critical" },
};

/**
 * Visual badge showing the price impact level with color coding.
 * Low (<0.5%), Medium (<1%), High (<5%), Critical (>5%).
 */
export function PriceImpactBadge({ impactPct, className }: PriceImpactBadgeProps) {
  const level = getImpactLevel(impactPct);
  const { tone, label } = IMPACT_STYLES[level];

  return (
    <Badge tone={tone} dot className={cn("font-semibold tabular-nums", className)}>
      {label} ({impactPct.toFixed(2)}%)
    </Badge>
  );
}
