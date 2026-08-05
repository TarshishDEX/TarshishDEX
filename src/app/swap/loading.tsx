export default function SwapLoading() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 animate-pulse">
        {/* Swap form skeleton */}
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <div className="h-4 w-16 rounded bg-foreground/10" />
          <div className="h-16 rounded-xl bg-foreground/5" />
          <div className="flex justify-center">
            <div className="h-10 w-10 rounded-full bg-foreground/10" />
          </div>
          <div className="h-16 rounded-xl bg-foreground/5" />
          <div className="h-12 w-full rounded-xl bg-foreground/10" />
        </div>
        {/* On-chain prefs skeleton */}
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-3">
          <div className="h-4 w-24 rounded bg-foreground/10" />
          <div className="h-3 w-full rounded bg-foreground/5" />
          <div className="h-3 w-3/4 rounded bg-foreground/5" />
        </div>
      </div>
    </section>
  );
}
