import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock heavy child components so page tests focus on structure
vi.mock("@/components/swap/swap-widget", () => ({
  SwapWidget: () => <div data-testid="swap-widget" />,
}));
vi.mock("@/components/swap/on-chain-preferences", () => ({
  OnChainPreferences: () => <div data-testid="on-chain-preferences" />,
}));
vi.mock("@/components/markets/market-table", () => ({
  MarketTable: () => <div data-testid="market-table" />,
}));
vi.mock("@/components/markets/orderbook-depth", () => ({
  OrderbookDepth: () => <div data-testid="orderbook-depth" />,
}));
vi.mock("@/components/analytics/price-chart-panel", () => ({
  PriceChartPanel: () => <div data-testid="price-chart-panel" />,
}));
vi.mock("@/components/assets/asset-browser", () => ({
  AssetBrowser: () => <div data-testid="asset-browser" />,
}));
vi.mock("@/components/orders/limit-order-form", () => ({
  LimitOrderForm: () => <div data-testid="limit-order-form" />,
}));
vi.mock("@/components/orders/limit-order-table", () => ({
  LimitOrderTable: () => <div data-testid="limit-order-table" />,
}));
vi.mock("@/components/portfolio/portfolio-widget", () => ({
  PortfolioWidget: () => <div data-testid="portfolio-widget" />,
}));
vi.mock("@/components/ui/spinner", () => ({
  Spinner: ({ className }: { className?: string }) => <div data-testid="spinner" className={className} />,
}));
vi.mock("@/lib/stellar/config", () => ({
  getActiveNetwork: () => ({ name: "testnet", label: "Testnet" }),
}));

import Home from "@/app/page";
import SwapPage from "@/app/swap/page";
import MarketsPage from "@/app/markets/page";
import AnalyticsPage from "@/app/analytics/page";
import AssetsPage from "@/app/assets/page";
import OrdersPage from "@/app/orders/page";
import PortfolioPage from "@/app/portfolio/page";
import GlobalLoading from "@/app/loading";
import ErrorPage from "@/app/error";
import NotFound from "@/app/not-found";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import AnalyticsError from "@/app/analytics/error";
import AnalyticsLoading from "@/app/analytics/loading";
import AssetsError from "@/app/assets/error";
import AssetsLoading from "@/app/assets/loading";
import MarketsError from "@/app/markets/error";
import MarketsLoading from "@/app/markets/loading";
import OrdersError from "@/app/orders/error";
import OrdersLoading from "@/app/orders/loading";
import PortfolioError from "@/app/portfolio/error";
import PortfolioLoading from "@/app/portfolio/loading";
import SwapError from "@/app/swap/error";
import SwapLoading from "@/app/swap/loading";

describe("Home page", () => {
  it("renders hero and CTA links", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    expect(screen.getByText("Launch Swap").closest("a")).toHaveAttribute("href", "/swap");
    expect(screen.getByText("Explore Markets").closest("a")).toHaveAttribute("href", "/markets");
    expect(screen.getByText("Start Trading").closest("a")).toHaveAttribute("href", "/swap");
  });

  it("renders all six feature cards", () => {
    render(<Home />);
    for (const title of [
      "Native DEX Swaps",
      "Intelligent Routing",
      "Liquidity Insights",
      "Transaction Simulation",
      "Portfolio Intelligence",
      "Soroban Smart Contracts",
    ]) {
      expect(screen.getByText(title)).toBeTruthy();
    }
  });
});

describe("Swap page", () => {
  it("renders the swap widget and preferences", () => {
    render(<SwapPage />);
    expect(screen.getByTestId("swap-widget")).toBeTruthy();
    expect(screen.getByTestId("on-chain-preferences")).toBeTruthy();
  });
});

describe("Markets page", () => {
  it("renders the market table and orderbook depth", () => {
    render(<MarketsPage />);
    expect(screen.getByTestId("market-table")).toBeTruthy();
    expect(screen.getByTestId("orderbook-depth")).toBeTruthy();
    expect(screen.getByText(/Network: Testnet/)).toBeTruthy();
  });
});

describe("Analytics page", () => {
  it("renders the price chart panel", () => {
    render(<AnalyticsPage />);
    expect(screen.getByTestId("price-chart-panel")).toBeTruthy();
    expect(screen.getByText(/Live on Testnet/)).toBeTruthy();
  });
});

describe("Assets page", () => {
  it("renders the asset browser", () => {
    render(<AssetsPage />);
    expect(screen.getByTestId("asset-browser")).toBeTruthy();
  });
});

describe("Orders page", () => {
  it("renders the limit order form and table", () => {
    render(<OrdersPage />);
    expect(screen.getByTestId("limit-order-form")).toBeTruthy();
    expect(screen.getByTestId("limit-order-table")).toBeTruthy();
  });
});

describe("Portfolio page", () => {
  it("renders the portfolio widget", () => {
    render(<PortfolioPage />);
    expect(screen.getByTestId("portfolio-widget")).toBeTruthy();
  });
});

describe("GlobalLoading", () => {
  it("renders a spinner", () => {
    render(<GlobalLoading />);
    expect(screen.getByTestId("spinner")).toBeTruthy();
  });
});

describe("ErrorPage", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it("renders 500 message and logs the error", () => {
    render(<ErrorPage error={new Error("boom")} reset={() => {}} />);
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(console.error).toHaveBeenCalled();
  });

  it("shows the digest when present", () => {
    render(<ErrorPage error={Object.assign(new Error("x"), { digest: "abc123" })} reset={() => {}} />);
    expect(screen.getByText(/abc123/)).toBeTruthy();
  });

  it("calls reset when Try again is clicked", () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error("x")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /Try again/ }));
    expect(reset).toHaveBeenCalled();
  });
});

describe("section error components", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  const cases: Array<[string, React.ComponentType<{ error: Error; reset: () => void }>]> = [
    ["AnalyticsError", AnalyticsError],
    ["AssetsError", AssetsError],
    ["MarketsError", MarketsError],
    ["OrdersError", OrdersError],
    ["PortfolioError", PortfolioError],
    ["SwapError", SwapError],
  ];

  it.each(cases)("%s renders error state with reset", (_name, Component) => {
    const reset = vi.fn();
    render(<Component error={new Error("boom")} reset={reset} />);
    expect(screen.getByRole("button", { name: /Try again|Retry/i })).toBeTruthy();
  });
});

describe("section loading components", () => {
  const cases: Array<[string, React.ComponentType]> = [
    ["AnalyticsLoading", AnalyticsLoading],
    ["AssetsLoading", AssetsLoading],
    ["MarketsLoading", MarketsLoading],
    ["OrdersLoading", OrdersLoading],
    ["PortfolioLoading", PortfolioLoading],
    ["SwapLoading", SwapLoading],
  ];

  it.each(cases)("%s renders a skeleton without throwing", (_name, Component) => {
    const { container } = render(<Component />);
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });
});

describe("NotFound", () => {
  it("renders 404 with a back link", () => {
    render(<NotFound />);
    expect(screen.getByText("Page not found")).toBeTruthy();
    expect(screen.getByText("Back to TarshishDEX").closest("a")).toHaveAttribute("href", "/");
  });
});

describe("robots", () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = original;
  });

  it("returns rules with default base URL", () => {
    const out = robots();
    expect(out.rules).toEqual({ userAgent: "*", allow: "/", disallow: "/api/" });
    expect(out.sitemap).toBe("https://tarshishdex.vercel.app/sitemap.xml");
  });

  it("honours the site URL env var", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://dex.example.com";
    expect(robots().sitemap).toBe("https://dex.example.com/sitemap.xml");
  });
});

describe("sitemap", () => {
  it("returns all routes with daily frequency", () => {
    const out = sitemap();
    expect(out.length).toBe(6);
    expect(out[0]).toMatchObject({ url: "https://tarshishdex.vercel.app", priority: 1.0 });
    expect(out[1]).toMatchObject({ url: "https://tarshishdex.vercel.app/swap", priority: 0.9 });
    for (const entry of out) {
      expect(entry.changeFrequency).toBe("daily");
      expect(typeof entry.lastModified).toBe("string");
    }
  });
});
