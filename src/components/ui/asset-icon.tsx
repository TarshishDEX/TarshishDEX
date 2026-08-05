import { cn } from "@/lib/utils";
import type { Token } from "@/lib/stellar/types";

interface AssetIconProps {
  token: Token;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: "h-6 w-6 text-xs", md: "h-9 w-9 text-sm", lg: "h-12 w-12 text-base" };

export function AssetIcon({ token, size = "md", className }: AssetIconProps) {
  return (
    <span
      className={cn(
        "bg-surface-elevated inline-flex shrink-0 items-center justify-center rounded-lg font-semibold",
        sizeMap[size],
        className
      )}
      aria-label={token.code}
    >
      {token.icon ?? (token.isNative ? "⬡" : "◈")}
    </span>
  );
}
