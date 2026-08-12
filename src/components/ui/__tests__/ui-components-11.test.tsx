import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Tooltip } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast-provider";
import { AccessibleIcon } from "@/components/ui/accessible-icon";
import { VolumeChart } from "@/components/charts/volume-chart";
import type { Candle } from "@/lib/stellar/types";

// Mock recharts for VolumeChart to avoid canvas requirements
vi.mock("recharts", () => {
  const MockContainer = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="recharts-container">{children}</div>
  );
  const MockChart = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="recharts-chart">{children}</div>
  );
  return {
    ResponsiveContainer: MockContainer,
    BarChart: MockChart,
    Bar: () => <div data-testid="recharts-bar" />,
    CartesianGrid: () => <div data-testid="recharts-grid" />,
    XAxis: () => <div data-testid="recharts-xaxis" />,
    YAxis: () => <div data-testid="recharts-yaxis" />,
    Tooltip: () => <div data-testid="recharts-tooltip" />,
  };
});

// =========================================================================
// Tooltip
// =========================================================================
describe("Tooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children without tooltip initially", () => {
    render(
      <Tooltip content="Helpful hint">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.getByText("Hover me")).toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip on mouse enter after delay", () => {
    render(
      <Tooltip content="Helpful hint">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText("Hover me"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(310);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByText("Helpful hint")).toBeInTheDocument();
  });

  it("shows tooltip on focus", () => {
    render(
      <Tooltip content="Focus hint">
        <button>Focus me</button>
      </Tooltip>
    );
    fireEvent.focus(screen.getByText("Focus me"));
    act(() => {
      vi.advanceTimersByTime(310);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("hides tooltip on mouse leave", () => {
    render(
      <Tooltip content="Hint">
        <button>Hover me</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText("Hover me"));
    act(() => {
      vi.advanceTimersByTime(310);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.mouseLeave(screen.getByText("Hover me"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("hides tooltip on blur", () => {
    render(
      <Tooltip content="Hint">
        <button>Focus me</button>
      </Tooltip>
    );
    fireEvent.focus(screen.getByText("Focus me"));
    act(() => {
      vi.advanceTimersByTime(310);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.blur(screen.getByText("Focus me"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("supports custom side classes", () => {
    render(
      <Tooltip content="Left hint" side="left" delayMs={0}>
        <button>Left</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText("Left"));
    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveClass("right-full");
  });

  it("clears pending timer when leaving before delay elapses", () => {
    render(
      <Tooltip content="Hint">
        <button>Quick leave</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText("Quick leave"));
    fireEvent.mouseLeave(screen.getByText("Quick leave"));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});

// =========================================================================
// ToastProvider
// =========================================================================
describe("ToastProvider", () => {
  it("is a re-export that renders as a function component", () => {
    expect(typeof ToastProvider).toBe("function");
  });

  it("renders without crashing", () => {
    const { container } = render(<ToastProvider />);
    // ToastViewport may render null or a fixed region — either is fine
    expect(container).toBeDefined();
  });
});

// =========================================================================
// AccessibleIcon
// =========================================================================
describe("AccessibleIcon (coverage)", () => {
  it("clones child with aria-hidden and adds sr-only label", () => {
    render(
      <AccessibleIcon label="Search">
        <svg data-testid="svg-icon" className="base-class" />
      </AccessibleIcon>
    );
    const icon = screen.getByTestId("svg-icon");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveClass("base-class");
    expect(screen.getByText("Search")).toBeInTheDocument();
  });

  it("passes through non-element children unchanged", () => {
    const { container } = render(
      <AccessibleIcon label="Custom">
        <span data-testid="custom-child">custom</span>
      </AccessibleIcon>
    );
    expect(screen.getByTestId("custom-child")).toBeInTheDocument();
    expect(container.textContent).toContain("Custom");
  });

  it("merges custom className into icon", () => {
    render(
      <AccessibleIcon label="Settings" className="extra-icon-class">
        <svg data-testid="svg-icon" />
      </AccessibleIcon>
    );
    expect(screen.getByTestId("svg-icon")).toHaveClass("extra-icon-class");
  });
});

// =========================================================================
// VolumeChart
// =========================================================================
describe("VolumeChart", () => {
  const mockCandles: Candle[] = [
    {
      timestamp: 1767225600000,
      open: 0.1,
      high: 0.12,
      low: 0.09,
      close: 0.11,
      volumeBase: 1000,
      volumeCounter: 500,
      tradeCount: 42,
    },
    {
      timestamp: 1767312000000,
      open: 0.11,
      high: 0.13,
      low: 0.1,
      close: 0.12,
      volumeBase: 1500,
      volumeCounter: 700,
      tradeCount: 57,
    },
  ];

  it("renders chart components for candles", () => {
    render(<VolumeChart candles={mockCandles} />);
    expect(screen.getByTestId("recharts-container")).toBeInTheDocument();
    expect(screen.getByTestId("recharts-chart")).toBeInTheDocument();
    expect(screen.getByTestId("recharts-bar")).toBeInTheDocument();
    expect(screen.getByTestId("recharts-grid")).toBeInTheDocument();
    expect(screen.getByTestId("recharts-xaxis")).toBeInTheDocument();
    expect(screen.getByTestId("recharts-yaxis")).toBeInTheDocument();
    expect(screen.getByTestId("recharts-tooltip")).toBeInTheDocument();
  });

  it("handles empty candles array", () => {
    render(<VolumeChart candles={[]} />);
    expect(screen.getByTestId("recharts-chart")).toBeInTheDocument();
  });

  it("renders wrapper with fixed height", () => {
    const { container } = render(<VolumeChart candles={mockCandles} />);
    expect(container.firstChild).toHaveClass("h-40", "w-full");
  });
});
