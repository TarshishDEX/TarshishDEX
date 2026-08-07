import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/stellar/queries", () => ({
  useMarketStats: () => ({ data: null, isLoading: false, isError: false }),
}));

vi.mock("@/components/providers/live-sync-hooks", () => ({
  useLiveMarketStream: () => {},
}));

describe("MarketTable", () => {
  it("shows empty state when no markets", async () => {
    const { MarketTable } = await import("@/components/markets/market-table");
    render(<MarketTable />);
    expect(screen.getByText("Top Markets")).toBeInTheDocument();
    expect(screen.getByText("No active XLM markets")).toBeInTheDocument();
  });

  it("renders table headers", async () => {
    const { MarketTable } = await import("@/components/markets/market-table");
    render(<MarketTable />);
    expect(screen.getByText("Asset")).toBeInTheDocument();
  });

  it("shows auto-refresh indicator", async () => {
    const { MarketTable } = await import("@/components/markets/market-table");
    render(<MarketTable />);
    expect(screen.getByText(/Auto-refreshing/)).toBeInTheDocument();
  });
});
