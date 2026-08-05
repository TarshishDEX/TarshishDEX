"use client";

import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";
import { cn, truncateAddress } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

interface AddressDisplayProps {
  address: string;
  truncate?: boolean;
  lead?: number;
  tail?: number;
  className?: string;
}

/**
 * Renders a Stellar address with a one-click copy button.
 * Shows a checkmark briefly after copying. Truncates by default.
 */
export function AddressDisplay({
  address,
  truncate = true,
  lead = 6,
  tail = 6,
  className,
}: AddressDisplayProps) {
  const { copy, copied } = useCopyToClipboard();
  const display = truncate ? truncateAddress(address, lead, tail) : address;

  return (
    <Tooltip content={copied ? "Copied!" : "Click to copy address"}>
      <button
        type="button"
        onClick={() => copy(address)}
        className={cn(
          "inline-flex items-center gap-1.5 font-mono text-sm transition-colors hover:text-primary",
          className
        )}
        aria-label={`Copy address ${address}`}
      >
        <span>{display}</span>
        <svg
          className={cn("h-3.5 w-3.5 shrink-0 transition-all", copied && "text-success")}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          {copied ? (
            <path d="M5 10l3.5 3.5L15 7" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <>
              <rect x="6" y="6" width="11" height="11" rx="2" />
              <path d="M3 14V5a2 2 0 012-2h9" strokeLinecap="round" />
            </>
          )}
        </svg>
      </button>
    </Tooltip>
  );
}
