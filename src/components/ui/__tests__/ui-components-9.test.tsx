import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ShareLink } from "@/components/ui/share-link";
import { LastUpdated } from "@/components/ui/last-updated";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { KeyValuePair } from "@/components/ui/key-value-pair";
import { capitalize, camelToTitle, slugify, escapeHtml } from "@/lib/utils/string";

// =========================================================================
// string utils
// =========================================================================
describe("string utils", () => {
  it("capitalize capitalizes first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("Hello")).toBe("Hello");
    expect(capitalize("")).toBe("");
  });

  it("camelToTitle converts camelCase to Title Case", () => {
    expect(camelToTitle("maxSlippage")).toBe("Max Slippage");
    expect(camelToTitle("priceImpact")).toBe("Price Impact");
  });

  it("slugify converts to URL-safe slug", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
    expect(slugify("  Multi   Space  ")).toBe("multi-space");
    expect(slugify("TarshishDEX-123")).toBe("tarshishdex-123");
  });

  it("escapeHtml escapes special chars", () => {
    expect(escapeHtml('<a href="x">&\'</a>')).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#039;&lt;/a&gt;"
    );
  });
});

// =========================================================================
// ShareLink
// =========================================================================
describe("ShareLink", () => {
  beforeEach(() => {
    // Default: no native share, clipboard available
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders Share button", () => {
    render(<ShareLink url="https://example.com" title="Title" />);
    expect(screen.getByLabelText("Share link")).toBeInTheDocument();
    expect(screen.getByText("Share")).toBeInTheDocument();
  });

  it("copies URL to clipboard when no native share", async () => {
    render(<ShareLink url="https://example.com" title="Title" />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText("Share link"));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://example.com");
    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });

  it("uses native share API when available", async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: shareMock,
      configurable: true,
    });
    render(<ShareLink url="https://example.com" title="Title" text="Text" />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText("Share link"));
    });
    expect(shareMock).toHaveBeenCalledWith({
      url: "https://example.com",
      title: "Title",
      text: "Text",
    });
    expect(screen.getByText("Share")).toBeInTheDocument();
  });

  it("falls back to clipboard when share fails", async () => {
    Object.defineProperty(navigator, "share", {
      value: vi.fn().mockRejectedValue(new Error("canceled")),
      configurable: true,
    });
    render(<ShareLink url="https://example.com" title="Title" />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText("Share link"));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://example.com");
    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });
});

// =========================================================================
// LastUpdated
// =========================================================================
describe("LastUpdated", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders null when no timestamp", () => {
    const { container } = render(<LastUpdated timestamp={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows just now for recent timestamps", () => {
    const now = Date.now();
    render(<LastUpdated timestamp={now - 5000} />);
    expect(screen.getByText(/just now/)).toBeInTheDocument();
  });

  it("shows seconds ago", () => {
    const now = Date.now();
    render(<LastUpdated timestamp={now - 30000} />);
    expect(screen.getByText(/30s ago/)).toBeInTheDocument();
  });

  it("shows minutes ago", () => {
    const now = Date.now();
    render(<LastUpdated timestamp={now - 120000} />);
    expect(screen.getByText(/2m ago/)).toBeInTheDocument();
  });

  it("shows hours ago", () => {
    const now = Date.now();
    render(<LastUpdated timestamp={now - 7200000} />);
    expect(screen.getByText(/2h ago/)).toBeInTheDocument();
  });

  it("updates over time via interval", () => {
    const now = Date.now();
    render(<LastUpdated timestamp={now - 30000} />);
    expect(screen.getByText(/30s ago/)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(screen.getByText(/1m ago/)).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const now = Date.now();
    render(<LastUpdated timestamp={now} className="custom-updated" />);
    expect(screen.getByText(/Updated just now/)).toHaveClass("custom-updated");
  });
});

// =========================================================================
// ScrollToTop
// =========================================================================
describe("ScrollToTop", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    });
    window.scrollTo = vi.fn();
  });

  it("renders nothing when not scrolled", () => {
    const { container } = render(<ScrollToTop />);
    expect(container.firstChild).toBeNull();
  });

  it("appears after scrolling past 400px", () => {
    render(<ScrollToTop />);
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 500,
    });
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(screen.getByLabelText("Scroll to top")).toBeInTheDocument();
  });

  it("scrolls to top on click", () => {
    render(<ScrollToTop />);
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 500,
    });
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    fireEvent.click(screen.getByLabelText("Scroll to top"));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("hides when scrolled back up", () => {
    const { container } = render(<ScrollToTop />);
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 500,
    });
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(screen.getByLabelText("Scroll to top")).toBeInTheDocument();
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    });
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(container.firstChild).toBeNull();
  });
});

// =========================================================================
// KeyValuePair
// =========================================================================
describe("KeyValuePair", () => {
  it("renders label and value", () => {
    render(<KeyValuePair label="Fee" value="0.5%" />);
    expect(screen.getByText("Fee")).toBeInTheDocument();
    expect(screen.getByText("0.5%")).toBeInTheDocument();
  });

  it("applies mono class when mono is true", () => {
    render(<KeyValuePair label="Hash" value="abc123" mono />);
    const value = screen.getByText("abc123");
    expect(value).toHaveClass("font-mono");
  });

  it("renders ReactNode values", () => {
    render(
      <KeyValuePair
        label="Status"
        value={<span className="text-success">Active</span>}
      />
    );
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<KeyValuePair label="A" value="B" className="my-row" />);
    const label = screen.getByText("A");
    expect(label.parentElement).toHaveClass("my-row");
  });
});
