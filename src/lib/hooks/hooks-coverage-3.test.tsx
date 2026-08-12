import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, renderHook } from "@testing-library/react";
import { useHover } from "@/lib/hooks/use-hover";
import { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from "@/lib/hooks/use-media-query";
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";
import { copyToClipboard, readFromClipboard } from "@/lib/utils/clipboard";
import { throttle, debounce } from "@/lib/utils/throttle";
import { isOnline, onNetworkChange, getNetworkType } from "@/lib/utils/network";

// MatchMedia mock
function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as never;
}

// =========================================================================
// useHover
// =========================================================================
describe("useHover", () => {
  it("returns ref and hovered state", () => {
    const { result } = renderHook(() => useHover());
    expect(typeof result.current.ref).toBe("function");
    expect(result.current.hovered).toBe(false);
  });

  it("sets hovered true on mouseenter", () => {
    function Component() {
      const { ref, hovered } = useHover<HTMLButtonElement>();
      return (
        <button ref={ref} data-testid="hover-target">
          {hovered ? "hovered" : "not-hovered"}
        </button>
      );
    }
    render(<Component />);
    expect(screen.getByText("not-hovered")).toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByTestId("hover-target"));
    expect(screen.getByText("hovered")).toBeInTheDocument();
  });

  it("sets hovered false on mouseleave", () => {
    function Component() {
      const { ref, hovered } = useHover<HTMLButtonElement>();
      return (
        <button ref={ref} data-testid="hover-target">
          {hovered ? "hovered" : "not-hovered"}
        </button>
      );
    }
    render(<Component />);
    const target = screen.getByTestId("hover-target");
    fireEvent.mouseEnter(target);
    fireEvent.mouseLeave(target);
    expect(screen.getByText("not-hovered")).toBeInTheDocument();
  });
});

// =========================================================================
// useMediaQuery
// =========================================================================
describe("useMediaQuery", () => {
  beforeEach(() => {
    mockMatchMedia(true);
  });

  it("returns current match state", () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("returns false when server snapshot used", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("subscribes to media query changes", () => {
    // Track listeners so we can trigger the change event
    const listeners = new Set<() => void>();
    let currentMatches = true;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: currentMatches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_type: string, cb: () => void) => {
        listeners.add(cb);
      },
      removeEventListener: (_type: string, cb: () => void) => {
        listeners.delete(cb);
      },
      dispatchEvent: vi.fn(),
    })) as never;

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
    // Flip the match result and notify all listeners
    currentMatches = false;
    act(() => {
      listeners.forEach((cb) => cb());
    });
    expect(result.current).toBe(false);
  });
});

describe("useIsMobile / useIsTablet / useIsDesktop", () => {
  beforeEach(() => {
    mockMatchMedia(true);
  });

  it("useIsMobile returns match state", () => {
    const { result } = renderHook(() => useIsMobile());
    expect(typeof result.current).toBe("boolean");
  });

  it("useIsTablet returns match state", () => {
    const { result } = renderHook(() => useIsTablet());
    expect(typeof result.current).toBe("boolean");
  });

  it("useIsDesktop returns match state", () => {
    const { result } = renderHook(() => useIsDesktop());
    expect(typeof result.current).toBe("boolean");
  });
});

// =========================================================================
// useCopyToClipboard
// =========================================================================
describe("useCopyToClipboard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns copy function and copied state", () => {
    const { result } = renderHook(() => useCopyToClipboard());
    expect(typeof result.current.copy).toBe("function");
    expect(result.current.copied).toBe(false);
  });

  it("copies text and sets copied true", async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    let success = false;
    await act(async () => {
      success = await result.current.copy("hello");
    });
    expect(success).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("hello");
    expect(result.current.copied).toBe(true);
  });

  it("resets copied after 2 seconds", async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    await act(async () => {
      await result.current.copy("hello");
    });
    expect(result.current.copied).toBe(true);
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(result.current.copied).toBe(false);
  });

  it("returns false when clipboard write fails", async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error("denied")),
      },
    });
    const { result } = renderHook(() => useCopyToClipboard());
    let success: boolean | null = null;
    await act(async () => {
      success = await result.current.copy("text");
    });
    // Falls back to execCommand which returns false in jsdom
    expect(success).toBe(false);
  });
});

// =========================================================================
// clipboard utils
// =========================================================================
describe("clipboard utils", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue("clipboard-content"),
      },
    });
  });

  it("copyToClipboard returns true on success", async () => {
    await expect(copyToClipboard("text")).resolves.toBe(true);
  });

  it("copyToClipboard falls back when writeText unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    document.execCommand = vi.fn(() => true) as never;
    await expect(copyToClipboard("text")).resolves.toBe(true);
  });

  it("readFromClipboard returns clipboard content", async () => {
    await expect(readFromClipboard()).resolves.toBe("clipboard-content");
  });

  it("readFromClipboard returns null on error", async () => {
    Object.assign(navigator, {
      clipboard: {
        readText: vi.fn().mockRejectedValue(new Error("denied")),
      },
    });
    await expect(readFromClipboard()).resolves.toBeNull();
  });
});

// =========================================================================
// throttle / debounce
// =========================================================================
describe("throttle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls fn immediately on first call", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled("a");
    expect(fn).toHaveBeenCalledWith("a");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("skips calls within the delay window", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled("a");
    throttled("b");
    throttled("c");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("calls fn after the delay for trailing call within window", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled("a");
    expect(fn).toHaveBeenCalledTimes(1);
    // A call within the window schedules a trailing call
    throttled("b");
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(110);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("delays fn execution", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced("x");
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(110);
    expect(fn).toHaveBeenCalledWith("x");
  });

  it("resets the timer on rapid calls", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced("1");
    vi.advanceTimersByTime(50);
    debounced("2");
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("2");
  });
});

// =========================================================================
// network utils
// =========================================================================
describe("network utils", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "onLine", { writable: true, value: true });
  });

  it("isOnline returns true when online", () => {
    expect(isOnline()).toBe(true);
  });

  it("isOnline returns false when offline", () => {
    Object.defineProperty(navigator, "onLine", { writable: true, value: false });
    expect(isOnline()).toBe(false);
  });

  it("onNetworkChange subscribes and unsubscribes", () => {
    const callback = vi.fn();
    const unsubscribe = onNetworkChange(callback);
    window.dispatchEvent(new Event("online"));
    expect(callback).toHaveBeenCalledWith(true);
    window.dispatchEvent(new Event("offline"));
    expect(callback).toHaveBeenCalledWith(false);
    unsubscribe();
    window.dispatchEvent(new Event("online"));
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("getNetworkType returns effectiveType when available", () => {
    Object.defineProperty(navigator, "connection", {
      value: { effectiveType: "4g" },
      configurable: true,
    });
    expect(getNetworkType()).toBe("4g");
  });

  it("getNetworkType returns undefined when unavailable", () => {
    Object.defineProperty(navigator, "connection", {
      value: undefined,
      configurable: true,
    });
    expect(getNetworkType()).toBeUndefined();
  });
});
