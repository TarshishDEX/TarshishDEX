import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PagePlaceholderProps {
  title: string;
  description: string;
  phase: string;
  className?: string;
}

export function PagePlaceholder({ title, description, phase, className }: PagePlaceholderProps) {
  return (
    <section className={cn("mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8", className)}>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-foreground-muted mt-2 max-w-2xl">{description}</p>
        </div>
        <Badge tone="accent">Phase {phase}</Badge>
      </div>
      <div className="glass-card mt-8 flex min-h-[24rem] flex-col items-center justify-center rounded-2xl border-dashed text-center">
        <div className="animate-pulse-glow bg-primary-soft font-display text-primary flex h-14 w-14 items-center justify-center rounded-2xl text-2xl">
          ⚓
        </div>
        <h2 className="font-display mt-6 text-xl font-semibold">{title} — coming online</h2>
        <p className="text-foreground-muted mt-2 max-w-md text-sm">
          This module is under active construction. The full experience arrives in the next build
          phase.
        </p>
      </div>
    </section>
  );
}
