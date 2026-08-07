import { cn } from "@/lib/utils";

type TxStatus = "pending" | "success" | "failed";

interface TransactionStatusIconProps {
  status: TxStatus;
  className?: string;
}

const statusMap: Record<TxStatus, { bg: string; icon: string }> = {
  pending: { bg: "bg-warning/20", icon: "animate-spin-slow" },
  success: { bg: "bg-success/20", icon: "" },
  failed: { bg: "bg-danger/20", icon: "" },
};

export function TransactionStatusIcon({ status, className }: TransactionStatusIconProps) {
  const config = statusMap[status];

  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-full",
        config.bg,
        className
      )}
    >
      {status === "pending" && (
        <svg
          className="text-warning h-3 w-3 animate-spin"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="10"
            cy="10"
            r="8"
            stroke="currentColor"
            strokeWidth="2"
            className="opacity-30"
          />
          <path
            fill="currentColor"
            d="M10 2a8 8 0 017.3 4.7"
            className="opacity-80"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
      {status === "success" && (
        <svg
          className="text-success h-3 w-3"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {status === "failed" && (
        <svg
          className="text-danger h-3 w-3"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </span>
  );
}
