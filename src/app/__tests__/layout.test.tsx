import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

// Mock fonts — next/font/google is heavy and network-dependent in tests.
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
  JetBrains_Mono: () => ({ variable: "--font-jetbrains-mono" }),
  Space_Grotesk: () => ({ variable: "--font-space-grotesk" }),
}));

vi.mock("@/components/layout/header", () => ({
  Header: () => <header data-testid="header">Header</header>,
}));
vi.mock("@/components/layout/footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));
vi.mock("@/components/providers/query-provider", () => ({
  QueryProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/providers/wallet-provider", () => ({
  WalletProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/ui/error-boundary", () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/ui/scroll-to-top", () => ({
  ScrollToTop: () => null,
}));
vi.mock("@/components/ui/skip-link", () => ({
  SkipLink: () => null,
}));
vi.mock("@/components/ui/toast", () => ({
  ToastViewport: () => null,
}));
vi.mock("@/components/ui/sw-registrar", () => ({
  SWRegistrar: () => null,
}));
vi.mock("@/lib/theme", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/lib/analytics", () => ({
  Analytics: () => null,
}));

import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("renders header, footer, and children", () => {
    render(
      <RootLayout>
        <main data-testid="page-content">Page body</main>
      </RootLayout>,
    );
    expect(screen.getByTestId("header")).toBeTruthy();
    expect(screen.getByTestId("footer")).toBeTruthy();
    expect(screen.getByText("Page body")).toBeTruthy();
  });

  it("exports metadata and viewport", async () => {
    const layout = await import("@/app/layout");
    expect(layout.metadata.title.default).toContain("TarshishDEX");
    expect(layout.viewport.themeColor).toBe("#06090f");
  });
});
