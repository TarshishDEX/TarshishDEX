import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ErrorBoundary } from "@/components/ui/error-boundary";

function ThrowError(): React.ReactElement {
  throw new Error("test error");
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <p>Safe content</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("Safe content")).toBeInTheDocument();
  });

  it("renders fallback on error", () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(container.textContent).toContain("Something went wrong");
  });
});
