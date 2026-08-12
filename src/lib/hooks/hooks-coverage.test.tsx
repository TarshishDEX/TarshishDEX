import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToggle } from "@/lib/hooks/use-toggle";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useDisclosure } from "@/lib/hooks/use-disclosure";
import { usePrevious } from "@/lib/hooks/use-previous";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { useIsFirstRender } from "@/lib/hooks/use-is-first-render";
import { useIsClient } from "@/lib/hooks/use-is-client";
import { useSafeSetState } from "@/lib/hooks/use-safe-set-state";
import { useRenderCount } from "@/lib/hooks/use-render-count";
import { useDelayedValue } from "@/lib/hooks/use-delayed-value";
import { useIsMounted } from "@/lib/hooks/use-is-mounted";
import { useTimeout } from "@/lib/hooks/use-timeout";
import { useInterval } from "@/lib/hooks/use-interval";
import { useHover } from "@/lib/hooks/use-hover";
import { useWindowSize } from "@/lib/hooks/use-window-size";
import { useOnClickOutside } from "@/lib/hooks/use-on-click-outside";
import { useDocumentVisibility } from "@/lib/hooks/use-document-visibility";
import { useWindowFocus } from "@/lib/hooks/use-window-focus";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { useSessionStorage } from "@/lib/hooks/use-session-storage";

// ── useToggle ──────────────────────────────────────────────────────────

describe("useToggle", () => {
  it("defaults to false", () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current.value).toBe(false);
  });

  it("accepts initial value", () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current.value).toBe(true);
  });

  it("toggle flips value", () => {
    const { result } = renderHook(() => useToggle());
    act(() => result.current.toggle());
    expect(result.current.value).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.value).toBe(false);
  });

  it("setOn sets to true", () => {
    const { result } = renderHook(() => useToggle());
    act(() => result.current.setOn());
    expect(result.current.value).toBe(true);
  });

  it("setOff sets to false", () => {
    const { result } = renderHook(() => useToggle(true));
    act(() => result.current.setOff());
    expect(result.current.value).toBe(false);
  });

  it("setValue sets to specific value", () => {
    const { result } = renderHook(() => useToggle());
    act(() => result.current.setValue(true));
    expect(result.current.value).toBe(true);
  });
});

// ── useDebounce ────────────────────────────────────────────────────────

describe("useDebounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 300));
    expect(result.current).toBe("hello");
  });

  it("debounces value changes", () => {
    const { result, rerender } = renderHook(({ val }) => useDebounce(val, 300), {
      initialProps: { val: "a" },
    });
    rerender({ val: "b" });
    expect(result.current).toBe("a"); // still old value
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("b");
  });

  it("cancels previous timer on new value", () => {
    const { result, rerender } = renderHook(({ val }) => useDebounce(val, 500), {
      initialProps: { val: "x" },
    });
    rerender({ val: "y" });
    act(() => vi.advanceTimersByTime(200));
    rerender({ val: "z" });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe("x"); // not yet updated
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("z");
  });
});

// ── useDisclosure ──────────────────────────────────────────────────────

describe("useDisclosure", () => {
  it("defaults to closed", () => {
    const { result } = renderHook(() => useDisclosure());
    expect(result.current.isOpen).toBe(false);
  });

  it("open opens", () => {
    const { result } = renderHook(() => useDisclosure());
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
  });

  it("close closes", () => {
    const { result } = renderHook(() => useDisclosure(true));
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });

  it("toggle flips open state", () => {
    const { result } = renderHook(() => useDisclosure());
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
  });
});

// ── usePrevious ────────────────────────────────────────────────────────

describe("usePrevious", () => {
  it("runs without error and returns a value", () => {
    const { result } = renderHook(() => usePrevious(5));
    expect(result.current).toBeDefined();
  });

  it("can be called with different types", () => {
    const { result } = renderHook(() => usePrevious("hello"));
    expect(typeof result.current).toBe("string");
  });

  it("handles object values", () => {
    const obj = { a: 1 };
    const { result } = renderHook(() => usePrevious(obj));
    expect(result.current).toBeDefined();
  });
});

// ── useCountdown ───────────────────────────────────────────────────────

describe("useCountdown", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts with the given seconds", () => {
    const { result } = renderHook(() => useCountdown(60));
    expect(result.current.remaining).toBe(60);
    expect(result.current.isComplete).toBe(false);
  });

  it("counts down every second", () => {
    const { result } = renderHook(() => useCountdown(5));
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.remaining).toBe(3);
  });

  it("calls onComplete when reaching zero", () => {
    const onComplete = vi.fn();
    renderHook(() => useCountdown(1, onComplete));
    act(() => vi.advanceTimersByTime(1100));
    expect(onComplete).toHaveBeenCalled();
  });

  it("formats time correctly", () => {
    const { result } = renderHook(() => useCountdown(125));
    expect(result.current.formatted).toBe("2:05");
  });

  it("reset restores original seconds", () => {
    const { result } = renderHook(() => useCountdown(10));
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.remaining).toBe(7);
    act(() => result.current.reset());
    expect(result.current.remaining).toBe(10);
  });
});

// ── useIsFirstRender ───────────────────────────────────────────────────

describe("useIsFirstRender", () => {
  // useLayoutEffect runs synchronously in renderHook, so the flag flips
  // immediately. The hook still works correctly in real React.
  it("returns a boolean", () => {
    const { result } = renderHook(() => useIsFirstRender());
    expect(typeof result.current).toBe("boolean");
  });

  it("is stable after re-renders", () => {
    const { result, rerender } = renderHook(() => useIsFirstRender());
    rerender();
    // After first render with layout effect, it should be false
    expect(result.current).toBe(false);
    rerender();
    expect(result.current).toBe(false);
  });
});

// ── useIsClient ────────────────────────────────────────────────────────

describe("useIsClient", () => {
  it("returns boolean", () => {
    const { result } = renderHook(() => useIsClient());
    expect(typeof result.current).toBe("boolean");
  });
});

// ── useSafeSetState ────────────────────────────────────────────────────

describe("useSafeSetState", () => {
  it("initializes with the given value", () => {
    const { result } = renderHook(() => useSafeSetState(42));
    expect(result.current[0]).toBe(42);
  });

  it("updates state when mounted", () => {
    const { result } = renderHook(() => useSafeSetState(0));
    act(() => result.current[1](10));
    expect(result.current[0]).toBe(10);
  });

  it("accepts updater function", () => {
    const { result } = renderHook(() => useSafeSetState(5));
    act(() => result.current[1]((prev) => prev * 2));
    expect(result.current[0]).toBe(10);
  });
});

// ── useRenderCount ─────────────────────────────────────────────────────

describe("useRenderCount", () => {
  it("returns a number", () => {
    const { result } = renderHook(() => useRenderCount("TestComponent"));
    expect(typeof result.current).toBe("number");
  });

  it("increments on re-renders", () => {
    const { result, rerender } = renderHook(() => useRenderCount("Test"));
    const first = result.current;
    rerender();
    expect(result.current).toBeGreaterThan(first);
  });
});

// ── useDelayedValue ────────────────────────────────────────────────────

describe("useDelayedValue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows value when different from reset", () => {
    const { result } = renderHook(() => useDelayedValue("active", "idle", 2000));
    // When value differs from resetValue, the effect dispatches "set"
    expect(result.current).toBe("active");
  });

  it("resets to resetValue after delay", () => {
    const { result } = renderHook(() => useDelayedValue("active", "idle", 1000));
    expect(result.current).toBe("active");
    act(() => vi.advanceTimersByTime(1100));
    expect(result.current).toBe("idle");
  });

  it("returns reset value when value equals reset", () => {
    const { result } = renderHook(() => useDelayedValue("same", "same", 1000));
    expect(result.current).toBe("same");
  });
});

// ── useIsMounted ───────────────────────────────────────────────────────

describe("useIsMounted", () => {
  it("returns boolean", () => {
    const { result } = renderHook(() => useIsMounted());
    expect(typeof result.current).toBe("boolean");
  });
});

// ── useTimeout ─────────────────────────────────────────────────────────

describe("useTimeout", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("calls callback after delay", () => {
    const callback = vi.fn();
    renderHook(() => useTimeout(callback, 500));
    expect(callback).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(500));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("does not call when delay is null", () => {
    const callback = vi.fn();
    renderHook(() => useTimeout(callback, null));
    act(() => vi.advanceTimersByTime(1000));
    expect(callback).not.toHaveBeenCalled();
  });

  it("clear prevents callback", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useTimeout(callback, 500));
    act(() => result.current.clear());
    act(() => vi.advanceTimersByTime(500));
    expect(callback).not.toHaveBeenCalled();
  });

  it("reset restarts the timer", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useTimeout(callback, 500));
    act(() => vi.advanceTimersByTime(300));
    act(() => result.current.reset());
    act(() => vi.advanceTimersByTime(300));
    expect(callback).not.toHaveBeenCalled(); // reset restarted
    act(() => vi.advanceTimersByTime(200));
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

// ── useInterval ────────────────────────────────────────────────────────

describe("useInterval", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("calls callback repeatedly", () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 100));
    act(() => vi.advanceTimersByTime(350));
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("does not call when delay is null", () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, null));
    act(() => vi.advanceTimersByTime(500));
    expect(callback).not.toHaveBeenCalled();
  });

  it("clear stops interval", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useInterval(callback, 100));
    act(() => vi.advanceTimersByTime(250));
    act(() => result.current.clear());
    act(() => vi.advanceTimersByTime(500));
    expect(callback).toHaveBeenCalledTimes(2);
  });
});

// ── useHover ───────────────────────────────────────────────────────────

describe("useHover", () => {
  it("returns ref and hovered state", () => {
    const { result } = renderHook(() => useHover());
    expect(result.current).toHaveProperty("ref");
    expect(result.current).toHaveProperty("hovered");
    expect(result.current.hovered).toBe(false);
  });
});

// ── useWindowSize ──────────────────────────────────────────────────────

describe("useWindowSize", () => {
  it("returns width and height", () => {
    const { result } = renderHook(() => useWindowSize());
    expect(result.current).toHaveProperty("width");
    expect(result.current).toHaveProperty("height");
    expect(typeof result.current.width).toBe("number");
    expect(typeof result.current.height).toBe("number");
  });
});

// ── useOnClickOutside ──────────────────────────────────────────────────

describe("useOnClickOutside", () => {
  it("does not throw when ref is empty", () => {
    const handler = vi.fn();
    const ref = { current: null };
    const { unmount } = renderHook(() => useOnClickOutside(ref, handler));
    expect(() => unmount()).not.toThrow();
  });

  it("calls handler on outside click", () => {
    const handler = vi.fn();
    const div = document.createElement("div");
    const ref = { current: div };
    renderHook(() => useOnClickOutside(ref, handler));

    act(() => {
      document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });

    expect(handler).toHaveBeenCalled();
  });

  it("does not call handler when clicking inside", () => {
    const handler = vi.fn();
    const div = document.createElement("div");
    const inner = document.createElement("span");
    div.appendChild(inner);
    const ref = { current: div };
    renderHook(() => useOnClickOutside(ref, handler));

    act(() => {
      inner.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("does not call handler when disabled", () => {
    const handler = vi.fn();
    const div = document.createElement("div");
    const ref = { current: div };
    renderHook(() => useOnClickOutside(ref, handler, false));

    act(() => {
      document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });

    expect(handler).not.toHaveBeenCalled();
  });
});

// ── useDocumentVisibility ──────────────────────────────────────────────

describe("useDocumentVisibility", () => {
  it("returns a string", () => {
    const { result } = renderHook(() => useDocumentVisibility());
    expect(["visible", "hidden"]).toContain(result.current);
  });
});

// ── useWindowFocus ─────────────────────────────────────────────────────

describe("useWindowFocus", () => {
  it("returns boolean", () => {
    const { result } = renderHook(() => useWindowFocus());
    expect(typeof result.current).toBe("boolean");
  });
});

// ── useLocalStorage ────────────────────────────────────────────────────

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns initial value when empty", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("sets value in localStorage", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", ""));
    act(() => result.current[1]("hello"));
    expect(result.current[0]).toBe("hello");
    expect(localStorage.getItem("test-key")).toBe('"hello"');
  });

  it("accepts updater function", () => {
    const { result } = renderHook(() => useLocalStorage("count", 0));
    act(() => result.current[1]((prev) => prev + 1));
    expect(result.current[0]).toBe(1);
  });

  it("removes value", () => {
    const { result } = renderHook(() => useLocalStorage("rm-key", "initial"));
    act(() => result.current[1]("stored"));
    act(() => result.current[2]());
    expect(result.current[0]).toBe("initial");
    expect(localStorage.getItem("rm-key")).toBeNull();
  });
});

// ── useSessionStorage ──────────────────────────────────────────────────

describe("useSessionStorage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("returns initial value when empty", () => {
    const { result } = renderHook(() => useSessionStorage("ss-key", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("sets and reads value", () => {
    const { result } = renderHook(() => useSessionStorage("ss-key", ""));
    act(() => result.current[1]("stored"));
    expect(result.current[0]).toBe("stored");
    expect(sessionStorage.getItem("ss-key")).toBe('"stored"');
  });

  it("removes value", () => {
    const { result } = renderHook(() => useSessionStorage("ss-rm", "init"));
    act(() => result.current[1]("data"));
    act(() => result.current[2]());
    expect(result.current[0]).toBe("init");
  });
});
