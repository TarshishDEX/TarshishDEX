import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AllocationDonut, type AllocationSlice } from "@/components/charts/allocation-donut";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children }: { children: React.ReactNode }) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

const portfolioData: AllocationSlice[] = [
  { name: "XLM", value: 1000 },
  { name: "USDC", value: 500 },
  { name: "EURMTL", value: 250 },
];

describe("AllocationDonut", () => {
  it("renders with data", () => {
    const { container } = render(<AllocationDonut data={portfolioData} />);
    expect(container.querySelector('[data-testid="pie-chart"]')).toBeInTheDocument();
  });

  it("shows total value", () => {
    render(<AllocationDonut data={portfolioData} />);
    // Total = 1000 + 500 + 250 = 1750
    expect(screen.getByText(/1750/)).toBeInTheDocument();
  });

  it("shows empty state when no data", () => {
    render(<AllocationDonut data={[]} />);
    expect(screen.getByText("No allocations to display")).toBeInTheDocument();
  });

  it("does not render chart when data is empty", () => {
    const { container } = render(<AllocationDonut data={[]} />);
    expect(container.querySelector('[data-testid="pie-chart"]')).toBeNull();
  });

  it("uses custom total label", () => {
    render(<AllocationDonut data={portfolioData} totalLabel="Portfolio Value" />);
    expect(screen.getByText("Portfolio Value")).toBeInTheDocument();
  });

  it("renders cells for each data entry", () => {
    render(<AllocationDonut data={portfolioData} />);
    const cells = screen.getAllByTestId("cell");
    expect(cells).toHaveLength(portfolioData.length);
  });
});
