import { cn } from "@/lib/utils";

/**
 * Three animated dots for inline loading states.
 * Each dot pulses with a staggered delay for a smooth wave effect.
 */
export function LoadingDots({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label="Loading" role="status">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="bg-current inline-block h-1 w-1 rounded-full opacity-40"
          style={{
            animation: `pulse-glow 1.2s ${i * 0.2}s ease-in-out infinite`,
          }}
        />
      ))}
    </span>
  );
}
