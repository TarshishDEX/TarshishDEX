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

// Mock the wallet-kit facade so WalletProvider's subscribeWalletEvents doesn't
// dynamically import the real stellar-wallets-kit, whose Freighter module
// (`@stellar/freighter-api` v6) fails to load under Vitest's ESM loader.
vi.mock("@/lib/stellar/wallet-kit", () => ({
  subscribeWalletEvents: () => Promise.resolve(() => {}),
  isWalletAvailable: vi.fn().mockResolvedValue(true),
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
