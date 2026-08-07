"use client";

import { Spinner } from "@/components/ui/spinner";

/** Global loading fallback shown during page transitions and Suspense. */
export default function GlobalLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
