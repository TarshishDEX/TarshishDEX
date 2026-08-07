export default function OrdersLoading() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-6">
        <div className="bg-foreground/10 h-8 w-48 rounded" />
        <div className="bg-foreground/5 h-4 w-96 rounded" />
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="bg-surface border-border space-y-4 rounded-2xl border p-6">
            <div className="bg-foreground/10 h-6 w-32 rounded" />
            <div className="bg-foreground/5 h-10 w-full rounded-xl" />
            <div className="bg-foreground/5 h-12 w-full rounded-xl" />
            <div className="bg-foreground/5 h-12 w-full rounded-xl" />
            <div className="bg-foreground/5 h-12 w-full rounded-xl" />
          </div>
          <div className="bg-surface border-border space-y-3 rounded-2xl border p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-foreground/5 h-12 w-full rounded" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
