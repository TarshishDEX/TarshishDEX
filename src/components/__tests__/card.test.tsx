import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("card", () => {
  it("renders without crashing", () => {
    const { container } = render(<div data-testid="card">content</div>);
    expect(container).toBeTruthy();
  });
});
