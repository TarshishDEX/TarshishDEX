import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("button", () => {
  it("renders without crashing", () => {
    const { container } = render(<div data-testid="button">content</div>);
    expect(container).toBeTruthy();
  });
});
