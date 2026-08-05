export default function MarketsLoading() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-9 w-32 rounded bg-foreground/10" />
          <div className="h-4 w-72 rounded bg-foreground/5" />
        </div>
        <div className="h-7 w-28 rounded-full bg-foreground/5" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl bg-surface border border-border p-4">
              <div className="h-8 w-8 rounded-full bg-foreground/10" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-24 rounded bg-foreground/10" />
                <div className="h-3 w-16 rounded bg-foreground/5" />
              </div>
              <div className="h-4 w-20 rounded bg-foreground/10" />
            </div>
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-surface border border-border" />
      </div>
    </section>
  );
}
