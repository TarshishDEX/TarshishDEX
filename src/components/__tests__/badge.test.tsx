import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge tone="accent">Test</Badge>);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("renders with dot indicator", () => {
    render(<Badge tone="success" dot>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies neutral tone", () => {
    render(<Badge tone="neutral">Neutral</Badge>);
    expect(screen.getByText("Neutral")).toBeInTheDocument();
  });
});
