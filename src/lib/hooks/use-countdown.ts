"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Countdown timer hook. Counts down from `seconds` to 0.
 * Returns remaining seconds, a formatted string, and isComplete boolean.
 */
export function useCountdown(seconds: number, onComplete?: () => void) {
  const [remaining, setRemaining] = useState(seconds);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (remaining <= 0) {
      setIsComplete(true);
      onComplete?.();
      return;
    }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining, onComplete]);

  const reset = useCallback((newSeconds?: number) => {
    setRemaining(newSeconds ?? seconds);
    setIsComplete(false);
  }, [seconds]);

  const formatted = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;

  return { remaining, formatted, isComplete, reset };
}
