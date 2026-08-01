import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Live</Badge>);
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("renders a status dot when requested", () => {
    const { container } = render(<Badge dot tone="success" />);
    expect(container.querySelector("span span")).not.toBeNull();
  });

  it("applies tone-specific classes", () => {
    const { container } = render(<Badge tone="danger">Error</Badge>);
    expect(container.firstChild).toHaveClass("text-danger");
  });
});
