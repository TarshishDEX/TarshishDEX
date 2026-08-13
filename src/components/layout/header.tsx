"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { NetworkIndicator } from "@/components/ui/network-indicator";
import { SkipLink } from "@/components/ui/skip-link";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/swap", label: "Swap" },
  { href: "/markets", label: "Markets" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/assets", label: "Assets" },
  { href: "/analytics", label: "Analytics" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-border bg-background/80 sticky top-0 z-50 border-b backdrop-blur-xl">
      <SkipLink />
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                    active
                      ? "bg-primary-soft text-foreground"
                      : "text-foreground-muted hover:bg-surface-elevated hover:text-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block">
            <NetworkIndicator />
          </span>
          <span className="border-border text-foreground-muted hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="bg-warning absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
              <span className="bg-warning relative inline-flex h-2 w-2 rounded-full" />
            </span>
            Testnet
          </span>
          <ConnectWalletButton />
          <MobileMenu />
        </div>
      </div>

      {/* Mobile navigation */}
      <nav
        className="border-border no-scrollbar flex items-center gap-1 overflow-x-auto border-t px-4 py-2 md:hidden"
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                active ? "bg-primary-soft text-foreground" : "text-foreground-muted"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
