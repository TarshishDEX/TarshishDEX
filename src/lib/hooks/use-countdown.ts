"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Countdown timer hook. Counts down from `seconds` to 0.
 * Returns remaining seconds, a formatted string, and isComplete boolean.
 */
export function useCountdown(seconds: number, onComplete?: () => void) {
  const [remaining, setRemaining] = useState(seconds);
  // Derive isComplete from remaining instead of tracking it separately
  // with a setState inside an effect (which triggers cascading renders).
  const isComplete = remaining <= 0;

  useEffect(() => {
    if (remaining <= 0) {
      onComplete?.();
      return;
    }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining, onComplete]);

  const reset = useCallback((newSeconds?: number) => {
    setRemaining(newSeconds ?? seconds);
  }, [seconds]);

  const formatted = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;

  return { remaining, formatted, isComplete, reset };
}
