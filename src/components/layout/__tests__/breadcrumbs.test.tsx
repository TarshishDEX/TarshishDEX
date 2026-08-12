import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";

describe("Breadcrumbs", () => {
  it("returns null on home path", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    const { container } = render(<Breadcrumbs />);
    expect(container.firstChild).toBeNull();
  });

  it("renders swap breadcrumb", () => {
    vi.mocked(usePathname).mockReturnValue("/swap");
    render(<Breadcrumbs />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Swap")).toBeInTheDocument();
  });

  it("renders markets breadcrumb", () => {
    vi.mocked(usePathname).mockReturnValue("/markets");
    render(<Breadcrumbs />);
    expect(screen.getByText("Markets")).toBeInTheDocument();
  });

  it("renders portfolio breadcrumb", () => {
    vi.mocked(usePathname).mockReturnValue("/portfolio");
    render(<Breadcrumbs />);
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
  });

  it("renders assets breadcrumb", () => {
    vi.mocked(usePathname).mockReturnValue("/assets");
    render(<Breadcrumbs />);
    expect(screen.getByText("Assets")).toBeInTheDocument();
  });

  it("renders analytics breadcrumb", () => {
    vi.mocked(usePathname).mockReturnValue("/analytics");
    render(<Breadcrumbs />);
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });

  it("renders Home link pointing to /", () => {
    vi.mocked(usePathname).mockReturnValue("/swap");
    render(<Breadcrumbs />);
    const homeLink = screen.getByText("Home");
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("last segment is plain text (not a link)", () => {
    vi.mocked(usePathname).mockReturnValue("/swap");
    render(<Breadcrumbs />);
    const swap = screen.getByText("Swap");
    expect(swap.tagName).toBe("SPAN");
  });

  it("intermediate segments are links", () => {
    vi.mocked(usePathname).mockReturnValue("/markets/xlm");
    render(<Breadcrumbs />);
    const marketsLink = screen.getByText("Markets");
    expect(marketsLink.tagName).toBe("A");
    expect(marketsLink).toHaveAttribute("href", "/markets");
  });
});
