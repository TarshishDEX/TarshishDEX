export default function AnalyticsLoading() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-9 w-28 rounded bg-foreground/10" />
          <div className="h-4 w-96 rounded bg-foreground/5" />
        </div>
        <div className="h-7 w-28 rounded-full bg-foreground/5" />
      </div>
      <div className="mt-8">
        <div className="h-[32rem] rounded-2xl bg-surface border border-border" />
      </div>
    </section>
  );
}
