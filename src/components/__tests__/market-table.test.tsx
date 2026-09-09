import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/lib/stellar/queries", () => ({
  useMarketStats: vi.fn(() => ({ data: null, isLoading: false, isError: false })),
}));

import { useMarketStats } from "@/lib/stellar/queries";
import type { MarketStats } from "@/lib/stellar/types";

const SAMPLE_STATS: MarketStats[] = [
  {
    token: {
      code: "EURMTL",
      issuer: "GACKTN5DAZGWXRWB2WLM6OPBDHAMT6SJNGLJZPQMEZBUR4JUGBX2UK7V",
      name: "EURMTL",
      decimals: 7,
    },
    priceInXlm: 1.5,
    volume24hXlm: 150,
    change24hPct: 5,
    bestBid: 1.4,
    bestAsk: 1.6,
  },
];

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

  it("shows empty state message when no market data", async () => {
    const { MarketTable } = await import("@/components/markets/market-table");
    render(<MarketTable />);
    // Null data triggers the empty state, not the table headers
    expect(screen.getByText("Top Markets")).toBeInTheDocument();
    expect(screen.getByText("No active XLM markets")).toBeInTheDocument();
  });

  it("shows auto-refresh indicator", async () => {
    const { MarketTable } = await import("@/components/markets/market-table");
    render(<MarketTable />);
    expect(screen.getByText(/Auto-refreshing/)).toBeInTheDocument();
  });

  it("calls onSelectPair with the clicked market's pair", async () => {
    vi.mocked(useMarketStats).mockReturnValue({
      data: SAMPLE_STATS,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useMarketStats>);
    const onSelectPair = vi.fn();
    const { MarketTable } = await import("@/components/markets/market-table");
    render(<MarketTable onSelectPair={onSelectPair} />);

    fireEvent.click(screen.getByRole("button", { name: /Show depth for EURMTL\/XLM/ }));

    expect(onSelectPair).toHaveBeenCalledWith({
      base: { code: "XLM", isNative: true },
      counter: {
        code: "EURMTL",
        issuer: "GACKTN5DAZGWXRWB2WLM6OPBDHAMT6SJNGLJZPQMEZBUR4JUGBX2UK7V",
      },
    });
  });

  it("selects the market pair with the keyboard", async () => {
    vi.mocked(useMarketStats).mockReturnValue({
      data: SAMPLE_STATS,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useMarketStats>);
    const onSelectPair = vi.fn();
    const { MarketTable } = await import("@/components/markets/market-table");
    render(<MarketTable onSelectPair={onSelectPair} />);

    fireEvent.keyDown(screen.getByRole("button", { name: /Show depth for EURMTL\/XLM/ }), {
      key: "Enter",
    });
    expect(onSelectPair).toHaveBeenCalledTimes(1);
  });
});
