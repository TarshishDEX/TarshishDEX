import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VolumeChart } from "@/components/charts/volume-chart";
import type { Candle } from "@/lib/stellar/types";

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

const mockCandles: Candle[] = [
  { timestamp: 1700000000000, open: 0.10, high: 0.12, low: 0.09, close: 0.11, volumeBase: 10000, volumeCounter: 1100, tradeCount: 50 },
  { timestamp: 1700003600000, open: 0.11, high: 0.13, low: 0.10, close: 0.12, volumeBase: 15000, volumeCounter: 1725, tradeCount: 65 },
  { timestamp: 1700007200000, open: 0.12, high: 0.14, low: 0.11, close: 0.13, volumeBase: 20000, volumeCounter: 2500, tradeCount: 80 },
];

describe("VolumeChart", () => {
  it("renders without crashing", () => {
    const { container } = render(<VolumeChart candles={mockCandles} />);
    expect(container.querySelector('[data-testid="responsive-container"]')).toBeInTheDocument();
  });

  it("renders with empty candles", () => {
    const { container } = render(<VolumeChart candles={[]} />);
    expect(container.querySelector('[data-testid="bar-chart"]')).toBeInTheDocument();
  });

  it("renders chart sub-components", () => {
    render(<VolumeChart candles={mockCandles} />);
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
    expect(screen.getByTestId("x-axis")).toBeInTheDocument();
    expect(screen.getByTestId("y-axis")).toBeInTheDocument();
    expect(screen.getByTestId("bar")).toBeInTheDocument();
  });
});
