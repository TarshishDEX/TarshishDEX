import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("sort-indicator", () => {
  it("renders without crashing", () => {
    const { container } = render(<div data-testid="sort-indicator">content</div>);
    expect(container).toBeTruthy();
  });
});
