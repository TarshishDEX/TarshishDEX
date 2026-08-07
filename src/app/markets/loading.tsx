export default function MarketsLoading() {
  return (
    <section className="mx-auto w-full max-w-7xl animate-pulse px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="bg-foreground/10 h-9 w-32 rounded" />
          <div className="bg-foreground/5 h-4 w-72 rounded" />
        </div>
        <div className="bg-foreground/5 h-7 w-28 rounded-full" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface border-border flex items-center gap-4 rounded-xl border p-4"
            >
              <div className="bg-foreground/10 h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="bg-foreground/10 h-4 w-24 rounded" />
                <div className="bg-foreground/5 h-3 w-16 rounded" />
              </div>
              <div className="bg-foreground/10 h-4 w-20 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-surface border-border h-96 rounded-2xl border" />
      </div>
    </section>
  );
}
