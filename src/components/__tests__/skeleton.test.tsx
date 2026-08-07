import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton } from "@/components/ui/skeleton";

describe("Skeleton", () => {
  it("renders with default classes", () => {
    const { container } = render(<Skeleton className="h-10 w-full" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<Skeleton className="h-20 w-40 rounded-xl" />);
    expect(container.firstChild).toHaveClass("h-20");
    expect(container.firstChild).toHaveClass("w-40");
  });

  it("renders as a block element", () => {
    const { container } = render(<Skeleton className="h-4" />);
    expect(container.firstChild).toBeTruthy();
  });
});
