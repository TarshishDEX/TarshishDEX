import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const RESOURCES = [
  { href: "/docs", label: "Documentation" },
  { href: "/analytics", label: "Market Analytics" },
  { href: "/api", label: "Developer API" },
  { href: "https://github.com/TarshishDEX/TarshishDEX", label: "GitHub", external: true },
  { href: "https://developers.stellar.org", label: "Stellar Docs", external: true },
  { href: "https://stellar.expert", label: "StellarExpert", external: true },
];

export function Footer() {
  return (
    <footer className="border-border bg-background/60 mt-auto border-t">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-3">
            <Logo />
            <p className="text-foreground-muted text-sm leading-relaxed">
              A production-grade decentralized trading interface built exclusively on Stellar&apos;s
              native DEX and Soroban smart contracts.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-12 gap-y-2 sm:grid-cols-1" aria-label="Footer">
            {RESOURCES.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="text-foreground-muted hover:text-foreground text-sm transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-border text-foreground-faint mt-10 flex flex-col gap-2 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} TarshishDEX. Built on the Stellar Network.</p>
          <p className="font-mono">Stellar DEX · Soroban Smart Contracts · Testnet</p>
        </div>
      </div>
    </footer>
  );
}
