import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PortfolioValueChart } from "@/components/portfolio/portfolio-value-chart";
import {
  upsertValueSnapshot,
  clearValueHistory,
  toDateKey,
} from "@/lib/hooks/use-portfolio-value-history";

const ADDRESS = "GABCDEF";

function seedHistory(values: Array<{ offsetDays: number; value: number }>) {
  const today = new Date();
  for (const { offsetDays, value } of values) {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    upsertValueSnapshot(ADDRESS, value, d);
  }
}

describe("PortfolioValueChart", () => {
  beforeEach(() => {
    localStorage.clear();
    clearValueHistory(ADDRESS);
  });

  it("shows the empty state before two snapshots exist", () => {
    render(<PortfolioValueChart address={ADDRESS} currentValueXlm={null} />);
    expect(screen.getByText("Portfolio Value")).toBeTruthy();
    expect(screen.getByText(/Connect your wallet and check back tomorrow/)).toBeTruthy();
  });

  it("records today's value and renders a line chart once a trend exists", async () => {
    seedHistory([
      { offsetDays: -2, value: 100 },
      { offsetDays: -1, value: 120 },
      { offsetDays: 0, value: 150 },
    ]);
    render(<PortfolioValueChart address={ADDRESS} currentValueXlm={150} />);
    await waitFor(() => {
      expect(screen.getByRole("img", { name: /Portfolio value over time/ })).toBeTruthy();
    });
    // Latest snapshot shown as the headline value (quoted in XLM).
    expect(screen.getAllByText(/XLM/).length).toBeGreaterThan(0);
    expect(screen.getByText(new RegExp(toDateKey(new Date())))).toBeTruthy();
  });

  it("toggles between 7d and 30d ranges", () => {
    seedHistory([
      { offsetDays: -25, value: 90 },
      { offsetDays: -1, value: 110 },
    ]);
    render(<PortfolioValueChart address={ADDRESS} currentValueXlm={null} />);
    // 30d includes the -25d point -> trend visible.
    expect(screen.getByRole("img", { name: /Portfolio value over time/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "7d" }));
    // The -25d point is filtered out -> fewer than two snapshots -> empty state.
    expect(screen.getByText(/Connect your wallet and check back tomorrow/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "30d" }));
    expect(screen.getByRole("img", { name: /Portfolio value over time/ })).toBeTruthy();
  });

  it("shows a skeleton while loading", () => {
    const { container } = render(
      <PortfolioValueChart address={ADDRESS} currentValueXlm={null} loading />
    );
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });
});
