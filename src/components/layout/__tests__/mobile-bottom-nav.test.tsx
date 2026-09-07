import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

const pathnameMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

describe("MobileBottomNav", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/swap");
  });

  it("renders the primary destinations with labels", () => {
    render(<MobileBottomNav />);
    expect(screen.getByRole("navigation", { name: "Bottom navigation" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Swap/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Markets/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Portfolio/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Assets/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /More/ })).toBeTruthy();
  });

  it("highlights the active route", () => {
    render(<MobileBottomNav />);
    expect(screen.getByRole("link", { name: /Swap/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Markets/ })).not.toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("opens the More sheet and highlights secondary routes", () => {
    pathnameMock.mockReturnValue("/analytics");
    render(<MobileBottomNav />);
    fireEvent.click(screen.getByRole("button", { name: /More/ }));
    expect(screen.getByRole("menu", { name: "More navigation" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Analytics/ })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("menuitem", { name: /Orders/ })).toBeTruthy();
  });

  it("closes the More sheet when pressing Escape", () => {
    render(<MobileBottomNav />);
    fireEvent.click(screen.getByRole("button", { name: /More/ }));
    expect(screen.getByRole("menu", { name: "More navigation" })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu", { name: "More navigation" })).toBeNull();
  });

  it("closes the More sheet on route change", () => {
    const { rerender } = render(<MobileBottomNav />);
    fireEvent.click(screen.getByRole("button", { name: /More/ }));
    expect(screen.getByRole("menu", { name: "More navigation" })).toBeTruthy();
    pathnameMock.mockReturnValue("/markets");
    rerender(<MobileBottomNav />);
    expect(screen.queryByRole("menu", { name: "More navigation" })).toBeNull();
  });
});
