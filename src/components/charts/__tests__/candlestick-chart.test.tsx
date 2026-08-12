import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { CandlestickChart } from "@/components/charts/candlestick-chart";
import type { Candle } from "@/lib/stellar/types";

// Mock lightweight-charts
vi.mock("lightweight-charts", () => ({
  createChart: vi.fn(() => ({
    addSeries: vi.fn(() => ({
      setData: vi.fn(),
      priceScale: vi.fn(() => ({
        applyOptions: vi.fn(),
      })),
    })),
    timeScale: vi.fn(() => ({
      fitContent: vi.fn(),
    })),
    remove: vi.fn(),
    applyOptions: vi.fn(),
  })),
  CandlestickSeries: {},
  HistogramSeries: {},
  ColorType: { Solid: "solid" },
}));

// Mock ResizeObserver — must be a constructor
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const mockCandles: Candle[] = [
  { timestamp: 1700000000000, open: 0.10, high: 0.12, low: 0.09, close: 0.11, volumeBase: 10000, volumeCounter: 1100, tradeCount: 50 },
  { timestamp: 1700003600000, open: 0.11, high: 0.13, low: 0.10, close: 0.12, volumeBase: 15000, volumeCounter: 1725, tradeCount: 65 },
];

describe("CandlestickChart", () => {
  it("renders container div with aria-label", () => {
    const { container } = render(<CandlestickChart candles={mockCandles} />);
    const chartDiv = container.querySelector('div[aria-label="Price candlestick chart"]');
    expect(chartDiv).toBeInTheDocument();
  });

  it("renders with empty candles array", () => {
    const { container } = render(<CandlestickChart candles={[]} />);
    const chartDiv = container.querySelector('div[aria-label="Price candlestick chart"]');
    expect(chartDiv).toBeInTheDocument();
  });

  it("renders without crashing", () => {
    const { container } = render(<CandlestickChart candles={mockCandles} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
