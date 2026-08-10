"use client";

import { useRef, useState, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";

interface TransitionHeightProps {
  children: React.ReactNode;
  show: boolean;
  duration?: number;
  className?: string;
}

/**
 * Animate height changes when children mount/unmount.
 * Uses a ref-based approach for smooth CSS transitions.
 * useLayoutEffect is used here because we need to measure DOM
 * dimensions synchronously before the browser paints.
 */
export function TransitionHeight({
  children,
  show,
  duration = 300,
  className,
}: TransitionHeightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">(0);
  const [mounted, setMounted] = useState(show);

  useLayoutEffect(() => {
    if (show) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      // Measure DOM after the mount state update flushes.
      if (ref.current) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHeight(ref.current.scrollHeight);
      }
      return;
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHeight(0);
      const timer = setTimeout(() => setMounted(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!mounted) return null;

  return (
    <div
      ref={ref}
      className={cn("overflow-hidden transition-all", className)}
      style={{
        maxHeight: height === "auto" ? "9999px" : `${height}px`,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}
