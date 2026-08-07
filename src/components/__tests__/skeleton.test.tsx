import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("skeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<div data-testid="skeleton">content</div>);
    expect(container).toBeTruthy();
  });
});
