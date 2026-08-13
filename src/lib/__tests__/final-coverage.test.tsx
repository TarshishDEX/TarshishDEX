import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { registerSW } from "@/lib/sw-register";
import { useIntersectionObserver } from "@/lib/hooks/use-intersection-observer";
import { useIsClient } from "@/lib/hooks/use-is-client";
import { Avatar } from "@/components/ui/avatar";
import { MarketTable } from "@/components/markets/market-table";

// =========================================================================
// sw-register
// =========================================================================
describe("registerSW", () => {
  beforeEach(() => {
    // Reset the load listener state between tests
    vi.restoreAllMocks();
  });

  it("does nothing when serviceWorker unsupported", () => {
    Object.defineProperty(navigator, "serviceWorker", {
      value: undefined,
      configurable: true,
    });
    expect(() => registerSW()).not.toThrow();
  });

  it("registers SW on window load", () => {
    const register = vi.fn(() => Promise.resolve({ scope: "/" }));
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register },
      configurable: true,
    });
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");

    registerSW();
    // Find the load handler
    const loadCall = addEventListenerSpy.mock.calls.find(([event]) => event === "load");
    expect(loadCall).toBeTruthy();

    // Trigger the load handler
    act(() => {
      (loadCall![1] as EventListener)(new Event("load"));
    });
    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
  });

  it("handles registration failure gracefully", async () => {
    const register = vi.fn(() => Promise.reject(new Error("blocked")));
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register },
      configurable: true,
    });
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");

    registerSW();
    const loadCall = addEventListenerSpy.mock.calls.find(([event]) => event === "load");
    await act(async () => {
      (loadCall![1] as EventListener)(new Event("load"));
      // Flush the promise rejection
      await Promise.resolve();
    });
    expect(register).toHaveBeenCalled();
  });
});

// =========================================================================
// useIntersectionObserver
// =========================================================================
describe("useIntersectionObserver", () => {
  const mockObserve = vi.fn();
  const mockDisconnect = vi.fn();
  const mockUnobserve = vi.fn();

  class MockIntersectionObserver {
    static instances: MockIntersectionObserver[] = [];
    callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
      MockIntersectionObserver.instances.push(this);
    }
    observe = mockObserve;
    disconnect = mockDisconnect;
    unobserve = mockUnobserve;
  }

  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns ref and initial false state", () => {
    const { result } = renderHook(() => useIntersectionObserver());
    expect(typeof result.current.ref).toBe("object");
    expect(result.current.isIntersecting).toBe(false);
  });

  it("sets isIntersecting true when entry fires", () => {
    function Component() {
      const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>();
      return (
        <div ref={ref} data-testid="target">
          {isIntersecting ? "visible" : "hidden"}
        </div>
      );
    }
    render(<Component />);
    expect(screen.getByText("hidden")).toBeInTheDocument();
    const observer = MockIntersectionObserver.instances[0];
    expect(observer).toBeDefined();
    act(() => {
      observer!.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver
      );
    });
    expect(screen.getByText("visible")).toBeInTheDocument();
  });

  it("unobserves after triggerOnce", () => {
    function Component() {
      const { ref } = useIntersectionObserver<HTMLDivElement>({ triggerOnce: true });
      return (
        <div ref={ref} data-testid="target">
          content
        </div>
      );
    }
    render(<Component />);
    const observer = MockIntersectionObserver.instances[0];
    expect(observer).toBeDefined();
    act(() => {
      observer!.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver
      );
    });
    expect(mockUnobserve).toHaveBeenCalled();
  });
});

// =========================================================================
// useIsClient
// =========================================================================
describe("useIsClient", () => {
  it("returns true on client", () => {
    const { result } = renderHook(() => useIsClient());
    expect(result.current).toBe(true);
  });
});

// =========================================================================
// Avatar
// =========================================================================
vi.mock("next/image", () => ({
  default: ({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} data-testid="avatar-img" />
  ),
}));

describe("Avatar", () => {
  it("renders initials fallback when no src", () => {
    render(<Avatar alt="John Doe" />);
    expect(screen.getByText("JO")).toBeInTheDocument();
  });

  it("renders fallback prop initials", () => {
    render(<Avatar alt="John Doe" fallback="Jane Smith" />);
    expect(screen.getByText("JA")).toBeInTheDocument();
  });

  it("renders image when src provided", () => {
    render(<Avatar src="/avatar.png" alt="John" />);
    expect(screen.getByTestId("avatar-img")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-img")).toHaveAttribute("src", "/avatar.png");
  });

  it("has accessible role and label", () => {
    render(<Avatar alt="Wallet User" />);
    const avatar = screen.getByRole("img", { name: "Wallet User" });
    expect(avatar).toBeInTheDocument();
  });

  it("applies size variants", () => {
    const { container, rerender } = render(<Avatar alt="A" size="sm" />);
    expect(container.firstChild).toHaveClass("h-8", "w-8");
    rerender(<Avatar alt="A" size="lg" />);
    expect(container.firstChild).toHaveClass("h-14", "w-14");
  });

  it("applies custom className", () => {
    render(<Avatar alt="A" className="avatar-custom" />);
    expect(screen.getByRole("img", { name: "A" })).toHaveClass("avatar-custom");
  });
});

// =========================================================================
// MarketTable
// =========================================================================
vi.mock("@/lib/stellar/queries", () => ({
  useMarketStats: vi.fn(),
}));

vi.mock("@/components/providers/live-sync-hooks", () => ({
  useLiveMarketStream: vi.fn(),
}));

import { useMarketStats } from "@/lib/stellar/queries";

const mockStats = [
  {
    token: { code: "XLM", name: "Lumen", isNative: true },
    priceInXlm: 1,
    change24hPct: 2.5,
    volume24hXlm: 1000000,
    bestBid: 0.99,
    bestAsk: 1.01,
  },
  {
    token: { code: "USDC", name: "USD Coin", isNative: false },
    priceInXlm: 0.5,
    change24hPct: -1.2,
    volume24hXlm: 500000,
    bestBid: 0.49,
    bestAsk: 0.51,
  },
  {
    token: { code: "UNKNOWN", name: "No Market", isNative: false },
    priceInXlm: null,
    change24hPct: null,
    volume24hXlm: 0,
    bestBid: null,
    bestAsk: null,
  },
  {
    token: { code: "TEST", name: "Test Token", isNative: false },
    priceInXlm: 0.7,
    change24hPct: null,
    volume24hXlm: 100,
    bestBid: null,
    bestAsk: null,
  },
];

describe("MarketTable", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };

  beforeEach(() => {
    vi.mocked(useMarketStats).mockReturnValue({
      data: mockStats,
      isLoading: false,
      isError: false,
    } as never);
  });

  it("renders heading", () => {
    render(<MarketTable />, { wrapper });
    expect(screen.getByText("Top Markets")).toBeInTheDocument();
  });

  it("shows skeleton when loading", () => {
    vi.mocked(useMarketStats).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as never);
    const { container } = render(<MarketTable />, { wrapper });
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows error message", () => {
    vi.mocked(useMarketStats).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as never);
    render(<MarketTable />, { wrapper });
    expect(screen.getByText(/Market data is temporarily unavailable/)).toBeInTheDocument();
  });

  it("renders market rows", () => {
    render(<MarketTable />, { wrapper });
    expect(screen.getByText("XLM")).toBeInTheDocument();
    expect(screen.getByText("USDC")).toBeInTheDocument();
    expect(screen.getByText("+2.50%")).toBeInTheDocument();
    expect(screen.getByText("-1.20%")).toBeInTheDocument();
  });

  it("filters out rows with null price", () => {
    render(<MarketTable />, { wrapper });
    expect(screen.queryByText("No Market")).not.toBeInTheDocument();
  });

  it("renders dashes for null change and best bid/ask", () => {
    render(<MarketTable />, { wrapper });
    expect(screen.getByText("TEST")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("sorts by 24h change with a null change row", () => {
    render(<MarketTable />, { wrapper });
    fireEvent.click(screen.getByText("24h Change"));
    expect(screen.getByText("TEST")).toBeInTheDocument();
  });

  it("sorts by price when header clicked", () => {
    render(<MarketTable />, { wrapper });
    fireEvent.click(screen.getByText("Price (XLM)"));
    // First row should be XLM (highest price, desc by default)
    const rows = screen.getAllByRole("row");
    expect(rows[1]?.textContent).toContain("XLM");
  });

  it("sorts by 24h change when header clicked", () => {
    render(<MarketTable />, { wrapper });
    fireEvent.click(screen.getByText("24h Change"));
    const rows = screen.getAllByRole("row");
    expect(rows[1]?.textContent).toContain("XLM");
  });

  it("toggles sort direction on second click", () => {
    render(<MarketTable />, { wrapper });
    fireEvent.click(screen.getByText("Price (XLM)"));
    fireEvent.click(screen.getByText("Price (XLM)"));
    // Ascending — USDC (0.5) first
    const rows = screen.getAllByRole("row");
    expect(rows[1]?.textContent).toContain("USDC");
  });

  it("shows empty state when no markets", () => {
    vi.mocked(useMarketStats).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as never);
    render(<MarketTable />, { wrapper });
    expect(screen.getByText("No active XLM markets")).toBeInTheDocument();
  });
});
