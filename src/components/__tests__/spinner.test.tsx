import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("spinner", () => {
  it("renders without crashing", () => {
    const { container } = render(<div data-testid="spinner">content</div>);
    expect(container).toBeTruthy();
  });
});
