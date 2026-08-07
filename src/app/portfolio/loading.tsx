export default function PortfolioLoading() {
  return (
    <section className="mx-auto w-full max-w-7xl animate-pulse px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Account stats row */}
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface border-border h-28 rounded-2xl border" />
          ))}
        </div>
        {/* Allocation chart + balance table */}
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="bg-surface border-border h-72 rounded-2xl border" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface border-border flex items-center gap-4 rounded-xl border p-4"
              >
                <div className="bg-foreground/10 h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="bg-foreground/10 h-4 w-20 rounded" />
                  <div className="bg-foreground/5 h-3 w-12 rounded" />
                </div>
                <div className="bg-foreground/10 h-4 w-24 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
