import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEventListener } from "@/lib/hooks/use-event-listener";
import { useIntersectionObserver } from "@/lib/hooks/use-intersection-observer";
import { useEffectOnce } from "@/lib/hooks/use-effect-once";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { useAutoRefresh } from "@/lib/hooks/use-auto-refresh";
import { useWatchlist } from "@/lib/hooks/use-watchlist";
import { useSwapHistory } from "@/lib/hooks/use-swap-history";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useUpdateEffect } from "@/lib/hooks/use-update-effect";
import { useNetworkName, useNetworkId } from "@/lib/hooks/use-network-name";

// ── Mock stellar config for useNetworkName ─────────────────────────────

vi.mock("@/lib/stellar/config", () => ({
  getActiveNetwork: vi.fn(() => ({ name: "testnet", label: "Testnet" })),
}));

// ── useEventListener ───────────────────────────────────────────────────

describe("useEventListener", () => {
  it("registers event listener on window", () => {
    const listener = vi.fn();
    renderHook(() => useEventListener(window, "click", listener));
    window.dispatchEvent(new MouseEvent("click"));
    expect(listener).toHaveBeenCalled();
  });

  it("does not register when target is null", () => {
    const listener = vi.fn();
    renderHook(() => useEventListener(null, "click", listener));
    window.dispatchEvent(new MouseEvent("click"));
    expect(listener).not.toHaveBeenCalled();
  });

  it("cleans up on unmount", () => {
    const listener = vi.fn();
    const { unmount } = renderHook(() => useEventListener(window, "click", listener));
    unmount();
    window.dispatchEvent(new MouseEvent("click"));
    expect(listener).not.toHaveBeenCalled();
  });
});

// ── useIntersectionObserver ────────────────────────────────────────────

describe("useIntersectionObserver", () => {
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockUnobserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockObserve = vi.fn();
    mockUnobserve = vi.fn();
    mockDisconnect = vi.fn();
    (global as unknown as Record<string, unknown>).IntersectionObserver = vi.fn(() => ({
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
    }));
  });

  afterEach(() => {
    delete (global as unknown as Record<string, unknown>).IntersectionObserver;
  });

  it("returns ref and isIntersecting", () => {
    const { result } = renderHook(() => useIntersectionObserver());
    expect(result.current).toHaveProperty("ref");
    expect(result.current).toHaveProperty("isIntersecting");
    expect(result.current.isIntersecting).toBe(false);
  });

  it("does not crash when observing null ref", () => {
    const { result } = renderHook(() => useIntersectionObserver());
    expect(result.current.ref.current).toBeNull();
  });
});

// ── useEffectOnce ──────────────────────────────────────────────────────

describe("useEffectOnce", () => {
  it("calls effect once", () => {
    const effect = vi.fn();
    const { rerender } = renderHook(() => useEffectOnce(effect));
    rerender();
    rerender();
    expect(effect).toHaveBeenCalledTimes(1);
  });

  it("calls cleanup on unmount", () => {
    const cleanup = vi.fn();
    const effect = vi.fn(() => cleanup);
    const { unmount } = renderHook(() => useEffectOnce(effect));
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});

// ── useKeyboardShortcuts ──────────────────────────────────────────────

describe("useKeyboardShortcuts", () => {
  it("fires handler on matching key", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: "a", handler, description: "Test" }])
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    expect(handler).toHaveBeenCalled();
  });

  it("does not fire on non-matching key", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: "a", handler, description: "Test" }])
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "b" }));
    expect(handler).not.toHaveBeenCalled();
  });

  it("supports ctrl modifier", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: "s", ctrl: true, handler, description: "Save" }])
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", ctrlKey: true }));
    expect(handler).toHaveBeenCalled();
  });

  it("ignores shortcuts when focused on input", () => {
    const handler = vi.fn();
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    renderHook(() =>
      useKeyboardShortcuts([{ key: "a", handler, description: "Test" }])
    );

    const event = new KeyboardEvent("keydown", { key: "a", bubbles: true });
    Object.defineProperty(event, "target", { value: input });
    window.dispatchEvent(event);
    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });
});

// ── useAutoRefresh ─────────────────────────────────────────────────────

describe("useAutoRefresh", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("calls callback on interval when enabled", () => {
    const callback = vi.fn();
    renderHook(() => useAutoRefresh(callback, 1000, true));
    act(() => vi.advanceTimersByTime(3000));
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("toggles enabled state", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useAutoRefresh(callback, 1000, true));
    expect(result.current.enabled).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.enabled).toBe(false);
  });
});

// ── useWatchlist ───────────────────────────────────────────────────────

describe("useWatchlist", () => {
  beforeEach(() => localStorage.clear());

  it("starts with empty watchlist", () => {
    const { result } = renderHook(() => useWatchlist());
    expect(result.current.tokens).toHaveLength(0);
  });

  it("adds a token", () => {
    const { result } = renderHook(() => useWatchlist());
    const token = {
      code: "USDC",
      issuer: "G...",
      name: "USD Coin",
      decimals: 7,
    };
    act(() => result.current.add(token));
    expect(result.current.tokens).toHaveLength(1);
    expect(result.current.tokens[0].code).toBe("USDC");
  });

  it("removes a token", () => {
    const { result } = renderHook(() => useWatchlist());
    const token = {
      code: "USDC",
      issuer: "G...",
      name: "USD Coin",
      decimals: 7,
    };
    act(() => result.current.add(token));
    act(() => result.current.remove(token));
    expect(result.current.tokens).toHaveLength(0);
  });

  it("toggles token presence", () => {
    const { result } = renderHook(() => useWatchlist());
    const token = {
      code: "XLM",
      name: "Stellar Lumens",
      decimals: 7,
      isNative: true,
    };
    act(() => result.current.toggle(token));
    expect(result.current.tokens).toHaveLength(1);
    act(() => result.current.toggle(token));
    expect(result.current.tokens).toHaveLength(0);
  });

  it("isWatched returns correct state", () => {
    const { result } = renderHook(() => useWatchlist());
    const token = {
      code: "EURMTL",
      issuer: "G...",
      name: "EURMTL",
      decimals: 7,
    };
    expect(result.current.isWatched(token)).toBe(false);
    act(() => result.current.add(token));
    expect(result.current.isWatched(token)).toBe(true);
  });
});

// ── useSwapHistory ─────────────────────────────────────────────────────

describe("useSwapHistory", () => {
  beforeEach(() => localStorage.clear());

  it("starts empty", () => {
    const { result } = renderHook(() => useSwapHistory());
    expect(result.current.entries).toHaveLength(0);
  });

  it("adds an entry", () => {
    const { result } = renderHook(() => useSwapHistory());
    act(() =>
      result.current.addEntry({
        inputAsset: "XLM",
        outputAsset: "USDC",
        inputAmount: "100",
        outputAmount: "90",
      })
    );
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].inputAsset).toBe("XLM");
  });

  it("clears history", () => {
    const { result } = renderHook(() => useSwapHistory());
    act(() =>
      result.current.addEntry({
        inputAsset: "XLM",
        outputAsset: "USDC",
        inputAmount: "100",
        outputAmount: "90",
      })
    );
    act(() => result.current.clearHistory());
    expect(result.current.entries).toHaveLength(0);
  });
});

// ── usePageTitle ───────────────────────────────────────────────────────

describe("usePageTitle", () => {
  it("sets the document title", () => {
    renderHook(() => usePageTitle("Swap"));
    expect(document.title).toContain("Swap");
    expect(document.title).toContain("TarshishDEX");
  });

  it("restores title on unmount", () => {
    const original = document.title;
    const { unmount } = renderHook(() => usePageTitle("Markets"));
    unmount();
    expect(document.title).toBe(original);
  });

  it("handles empty title", () => {
    renderHook(() => usePageTitle(""));
    expect(document.title).toContain("TarshishDEX");
  });
});

// ── useUpdateEffect ────────────────────────────────────────────────────

describe("useUpdateEffect", () => {
  it("does not fire on initial mount", () => {
    const effect = vi.fn();
    renderHook(() => useUpdateEffect(effect, [1]));
    expect(effect).not.toHaveBeenCalled();
  });

  it("fires on subsequent updates", () => {
    const effect = vi.fn();
    const { rerender } = renderHook(
      ({ dep }) => useUpdateEffect(effect, [dep]),
      { initialProps: { dep: 1 } }
    );
    rerender({ dep: 2 });
    expect(effect).toHaveBeenCalledTimes(1);
  });
});

// ── useNetworkName ─────────────────────────────────────────────────────

describe("useNetworkName", () => {
  it("returns network label", () => {
    const { result } = renderHook(() => useNetworkName());
    expect(result.current).toBe("Testnet");
  });
});

describe("useNetworkId", () => {
  it("returns network id", () => {
    const { result } = renderHook(() => useNetworkId());
    expect(result.current).toBe("testnet");
  });
});
