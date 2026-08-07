export default function SwapLoading() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md animate-pulse space-y-6">
        {/* Swap form skeleton */}
        <div className="bg-surface border-border space-y-4 rounded-2xl border p-5">
          <div className="bg-foreground/10 h-4 w-16 rounded" />
          <div className="bg-foreground/5 h-16 rounded-xl" />
          <div className="flex justify-center">
            <div className="bg-foreground/10 h-10 w-10 rounded-full" />
          </div>
          <div className="bg-foreground/5 h-16 rounded-xl" />
          <div className="bg-foreground/10 h-12 w-full rounded-xl" />
        </div>
        {/* On-chain prefs skeleton */}
        <div className="bg-surface border-border space-y-3 rounded-2xl border p-5">
          <div className="bg-foreground/10 h-4 w-24 rounded" />
          <div className="bg-foreground/5 h-3 w-full rounded" />
          <div className="bg-foreground/5 h-3 w-3/4 rounded" />
        </div>
      </div>
    </section>
  );
}
