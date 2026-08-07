export default function AnalyticsLoading() {
  return (
    <section className="mx-auto w-full max-w-7xl animate-pulse px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="bg-foreground/10 h-9 w-28 rounded" />
          <div className="bg-foreground/5 h-4 w-96 rounded" />
        </div>
        <div className="bg-foreground/5 h-7 w-28 rounded-full" />
      </div>
      <div className="mt-8">
        <div className="bg-surface border-border h-[32rem] rounded-2xl border" />
      </div>
    </section>
  );
}
