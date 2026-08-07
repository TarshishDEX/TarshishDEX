import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Spinner } from "@/components/ui/spinner";

describe("Spinner", () => {
  it("renders without crashing", () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<Spinner className="h-12 w-12" />);
    expect(container.firstChild).toHaveClass("h-12");
  });
});
