import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MarketTable } from "@/components/markets/market-table";

const useMarketStatsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/stellar/queries", () => ({
  useMarketStats: () => useMarketStatsMock(),
}));
vi.mock("@/components/providers/live-sync-hooks", () => ({
  useLiveMarketStream: () => {},
}));

const STATS = {
  data: [
    {
      token: { code: "USDC", name: "USD Coin" },
      priceInXlm: 0.5,
      change24hPct: 1.2,
      volume24hXlm: 1000,
      bestBid: 0.49,
      bestAsk: 0.51,
    },
  ],
  isLoading: false,
  isError: false,
};

describe("MarketTable metric tooltips", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useMarketStatsMock.mockReturnValue(STATS);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders an info icon next to each metric column header", () => {
    render(<MarketTable />);
    expect(screen.getByRole("img", { name: /latest market price/i })).toBeTruthy();
    expect(screen.getByRole("img", { name: /percentage price change/i })).toBeTruthy();
    expect(screen.getByRole("img", { name: /total trading volume/i })).toBeTruthy();
    expect(screen.getByRole("img", { name: /best bid \(highest buy price\)/i })).toBeTruthy();
  });

  it("reveals the explanation tooltip on hover", () => {
    render(<MarketTable />);
    fireEvent.mouseEnter(screen.getByRole("img", { name: /total trading volume/i }));
    act(() => vi.advanceTimersByTime(310));
    expect(screen.getByRole("tooltip").textContent).toContain("last 24 hours");
  });

  it("keeps column sort working with the icons present", () => {
    render(<MarketTable />);
    fireEvent.click(screen.getByText("24h Change"));
    expect(screen.getByText("USDC")).toBeTruthy();
  });
});
