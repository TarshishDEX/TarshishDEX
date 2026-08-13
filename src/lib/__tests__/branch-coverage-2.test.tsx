import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";

// =========================================================================
// use-safe-set-state — skip update after unmount
// =========================================================================

import { useSafeSetState } from "@/lib/hooks/use-safe-set-state";

describe("useSafeSetState", () => {
  it("skips state updates after unmount", () => {
    const { result, unmount } = renderHook(() => useSafeSetState(0));
    unmount();
    act(() => {
      result.current[1](99);
    });
    // No throw — the setter guard returned early.
    expect(result.current[0]).toBe(0);
  });
});

// =========================================================================
// use-session-storage — updater function form
// =========================================================================

import { useSessionStorage } from "@/lib/hooks/use-session-storage";

describe("useSessionStorage updater", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("supports the updater function form", () => {
    const { result } = renderHook(() => useSessionStorage("upd-key", "a"));
    act(() => {
      result.current[1]((prev) => prev + "!");
    });
    expect(result.current[0]).toBe("a!");
  });
});

// =========================================================================
// use-local-storage-value — storage event ignores other keys
// =========================================================================

import { useLocalStorageValue } from "@/lib/hooks/use-local-storage-value";

describe("useLocalStorageValue storage event", () => {
  it("ignores storage events for other keys", () => {
    const { result } = renderHook(() => useLocalStorageValue("lsv-key", "default"));
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "other-key", newValue: "ignored" }));
    });
    expect(result.current[0]).toBe("default");
  });
});

// =========================================================================
// try-catch — non-Error values
// =========================================================================

import { tryCatch, tryCatchSync } from "@/lib/utils/try-catch";

describe("tryCatch non-Error", () => {
  it("wraps a non-Error rejection", async () => {
    const [data, error] = await tryCatch(() => Promise.reject("boom"));
    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error!.message).toBe("boom");
  });

  it("wraps a non-Error throw synchronously", () => {
    const [data, error] = tryCatchSync(() => {
      throw "sync boom";
    });
    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error!.message).toBe("sync boom");
  });
});

// =========================================================================
// SSR snapshots for window/document-dependent hooks
// =========================================================================

import { useWindowSize } from "@/lib/hooks/use-window-size";
import { useDocumentVisibility } from "@/lib/hooks/use-document-visibility";
import { useWindowFocus } from "@/lib/hooks/use-window-focus";

describe("SSR hook snapshots", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("useWindowSize returns zero dimensions during SSR", () => {
    vi.stubGlobal("window", undefined);
    function Probe() {
      const { width, height } = useWindowSize();
      return <span>{`${width}-${height}`}</span>;
    }
    expect(renderToString(<Probe />)).toContain("0-0");
  });

  it("useDocumentVisibility returns visible during SSR", () => {
    vi.stubGlobal("document", undefined);
    function Probe() {
      const visibility = useDocumentVisibility();
      return <span>{visibility}</span>;
    }
    expect(renderToString(<Probe />)).toContain("visible");
  });

  it("useWindowFocus returns true during SSR", () => {
    vi.stubGlobal("document", undefined);
    function Probe() {
      const focused = useWindowFocus();
      return <span>{String(focused)}</span>;
    }
    expect(renderToString(<Probe />)).toContain("true");
  });
});

// =========================================================================
// use-keyboard-shortcuts — meta and shift modifiers
// =========================================================================

import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";

describe("useKeyboardShortcuts modifiers", () => {
  it("fires on meta modifier", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: "k", meta: true, handler, description: "palette" }])
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
    expect(handler).toHaveBeenCalled();
  });

  it("fires on shift modifier", () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: "s", shift: true, handler, description: "save" }])
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", shiftKey: true }));
    expect(handler).toHaveBeenCalled();
  });
});

// =========================================================================
// use-why-did-you-update — unchanged props do not log
// =========================================================================

import { useWhyDidYouUpdate } from "@/lib/hooks/use-why-did-you-update";

describe("useWhyDidYouUpdate unchanged props", () => {
  it("does not log when props are unchanged", () => {
    const groupSpy = vi.spyOn(console, "group").mockImplementation(() => {});
    const { rerender } = renderHook((props) => useWhyDidYouUpdate("T", props), {
      initialProps: { a: 1 },
    });
    const callsAfterFirstRender = groupSpy.mock.calls.length;
    rerender({ a: 1 });
    expect(groupSpy.mock.calls.length).toBe(callsAfterFirstRender);
    groupSpy.mockRestore();
  });
});

// =========================================================================
// use-portfolio-pnl — null valueInXlm
// =========================================================================

import { usePortfolioPnL } from "@/lib/hooks/use-portfolio-pnl";
import type { AccountBalance } from "@/lib/stellar/account";

describe("usePortfolioPnL null value", () => {
  it("treats a null valueInXlm as zero", () => {
    const balances: AccountBalance[] = [
      {
        token: { code: "XLM", name: "Lumen", decimals: 7, isNative: true },
        balance: 100,
        valueInXlm: null,
        trustline: false,
      },
    ];
    const { result } = renderHook(() => usePortfolioPnL(balances));
    expect(result.current.pnlByAsset[0]?.currentValue).toBe(0);
    expect(result.current.totalPnl).toBe(0);
  });
});
