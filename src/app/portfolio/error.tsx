"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PortfolioError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[portfolio] Unhandled route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-2xl font-semibold">Portfolio failed to load</h1>
      <p className="text-foreground-muted max-w-md text-sm">
        Could not load your portfolio data. Check your connection and try again.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-primary-solid text-white hover:bg-primary-solid-hover rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border-border hover:bg-surface-elevated rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
