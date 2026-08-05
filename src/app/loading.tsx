import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Spinner className="h-8 w-8 text-primary" />
      <p className="text-sm text-foreground-faint animate-pulse">
        Loading TarshishDEX&hellip;
      </p>
    </div>
  );
}
