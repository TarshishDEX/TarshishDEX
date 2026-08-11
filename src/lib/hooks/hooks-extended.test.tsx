import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorageValue } from "@/lib/hooks/use-local-storage-value";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn(() => null),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe("useLocalStorageValue", () => {
  it("returns initial value when no stored value", () => {
    const { result } = renderHook(() =>
      useLocalStorageValue("test-key", "default")
    );
    expect(result.current[0]).toBe("default");
  });

  it("hydrates from localStorage", () => {
    localStorageMock.setItem("test-key", "stored-value");
    const { result } = renderHook(() =>
      useLocalStorageValue("test-key", "default")
    );
    expect(result.current[0]).toBe("stored-value");
  });

  it("update writes to localStorage", () => {
    const { result } = renderHook(() =>
      useLocalStorageValue("test-key", "default")
    );
    act(() => {
      result.current[1]("new-value");
    });
    expect(result.current[0]).toBe("new-value");
    expect(localStorageMock.setItem).toHaveBeenCalledWith("test-key", "new-value");
  });

  it("remove clears value and localStorage", () => {
    localStorageMock.setItem("test-key", "stored");
    const { result } = renderHook(() =>
      useLocalStorageValue("test-key", "default")
    );
    act(() => {
      result.current[2]();
    });
    expect(result.current[0]).toBe("default");
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("test-key");
  });

  it("updates on storage event from other tab", () => {
    const { result } = renderHook(() =>
      useLocalStorageValue("test-key", "default")
    );
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "test-key", newValue: "other-tab" })
      );
    });
    expect(result.current[0]).toBe("other-tab");
  });
});
