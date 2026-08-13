import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PoolDepth } from "@/components/markets/pool-depth";
import { SWRegistrar } from "@/components/ui/sw-registrar";
import { OnlineOfflineBadge } from "@/components/ui/online-offline-badge";
import { QuoteRefreshIndicator } from "@/components/ui/quote-refresh-indicator";
import { TransactionStatusIcon } from "@/components/ui/transaction-status-icon";
import type { PoolSummary } from "@/lib/stellar/pool-types";

vi.mock("@/lib/sw-register", () => ({
  registerSW: vi.fn(),
}));

// =========================================================================
// PoolDepth
// =========================================================================
describe("PoolDepth", () => {
  const mockPools: PoolSummary[] = [
    {
      id: "pool-1",
      feeBp: 30,
      midPrice: 0.123456,
      tvl: 50000,
      base: { code: "XLM", isNative: true },
      counter: { code: "USDC", issuer: "GA5Z" },
      baseReserve: 100000,
      counterReserve: 12000,
      volume24h: 5000,
    },
  ];

  it("renders heading", () => {
    render(<PoolDepth pools={[]} />);
    expect(screen.getByText("AMM Liquidity Pools")).toBeInTheDocument();
  });

  it("shows empty state when no pools", () => {
    render(<PoolDepth pools={[]} />);
    expect(screen.getByText("No AMM pools for this pair.")).toBeInTheDocument();
  });

  it("shows skeleton when loading", () => {
    const { container } = render(<PoolDepth pools={[]} loading />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders pool details when pools provided", () => {
    render(<PoolDepth pools={mockPools} />);
    expect(screen.getByText("0.30%")).toBeInTheDocument();
    expect(screen.getByText("0.123456")).toBeInTheDocument();
  });
});

// =========================================================================
// SWRegistrar
// =========================================================================
describe("SWRegistrar", () => {
  it("renders nothing to DOM", () => {
    const { container } = render(<SWRegistrar />);
    expect(container.firstChild).toBeNull();
  });
});

// =========================================================================
// OnlineOfflineBadge
// =========================================================================
describe("OnlineOfflineBadge", () => {
  it("shows Online when online=true", () => {
    render(<OnlineOfflineBadge online />);
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("shows Offline when online=false", () => {
    render(<OnlineOfflineBadge online={false} />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("shows custom label when provided", () => {
    render(<OnlineOfflineBadge online label="Connected" />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<OnlineOfflineBadge online className="my-badge" />);
    expect(screen.getByText("Online").closest("span")).toHaveClass("my-badge");
  });
});

// =========================================================================
// TransactionStatusIcon
// =========================================================================
describe("TransactionStatusIcon", () => {
  it("renders pending icon", () => {
    const { container } = render(<TransactionStatusIcon status="pending" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders success icon", () => {
    const { container } = render(<TransactionStatusIcon status="success" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders failed icon", () => {
    const { container } = render(<TransactionStatusIcon status="failed" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<TransactionStatusIcon status="success" className="my-icon" />);
    expect(container.firstChild).toHaveClass("my-icon");
  });
});

// =========================================================================
// QuoteRefreshIndicator
// =========================================================================
describe("QuoteRefreshIndicator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("renders refresh button", () => {
    render(<QuoteRefreshIndicator staleTimeMs={30000} onRefresh={vi.fn()} />);
    expect(screen.getByLabelText("Refresh quote")).toBeInTheDocument();
  });

  it("calls onRefresh on click", () => {
    const onRefresh = vi.fn();
    render(<QuoteRefreshIndicator staleTimeMs={30000} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByLabelText("Refresh quote"));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("renders progress bar", () => {
    const { container } = render(<QuoteRefreshIndicator staleTimeMs={30000} onRefresh={vi.fn()} />);
    const bar = container.querySelector(".h-1");
    expect(bar).toBeInTheDocument();
  });

  it("calls onRefresh when timer expires", () => {
    const onRefresh = vi.fn();
    render(<QuoteRefreshIndicator staleTimeMs={30000} onRefresh={onRefresh} />);
    act(() => {
      vi.advanceTimersByTime(35000);
    });
    expect(onRefresh).toHaveBeenCalled();
  });
});
