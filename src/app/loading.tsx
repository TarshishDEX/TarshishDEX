import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Spinner className="text-primary h-8 w-8" />
      <p className="text-foreground-faint animate-pulse text-sm">Loading TarshishDEX&hellip;</p>
    </div>
  );
}
