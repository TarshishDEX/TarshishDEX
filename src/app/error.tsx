"use client";

import { useEffect } from "react";
import { Logo } from "@/components/brand/logo";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Unhandled route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo className="h-10 w-auto opacity-60" />
      <div>
        <p className="font-mono text-6xl font-bold text-red-500/20">500</p>
        <h1 className="font-display text-foreground mt-2 text-2xl font-semibold">
          Something went wrong
        </h1>
        <p className="text-foreground-faint mt-2 max-w-md text-sm">
          An unexpected error occurred. The issue has been logged and we&apos;ll investigate. Try
          refreshing or going back.
        </p>
        {error.digest && (
          <p className="text-foreground/30 mt-1 font-mono text-xs">Error ID: {error.digest}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
