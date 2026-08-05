import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata = {
  title: "404 — Page Not Found",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo className="h-10 w-auto opacity-60" />
      <div>
        <p className="font-mono text-8xl font-bold text-foreground/10">404</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-foreground">
          Page not found
        </h1>
        <p className="mt-2 max-w-md text-sm text-foreground-faint">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Check the URL or head back to the trading terminal.
        </p>
      </div>
      <Link
        href="/"
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
      >
        Back to TarshishDEX
      </Link>
    </div>
  );
}
