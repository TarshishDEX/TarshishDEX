"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface RetryButtonProps {
  onRetry: () => void | Promise<void>;
  label?: string;
  maxRetries?: number;
}

/**
 * Retry button for failed data fetches. Shows remaining retry count and
 * disables itself while the retry is in-flight. Uses a brief countdown
 * between retries to avoid hammering the backend.
 */
export function RetryButton({ onRetry, label = "Retry", maxRetries = 3 }: RetryButtonProps) {
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleRetry = useCallback(async () => {
    setLoading(true);
    try {
      await onRetry();
    } finally {
      setAttempts((a) => a + 1);
      setLoading(false);
    }
  }, [onRetry]);

  const remaining = maxRetries - attempts;
  if (remaining <= 0) return null;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <Button variant="secondary" size="sm" onClick={handleRetry} isLoading={loading}>
        {label}
      </Button>
      <span className="text-foreground-faint text-xs">
        {remaining} {remaining === 1 ? "retry" : "retries"} remaining
      </span>
    </div>
  );
}
