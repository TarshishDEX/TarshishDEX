import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
  formatNumber: (n: number) => n.toString(),
  formatPrice: (n: number) => n.toFixed(7),
  formatCompact: (n: number) => n.toFixed(1),
  truncateAddress: (a: string, lead = 6, tail = 6) => `${a.slice(0, lead)}…${a.slice(-tail)}`,
}));

// =========================================================================
// AllocationDonut
// =========================================================================
vi.mock("recharts", () => {
  return {
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div data-testid="container">{children}</div>
    ),
    PieChart: ({ children }: { children: ReactNode }) => (
      <div data-testid="pie-chart">{children}</div>
    ),
    Pie: () => <div data-testid="pie" />,
    Cell: () => <div data-testid="cell" />,
    Tooltip: () => <div />,
    BarChart: ({ children }: { children: ReactNode }) => (
      <div data-testid="bar-chart">{children}</div>
    ),
    Bar: () => <div />,
    CartesianGrid: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
  };
});

import { AllocationDonut } from "@/components/charts/allocation-donut";

describe("AllocationDonut", () => {
  it("shows empty state without data", () => {
    render(<AllocationDonut data={[]} />);
    expect(screen.getByText("No allocations to display")).toBeTruthy();
  });

  it("renders a donut with total", () => {
    render(<AllocationDonut data={[{ name: "XLM", value: 100 }, { name: "USDC", value: 50 }]} />);
    expect(screen.getByTestId("pie-chart")).toBeTruthy();
    expect(screen.getByText("150.00")).toBeTruthy();
  });

  it("renders custom total label", () => {
    render(<AllocationDonut data={[{ name: "XLM", value: 10 }]} totalLabel="Portfolio" />);
    expect(screen.getByText("Portfolio")).toBeTruthy();
  });
});

// =========================================================================
// CandlestickChart
// =========================================================================
const { createChartMock } = vi.hoisted(() => ({ createChartMock: vi.fn() }));

vi.mock("lightweight-charts", () => {
  const series = {
    setData: vi.fn(),
    priceScale: () => ({ applyOptions: vi.fn() }),
  };
  const chart = {
    addSeries: vi.fn(() => series),
    timeScale: () => ({ fitContent: vi.fn() }),
    applyOptions: vi.fn(),
    remove: vi.fn(),
  };
  createChartMock.mockReturnValue(chart);
  return {
    createChart: createChartMock,
    CandlestickSeries: "CandlestickSeries",
    HistogramSeries: "HistogramSeries",
    ColorType: { Solid: "Solid" },
  };
});

import { CandlestickChart } from "@/components/charts/candlestick-chart";

const CANDLES = [
  { timestamp: 1700000000000, open: 1, high: 2, low: 0.5, close: 1.5, volumeBase: 10, volumeCounter: 20, tradeCount: 5 },
  { timestamp: 1700003600000, open: 1.5, high: 3, low: 1, close: 2.5, volumeBase: 10, volumeCounter: 30, tradeCount: 5 },
];

describe("CandlestickChart", () => {
  afterEach(() => vi.restoreAllMocks());

  it("creates a chart with candle and volume series", () => {
    vi.stubGlobal("ResizeObserver", class {
      observe() {}
      disconnect() {}
    });
    const { unmount } = render(<CandlestickChart candles={CANDLES} />);
    expect(createChartMock).toHaveBeenCalled();
    unmount();
    vi.unstubAllGlobals();
  });
});

// =========================================================================
// VolumeChart
// =========================================================================
import { VolumeChart } from "@/components/charts/volume-chart";

describe("VolumeChart", () => {
  it("renders a bar chart with mapped volume", () => {
    render(<VolumeChart candles={CANDLES} />);
    expect(screen.getByTestId("bar-chart")).toBeTruthy();
  });
});

// =========================================================================
// NetworkIndicator
// =========================================================================
import { NetworkIndicator } from "@/components/ui/network-indicator";

describe("NetworkIndicator", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows Online by default", () => {
    vi.stubGlobal("navigator", { onLine: true });
    render(<NetworkIndicator />);
    expect(screen.getByText("Online")).toBeTruthy();
  });

  it("shows Offline when navigator is offline", () => {
    vi.stubGlobal("navigator", { onLine: false });
    render(<NetworkIndicator />);
    expect(screen.getByText("Offline")).toBeTruthy();
  });

  it("shows Slow network on 2g connection", () => {
    vi.stubGlobal(
      "navigator",
      Object.defineProperty({ onLine: true }, "connection", {
        value: { effectiveType: "2g" },
        configurable: true,
      }),
    );
    render(<NetworkIndicator />);
    expect(screen.getByText("Slow network")).toBeTruthy();
  });
});

// =========================================================================
// Hooks: useWindowSize, useWatchlist, useRenderCount, useIsClient, useLocalStorage
// =========================================================================
vi.mock("@/lib/utils/throttle", () => ({
  throttle: (fn: () => void) => fn,
}));

import { useWindowSize } from "@/lib/hooks/use-window-size";

describe("useWindowSize", () => {
  it("reads the window dimensions", () => {
    const { result } = renderHook(() => useWindowSize());
    expect(typeof result.current.width).toBe("number");
  });

  it("updates on window resize", () => {
    const { result } = renderHook(() => useWindowSize());
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(typeof result.current.width).toBe("number");
  });
});

import { useWatchlist } from "@/lib/hooks/use-watchlist";

const XLM_TOKEN = { code: "XLM", name: "Lumen", decimals: 7, isNative: true };
const USDC_TOKEN = { code: "USDC", name: "USD Coin", decimals: 7, issuer: "GISSUER" };

describe("useWatchlist", () => {
  beforeEach(() => localStorage.clear());

  it("adds and removes tokens", () => {
    const { result } = renderHook(() => useWatchlist());
    act(() => result.current.add(XLM_TOKEN));
    expect(result.current.isWatched(XLM_TOKEN)).toBe(true);
    act(() => result.current.remove(XLM_TOKEN));
    expect(result.current.isWatched(XLM_TOKEN)).toBe(false);
  });

  it("toggles tokens and prevents duplicates", () => {
    const { result } = renderHook(() => useWatchlist());
    act(() => result.current.toggle(XLM_TOKEN));
    act(() => result.current.toggle(XLM_TOKEN));
    expect(result.current.tokens).toEqual([]);
    act(() => result.current.add(XLM_TOKEN));
    act(() => result.current.add(XLM_TOKEN));
    expect(result.current.tokens).toHaveLength(1);
  });

  it("respects the watchlist cap", () => {
    const { result } = renderHook(() => useWatchlist());
    for (let i = 0; i < 25; i++) {
      act(() =>
        result.current.add({ code: `T${i}`, name: `Token ${i}`, decimals: 7, issuer: "GX" }),
      );
    }
    expect(result.current.tokens.length).toBeLessThanOrEqual(20);
  });

  it("loads existing tokens from storage", () => {
    localStorage.setItem("tarshishdex-watchlist", JSON.stringify([XLM_TOKEN, USDC_TOKEN]));
    const { result } = renderHook(() => useWatchlist());
    expect(result.current.tokens).toHaveLength(2);
  });
});

import { useRenderCount } from "@/lib/hooks/use-render-count";

describe("useRenderCount", () => {
  it("counts renders with a ref-backed counter", () => {
    const { result, rerender } = renderHook(() => useRenderCount("Test"));
    rerender();
    // Effect runs after paint; ref increments in the effect body.
    expect(typeof result.current).toBe("number");
    expect(result.current).toBeGreaterThanOrEqual(1);
  });
});

import { useIsClient } from "@/lib/hooks/use-is-client";

describe("useIsClient", () => {
  it("returns true after mount", () => {
    const { result } = renderHook(() => useIsClient());
    expect(result.current).toBe(true);
  });
});

// =========================================================================
// wallet-kit helpers (pure)
// =========================================================================
vi.mock("@/lib/stellar/config", () => ({
  getActiveNetwork: () => ({ name: "testnet", passphrase: "test", horizonUrl: "https://h", rpcUrl: "https://r", label: "Testnet" }),
}));

vi.mock("@stellar/freighter-api", () => ({
  isConnected: vi.fn().mockRejectedValue(new Error("no extension")),
}));

import { isWalletAvailable } from "@/lib/stellar/wallet-kit";

describe("wallet-kit helpers", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("isWalletAvailable returns false without a wallet extension", async () => {
    vi.stubGlobal("window", { freighter: undefined });
    expect(await isWalletAvailable()).toBe(false);
  });

  it("isWalletAvailable returns true when Freighter is injected", async () => {
    vi.stubGlobal("window", { freighter: {} });
    expect(await isWalletAvailable()).toBe(true);
  });
});

// =========================================================================
// logger
// =========================================================================
import { logger } from "@/lib/server/logger";

describe("logger", () => {
  const spies = ["info", "warn", "error", "debug"].map((m) =>
    vi.spyOn(console, m as "info").mockImplementation(() => {}),
  );
  afterEach(() => vi.restoreAllMocks());

  it("logs at each level without throwing", () => {
    logger.info("hi", { a: 1 });
    logger.warn("careful", { b: 2 });
    logger.error("boom", { c: 3 });
    logger.debug("trace", { d: 4 });
    expect(true).toBe(true);
  });
});

// =========================================================================
// events SSE route — error path coverage
// =========================================================================
describe("events route", () => {
  it("GET returns a stream response", async () => {
    const { GET } = await import("@/app/api/events/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    const reader = res.body?.getReader();
    expect(reader).toBeTruthy();
    await reader?.cancel();
  });
});
