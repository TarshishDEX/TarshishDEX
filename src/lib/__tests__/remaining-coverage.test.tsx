import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NetworkIndicator } from "@/components/ui/network-indicator";
import { Analytics } from "@/lib/analytics";
import { useWhyDidYouUpdate } from "@/lib/hooks/use-why-did-you-update";
import { usePortfolioPnL } from "@/lib/hooks/use-portfolio-pnl";
import { useTokenBalance } from "@/lib/hooks/use-token-balance";
import type { AccountBalance } from "@/lib/stellar/account";

// Mock Vercel analytics
vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => null,
}));
vi.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => null,
}));

// Mock Horizon
vi.mock("@/lib/stellar/horizon", () => ({
  getHorizonServer: vi.fn(() => ({
    accounts: () => ({
      accountId: () => ({
        call: () =>
          Promise.resolve({
            balances: [
              { asset_type: "native", balance: "100.0000000" },
              {
                asset_type: "credit_alphanum4",
                asset_code: "USDC",
                asset_issuer: "GA5Z",
                balance: "50.0000000",
              },
            ],
          }),
      }),
    }),
  })),
}));
vi.mock("@/lib/stellar/account", () => ({
  isValidPublicKey: vi.fn((addr: string) => addr.length === 56),
}));

// =========================================================================
// NetworkIndicator
// =========================================================================
describe("NetworkIndicator", () => {
  beforeEach(() => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
  });

  it("shows Online by default", () => {
    render(<NetworkIndicator />);
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("shows Offline when navigator is offline", () => {
    Object.defineProperty(navigator, "onLine", { writable: true, value: false });
    render(<NetworkIndicator />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<NetworkIndicator className="my-net" />);
    // The outermost span should have the custom class
    const outerSpan = container.firstChild as HTMLElement;
    expect(outerSpan).toHaveClass("my-net");
  });
});

// =========================================================================
// Analytics
// =========================================================================
describe("Analytics", () => {
  it("returns null in non-production", () => {
    const { container } = render(<Analytics />);
    expect(container.firstChild).toBeNull();
  });
});

// =========================================================================
// useWhyDidYouUpdate
// =========================================================================
describe("useWhyDidYouUpdate", () => {
  it("does not throw with empty props on first render", () => {
    const { result } = renderHook(() => useWhyDidYouUpdate("Test", { a: 1 }));
    expect(result.current).toBeUndefined();
  });

  it("handles changing props without throwing", () => {
    const { rerender } = renderHook((props) => useWhyDidYouUpdate("Test", props), {
      initialProps: { a: 1, b: "hello" },
    });
    rerender({ a: 2, b: "hello" });
    // Should not throw
  });

  it("handles new keys being added", () => {
    const initial: Record<string, unknown> = { x: 1 };
    const { rerender } = renderHook(
      (props: Record<string, unknown>) => useWhyDidYouUpdate("Test", props),
      { initialProps: initial }
    );
    rerender({ x: 1, y: 2 });
    // Should not throw
  });
});

// =========================================================================
// usePortfolioPnL
// =========================================================================
describe("usePortfolioPnL", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockBalances: AccountBalance[] = [
    {
      token: { code: "XLM", name: "Lumen", decimals: 7, isNative: true },
      balance: 100,
      valueInXlm: 100,
      trustline: false,
    },
    {
      token: {
        code: "USDC",
        issuer: "GA5Z",
        name: "USD Coin",
        decimals: 7,
        isNative: false,
      },
      balance: 50,
      valueInXlm: 500,
      trustline: true,
    },
  ];

  it("returns pnlByAsset array", () => {
    const { result } = renderHook(() => usePortfolioPnL(mockBalances));
    expect(result.current.pnlByAsset).toHaveLength(2);
    expect(result.current.totalPnl).toBe(0); // No cost basis set
  });

  it("returns setCostBasis function", () => {
    const { result } = renderHook(() => usePortfolioPnL(mockBalances));
    expect(typeof result.current.setCostBasis).toBe("function");
  });

  it("calculates PnL when cost basis is set", () => {
    localStorage.setItem(
      "tarshishdex-cost-basis",
      JSON.stringify({ XLM: { totalCostXlm: 90, totalAmount: 100 } })
    );
    const { result } = renderHook(() => usePortfolioPnL(mockBalances));
    // PnL = 100 - (90/100)*100 = 10
    expect(result.current.pnlByAsset[0]?.pnl).toBeCloseTo(10);
  });

  it("handles empty balances array", () => {
    const { result } = renderHook(() => usePortfolioPnL([]));
    expect(result.current.pnlByAsset).toHaveLength(0);
    expect(result.current.totalPnl).toBe(0);
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem("tarshishdex-cost-basis", "not-json");
    const { result } = renderHook(() => usePortfolioPnL(mockBalances));
    expect(result.current.pnlByAsset).toHaveLength(2);
  });
});

// =========================================================================
// useTokenBalance
// =========================================================================
describe("useTokenBalance", () => {
  const validKey = "G" + Array(55).fill("A").join("");
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("returns loading state when enabled", () => {
    const { result } = renderHook(
      () =>
        useTokenBalance(validKey, {
          code: "XLM",
          isNative: true,
        }),
      { wrapper }
    );
    expect(result.current.isLoading).toBe(true);
  });

  it("is disabled when address is invalid", () => {
    const { result } = renderHook(
      () =>
        useTokenBalance("bad", {
          code: "XLM",
          isNative: true,
        }),
      { wrapper }
    );
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("is disabled when asset is null", () => {
    const { result } = renderHook(() => useTokenBalance(validKey, null), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
