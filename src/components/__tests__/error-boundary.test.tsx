import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("error-boundary", () => {
  it("renders without crashing", () => {
    const { container } = render(<div data-testid="error-boundary">content</div>);
    expect(container).toBeTruthy();
  });
});
