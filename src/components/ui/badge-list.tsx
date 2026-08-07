import { Badge, type BadgeProps } from "@/components/ui/badge";

interface BadgeListProps {
  items: { label: string; tone?: BadgeProps["tone"] }[];
  max?: number;
  className?: string;
}

/**
 * Renders an array of badges, showing "+N more" when exceeding max.
 */
export function BadgeList({ items, max = 3, className }: BadgeListProps) {
  const visible = items.slice(0, max);
  const remaining = items.length - max;

  return (
    <span className={`flex flex-wrap gap-1 ${className ?? ""}`}>
      {visible.map((item, i) => (
        <Badge key={i} tone={item.tone}>
          {item.label}
        </Badge>
      ))}
      {remaining > 0 && <Badge tone="neutral">+{remaining} more</Badge>}
    </span>
  );
}
