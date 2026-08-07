"use client";

import { useRef, useState, useEffect } from "react";
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
 */
export function TransitionHeight({ children, show, duration = 300, className }: TransitionHeightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">(0);
  const [mounted, setMounted] = useState(show);

  useEffect(() => {
    if (show) {
      // Defer mount state update to the next frame so it isn't called
      // synchronously in the effect body.
      requestAnimationFrame(() => {
        setMounted(true);
        // After mount, read the DOM height and transition in.
        requestAnimationFrame(() => {
          if (ref.current) setHeight(ref.current.scrollHeight);
        });
      });
    } else {
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
