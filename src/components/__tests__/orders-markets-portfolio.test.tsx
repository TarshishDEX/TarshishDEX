import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { QueryProvider } from "@/components/providers/query-provider";
import { WalletProvider } from "@/components/providers/wallet-provider";

// Mock @creit.tech/stellar-wallets-kit
vi.mock("@creit.tech/stellar-wallets-kit", () => ({
  StellarWalletsKit: vi.fn(),
  WalletNetwork: { TESTNET: "TESTNET", PUBLIC: "PUBLIC" },
  allowAllModules: vi.fn(() => []),
}));

// ── QueryProvider ──────────────────────────────────────────────────────

describe("QueryProvider", () => {
  it("renders children", () => {
    const { container } = render(
      <QueryProvider>
        <span>child</span>
      </QueryProvider>
    );
    expect(container.textContent).toContain("child");
  });
});

// ── WalletProvider ─────────────────────────────────────────────────────

describe("WalletProvider", () => {
  it("renders children", () => {
    const { container } = render(
      <WalletProvider>
        <span>wallet child</span>
      </WalletProvider>
    );
    expect(container.textContent).toContain("wallet child");
  });
});
