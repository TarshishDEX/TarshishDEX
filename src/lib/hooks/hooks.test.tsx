import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ── useDisclosure ───────────────────────────────────────────────────────
import { useDisclosure } from "@/lib/hooks/use-disclosure";

describe("useDisclosure", () => {
  it("starts closed by default", () => {
    const { result } = renderHook(() => useDisclosure());
    expect(result.current.isOpen).toBe(false);
  });

  it("starts open when initialOpen=true", () => {
    const { result } = renderHook(() => useDisclosure(true));
    expect(result.current.isOpen).toBe(true);
  });

  it("open and close toggle state", () => {
    const { result } = renderHook(() => useDisclosure());
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });

  it("toggle flips state", () => {
    const { result } = renderHook(() => useDisclosure());
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
  });
});

// ── useToggle ───────────────────────────────────────────────────────────
import { useToggle } from "@/lib/hooks/use-toggle";

describe("useToggle", () => {
  it("toggles boolean state", () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current.value).toBe(false);
    act(() => result.current.toggle());
    expect(result.current.value).toBe(true);
  });

  it("accepts initial value", () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current.value).toBe(true);
  });

  it("setOn and setOff work", () => {
    const { result } = renderHook(() => useToggle());
    act(() => result.current.setOn());
    expect(result.current.value).toBe(true);
    act(() => result.current.setOff());
    expect(result.current.value).toBe(false);
  });
});

// ── useDebounce ─────────────────────────────────────────────────────────
import { useDebounce } from "@/lib/hooks/use-debounce";

describe("useDebounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 500));
    expect(result.current).toBe("hello");
  });

  it("debounces value changes", () => {
    const { result, rerender } = renderHook(
      ({ val }) => useDebounce(val, 500),
      { initialProps: { val: "first" } }
    );
    rerender({ val: "second" });
    // Value hasn't changed yet because timer hasn't fired
    expect(result.current).toBe("first");
    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe("second");
  });
});

// ── useIsMounted ────────────────────────────────────────────────────────
import { useIsMounted } from "@/lib/hooks/use-is-mounted";

describe("useIsMounted", () => {
  it("returns true after mount", () => {
    const { result } = renderHook(() => useIsMounted());
    expect(result.current).toBe(true);
  });
});

// ── useCountdown ────────────────────────────────────────────────────────
import { useCountdown } from "@/lib/hooks/use-countdown";

describe("useCountdown", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts down from initial seconds", () => {
    const { result } = renderHook(() => useCountdown(5));
    expect(result.current.remaining).toBe(5);
    expect(result.current.isComplete).toBe(false);
  });

  it("formats remaining time", () => {
    const { result } = renderHook(() => useCountdown(65));
    expect(result.current.formatted).toBe("1:05");
  });

  it("is complete when starting at 0", () => {
    const { result } = renderHook(() => useCountdown(0));
    expect(result.current.isComplete).toBe(true);
  });

  it("formats remaining time", () => {
    const { result } = renderHook(() => useCountdown(65));
    expect(result.current.formatted).toBe("1:05");
  });
});
