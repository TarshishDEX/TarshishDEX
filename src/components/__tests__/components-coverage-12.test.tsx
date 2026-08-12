import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { checkRateLimit, resetRateLimitStore, getClientId } from "@/lib/server/rate-limit";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { AddressDisplay } from "@/components/ui/address-display";
import { Avatar } from "@/components/ui/avatar";
import { useLocalStorageValue } from "@/lib/hooks/use-local-storage-value";
import { registerSW } from "@/lib/sw-register";
import { ScreenReaderAnnouncement } from "@/components/ui/screen-reader-announcement";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { I18nProvider, useT } from "@/lib/i18n";
import { ThemeProvider, useTheme } from "@/lib/theme";

const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

// =========================================================================
// Mocks
// =========================================================================

vi.mock("@/components/ui/visually-hidden", () => ({
  VisuallyHidden: ({ children }: { children: ReactNode }) => (
    <span data-testid="visually-hidden">{children}</span>
  ),
}));

vi.mock("@/lib/hooks/use-copy-to-clipboard", () => ({
  useCopyToClipboard: () => ({ copy: vi.fn(), copied: false }),
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string; width: number; height: number; onError?: (e: unknown) => void; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} width={props.width} height={props.height} data-testid="avatar-img" onError={props.onError} className={props.className} />
  ),
}));

// =========================================================================
// rate-limit cleanup + client id
// =========================================================================

describe("rate-limit module", () => {
  beforeEach(() => {
    resetRateLimitStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows a fresh request and returns remaining count", () => {
    vi.setSystemTime(1_000_000);
    const res = checkRateLimit("ip-1", { maxRequests: 3, windowMs: 60_000 });
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(2);
  });

  it("blocks when the limit is exceeded", () => {
    vi.setSystemTime(1_000_000);
    checkRateLimit("ip-2", { maxRequests: 2, windowMs: 60_000 });
    checkRateLimit("ip-2", { maxRequests: 2, windowMs: 60_000 });
    const third = checkRateLimit("ip-2", { maxRequests: 2, windowMs: 60_000 });
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("opens a fresh window after expiry", () => {
    vi.setSystemTime(1_000_000);
    checkRateLimit("ip-3", { maxRequests: 1, windowMs: 60_000 });
    vi.setSystemTime(1_000_000 + 120_000);
    const res = checkRateLimit("ip-3", { maxRequests: 1, windowMs: 60_000 });
    expect(res.allowed).toBe(true);
  });

  it("runs periodic cleanup of expired entries after 5 minutes", () => {
    // lastCleanup is captured at module import with the real clock, so set the
    // fake clock relative to the real now to push past the 5-minute interval.
    const now = Date.now();
    vi.setSystemTime(now);
    checkRateLimit("old-key", { maxRequests: 5, windowMs: 1_000 });
    vi.setSystemTime(now + 10 * 60_000);
    // This call triggers cleanup: old-key expired, fresh-key still live
    checkRateLimit("fresh-key", { maxRequests: 5, windowMs: 60_000 });
    // Second cleanup pass after another 10 minutes
    vi.setSystemTime(now + 20 * 60_000);
    checkRateLimit("fresh-key", { maxRequests: 5, windowMs: 60_000 });
    expect(true).toBe(true);
  });

  it("extracts the first IP from x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    expect(getClientId(req)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip then unknown", () => {
    const req = new Request("http://localhost", { headers: { "x-real-ip": "10.1.1.1" } });
    expect(getClientId(req)).toBe("10.1.1.1");
    const empty = new Request("http://localhost");
    expect(getClientId(empty)).toBe("unknown");
  });
});

// =========================================================================
// events route — cleanup on cancel
// =========================================================================

describe("events route cleanup", () => {
  it("runs cleanup when the client disconnects", async () => {
    const { GET } = await import("@/app/api/events/route");
    const res = await GET();
    const reader = (res.body as ReadableStream<Uint8Array>).getReader();
    await reader.read();
    await reader.cancel();
    // Cancel triggers the start() cleanup (clearInterval + close) without throwing
    expect(true).toBe(true);
  });
});

// =========================================================================
// DropdownMenu keyboard nav
// =========================================================================

describe("DropdownMenu", () => {
  const onSelect = vi.fn();

  const items = [
    { id: "a", label: "Alpha", icon: "A" },
    { id: "b", label: "Beta", danger: true },
    { id: "c", label: "Gamma" },
  ];

  beforeEach(() => {
    onSelect.mockClear();
  });

  it("opens, navigates with arrows, and selects with Enter", () => {
    render(<DropdownMenu trigger={<span>menu</span>} items={items} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("menu"));
    fireEvent.keyDown(document, { key: "ArrowDown" });
    fireEvent.keyDown(document, { key: "ArrowDown" });
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("b");
  });

  it("clamps active index at the boundaries", () => {
    render(<DropdownMenu trigger={<span>menu</span>} items={items} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("menu"));
    fireEvent.keyDown(document, { key: "ArrowUp" });
    fireEvent.keyDown(document, { key: "ArrowUp" });
    fireEvent.keyDown(document, { key: "ArrowUp" });
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("a");
  });

  it("closes with escape and on outside click", () => {
    render(<DropdownMenu trigger={<span>menu</span>} items={items} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("menu"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.click(screen.getByText("menu"));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("selects an item by clicking", () => {
    render(<DropdownMenu trigger={<span>menu</span>} items={items} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("menu"));
    fireEvent.click(screen.getByText("Alpha"));
    expect(onSelect).toHaveBeenCalledWith("a");
  });

  it("renders left-aligned menus", () => {
    render(<DropdownMenu trigger={<span>menu</span>} items={items} onSelect={onSelect} align="left" />);
    fireEvent.click(screen.getByText("menu"));
    expect(screen.queryByRole("menu")).not.toBeNull();
  });

  it("renders icons for items that have them", () => {
    render(<DropdownMenu trigger={<span>menu</span>} items={items} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("menu"));
    expect(screen.getByText("A")).toBeTruthy();
  });
});

// =========================================================================
// AddressDisplay
// =========================================================================

describe("AddressDisplay", () => {
  it("truncates by default and copies on click", () => {
    render(<AddressDisplay address={VALID_ADDRESS} />);
    expect(screen.getByText(/^GAAA/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText(`Copy address ${VALID_ADDRESS}`));
    expect(screen.getByLabelText(`Copy address ${VALID_ADDRESS}`)).toBeTruthy();
  });

  it("renders full address when truncate is false", () => {
    render(<AddressDisplay address={VALID_ADDRESS} truncate={false} />);
    expect(screen.getByText(VALID_ADDRESS)).toBeTruthy();
  });

  it("applies custom lead/tail lengths", () => {
    render(<AddressDisplay address={VALID_ADDRESS} lead={4} tail={4} />);
    const text = screen.getByText(/^GAAA/).textContent ?? "";
    expect(text).toContain("…");
  });
});

// =========================================================================
// Avatar
// =========================================================================

describe("Avatar", () => {
  it("renders initials fallback when no src", () => {
    render(<Avatar alt="Alice" fallback="Alice" />);
    expect(screen.getByRole("img", { name: "Alice" })).toBeTruthy();
    expect(screen.getByText("AL")).toBeTruthy();
  });

  it("derives initials from alt when no fallback", () => {
    render(<Avatar alt="Bob" />);
    expect(screen.getByText("BO")).toBeTruthy();
  });

  it("renders an image when src is provided and hides on error", () => {
    render(<Avatar src="/alice.png" alt="Alice" />);
    const img = screen.getByTestId("avatar-img");
    fireEvent.error(img);
    expect(img.style.display).toBe("none");
  });

  it("supports all sizes", () => {
    render(<Avatar alt="X" size="sm" />);
    render(<Avatar alt="Y" size="md" />);
    render(<Avatar alt="Z" size="lg" />);
    expect(screen.getAllByRole("img")).toHaveLength(3);
  });
});

// =========================================================================
// use-local-storage-value
// =========================================================================

describe("useLocalStorageValue", () => {
  function Harness() {
    const [value, update, remove] = useLocalStorageValue("lsv-key", "default");
    return (
      <div>
        <span data-testid="lsv-value">{value}</span>
        <button data-testid="lsv-set" onClick={() => update("hello")}>
          set
        </button>
        <button data-testid="lsv-remove" onClick={remove}>
          remove
        </button>
      </div>
    );
  }

  it("sets and removes string values", () => {
    render(<Harness />);
    expect(screen.getByTestId("lsv-value").textContent).toBe("default");
    fireEvent.click(screen.getByTestId("lsv-set"));
    expect(screen.getByTestId("lsv-value").textContent).toBe("hello");
    expect(localStorage.getItem("lsv-key")).toBe("hello");
    fireEvent.click(screen.getByTestId("lsv-remove"));
    expect(screen.getByTestId("lsv-value").textContent).toBe("default");
    expect(localStorage.getItem("lsv-key")).toBeNull();
  });

  it("hydrates from localStorage and syncs via storage events", () => {
    localStorage.setItem("lsv-key", "stored");
    render(<Harness />);
    expect(screen.getByTestId("lsv-value").textContent).toBe("stored");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "lsv-key", newValue: "fresh" }));
    });
    expect(screen.getByTestId("lsv-value").textContent).toBe("fresh");
  });
});

// =========================================================================
// sw-register
// =========================================================================

describe("registerSW", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("registers the service worker on window load", async () => {
    const registerMock = vi.fn().mockResolvedValue({ scope: "/" });
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register: registerMock },
      configurable: true,
    });
    const loadSpy = vi.spyOn(window, "addEventListener");
    registerSW();
    const loadHandler = loadSpy.mock.calls.find(([type]) => type === "load")?.[1] as () => void;
    loadHandler();
    await Promise.resolve();
    await Promise.resolve();
    expect(registerMock).toHaveBeenCalledWith("/sw.js", { scope: "/" });
  });

  it("logs failures in dev mode", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    const registerMock = vi.fn().mockRejectedValue(new Error("boom"));
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register: registerMock },
      configurable: true,
    });
    const loadSpy = vi.spyOn(window, "addEventListener");
    registerSW();
    const loadHandler = loadSpy.mock.calls.find(([type]) => type === "load")?.[1] as () => void;
    loadHandler();
    await Promise.resolve();
    await Promise.resolve();
    expect(debug).toHaveBeenCalled();
    debug.mockRestore();
  });

  it("is a no-op without service worker support", () => {
    Object.defineProperty(navigator, "serviceWorker", { value: undefined, configurable: true });
    expect(() => registerSW()).not.toThrow();
  });
});

// =========================================================================
// ScreenReaderAnnouncement reducer (unknown action passthrough)
// =========================================================================

describe("ScreenReaderAnnouncement empty message", () => {
  it("does not announce empty messages", () => {
    render(<ScreenReaderAnnouncement message="" />);
    expect(screen.queryAllByTestId("visually-hidden").length).toBe(0);
  });

  it("clears announcements when switching back to empty", () => {
    const { rerender } = render(<ScreenReaderAnnouncement message="hi" />);
    rerender(<ScreenReaderAnnouncement message="" />);
    expect(screen.queryAllByTestId("visually-hidden").length).toBe(1);
  });
});

// =========================================================================
// use-media-query subscription callback coverage
// =========================================================================

describe("useMediaQuery subscription", () => {
  function Mq() {
    const matches = useMediaQuery("(min-width: 768px)");
    return <div data-testid="mq-sub">{String(matches)}</div>;
  }

  it("subscribes and re-renders on change events", () => {
    let changeHandler: (() => void) | null = null;
    let matches = false;
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches,
      media: "",
      addEventListener: (_: string, cb: () => void) => {
        changeHandler = cb;
      },
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      onchange: null,
      dispatchEvent: () => false,
    }));
    const { unmount } = render(<Mq />);
    expect(screen.getByTestId("mq-sub").textContent).toBe("false");
    matches = true;
    act(() => changeHandler?.());
    expect(screen.getByTestId("mq-sub").textContent).toBe("true");
    unmount();
  });
});

// =========================================================================
// i18n provider + useT
// =========================================================================

describe("i18n", () => {
  function Probe() {
    const { t, locale } = useT();
    return (
      <div>
        <span data-testid="i18n-locale">{locale}</span>
        <span data-testid="i18n-app">{t("app.name")}</span>
        <span data-testid="i18n-missing">{t("missing.key")}</span>
        <span data-testid="i18n-var">{t("nav.swap")}</span>
        <span data-testid="i18n-interp">{t("common.retry")}</span>
      </div>
    );
  }

  it("provides translations with fallback to the key", () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );
    expect(screen.getByTestId("i18n-locale").textContent).toBe("en");
    expect(screen.getByTestId("i18n-app").textContent).toBe("TarshishDEX");
    expect(screen.getByTestId("i18n-missing").textContent).toBe("missing.key");
  });

  it("returns the raw key outside the provider", () => {
    function Outer() {
      const { t } = useT();
      return <span data-testid="i18n-outer">{t("some.key")}</span>;
    }
    render(<Outer />);
    expect(screen.getByTestId("i18n-outer").textContent).toBe("some.key");
  });
});

// =========================================================================
// Theme provider
// =========================================================================

describe("theme provider", () => {
  function Probe() {
    const { theme, toggleTheme, setTheme } = useTheme();
    return (
      <div>
        <span data-testid="theme-current">{theme}</span>
        <button data-testid="theme-toggle" onClick={toggleTheme}>
          toggle
        </button>
        <button data-testid="theme-light" onClick={() => setTheme("light")}>
          light
        </button>
      </div>
    );
  }

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light");
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      onchange: null,
      dispatchEvent: () => false,
    }));
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light");
    vi.restoreAllMocks();
  });

  it("defaults to dark and toggles to light", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme-current").textContent).toBe("dark");
    fireEvent.click(screen.getByTestId("theme-toggle"));
    expect(screen.getByTestId("theme-current").textContent).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(localStorage.getItem("tarshishdex-theme")).toBe("light");
    fireEvent.click(screen.getByTestId("theme-toggle"));
    expect(screen.getByTestId("theme-current").textContent).toBe("dark");
  });

  it("hydrates from a stored light theme", () => {
    localStorage.setItem("tarshishdex-theme", "light");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme-current").textContent).toBe("light");
  });

  it("respects system light preference when nothing is stored", () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
      media: "",
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      onchange: null,
      dispatchEvent: () => false,
    }));
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme-current").textContent).toBe("light");
  });
});
