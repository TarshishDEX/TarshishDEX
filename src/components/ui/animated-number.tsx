"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  format?: (v: number) => string;
  durationMs?: number;
  className?: string;
}

/**
 * Animate a numeric value change with a brief flash highlight.
 * The number transitions to the new value over `durationMs` using
 * requestAnimationFrame for smooth interpolation.
 */
export function AnimatedNumber({
  value,
  format = (v) => v.toFixed(6),
  durationMs = 400,
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const [flash, setFlash] = useState(false);
  // Track the direction of the last change for flash styling.
  // Updated inside the effect, never read during render.
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const prevRef = useRef(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (prevRef.current === value) return;

    const start = prevRef.current;
    const startTime = performance.now();
    const isUp = value > start;

    setDirection(isUp ? "up" : "down");
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 600);

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // ease-out cubic
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(start + (value - start) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    prevRef.current = value;

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timer);
    };
  }, [value, durationMs]);

  return (
    <span
      className={cn(
        "tabular-nums transition-colors duration-300",
        flash && direction === "up" && "text-success",
        flash && direction === "down" && "text-danger",
        className
      )}
      aria-live="polite"
    >
      {format(display)}
    </span>
  );
}
