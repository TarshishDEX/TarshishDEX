import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo, LogoMark } from "@/components/brand/logo";

describe("LogoMark", () => {
  it("renders an SVG element", () => {
    const { container } = render(<LogoMark />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("is hidden from screen readers via aria-hidden", () => {
    const { container } = render(<LogoMark />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("applies custom className", () => {
    const { container } = render(<LogoMark className="custom-size" />);
    const svg = container.querySelector("svg");
    expect(svg?.className.baseVal).toContain("custom-size");
  });
});

describe("Logo", () => {
  it("renders a link to home page", () => {
    render(<Logo />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders the brand name", () => {
    render(<Logo />);
    expect(screen.getByText("Tarshish")).toBeInTheDocument();
    expect(screen.getByText("DEX")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    render(<Logo className="my-logo" />);
    const link = screen.getByRole("link");
    expect(link.className).toContain("my-logo");
  });
});
