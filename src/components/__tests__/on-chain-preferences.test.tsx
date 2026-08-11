import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnChainPreferences } from "@/components/swap/on-chain-preferences";

// Mock wallet store — disconnected
vi.mock("@/lib/stellar/wallet-store", () => ({
  useWallet: () => ({
    address: null,
    status: "disconnected" as const,
  }),
}));

// Mock React Query
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: null, isLoading: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

// Mock soroban config — contract deployed
vi.mock("@/lib/soroban/config", () => ({
  getTradingPreferencesContractId: () => "CDEF...",
}));

// Mock soroban calls
vi.mock("@/lib/soroban/trading-preferences", () => ({
  readTradingPreferences: vi.fn(),
  writeTradingPreferences: vi.fn(),
}));

// Mock stellar config
vi.mock("@/lib/stellar/config", () => ({
  explorerTxUrl: (hash: string) => `https://stellar.expert/tx/${hash}`,
}));

// Mock toast
vi.mock("@/components/ui/toast", () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

describe("OnChainPreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows connect prompt when wallet disconnected", () => {
    render(<OnChainPreferences />);
    expect(
      screen.getByText(/Connect your wallet/)
    ).toBeDefined();
  });

  it("shows Contract ready badge", () => {
    render(<OnChainPreferences />);
    expect(screen.getByText("Contract ready")).toBeDefined();
  });

  it("shows connect prompt for disconnected wallet (no form)", () => {
    render(<OnChainPreferences />);
    // When disconnected, the form fields are NOT rendered
    expect(screen.getByText(/Connect your wallet/)).toBeDefined();
    // Routing buttons and save should NOT appear in disconnected state
    expect(screen.queryByText("Save on-chain")).toBeNull();
  });
});
