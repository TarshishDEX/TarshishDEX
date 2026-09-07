import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  readValueHistory,
  upsertValueSnapshot,
  clearValueHistory,
  toDateKey,
  usePortfolioValueHistory,
} from "@/lib/hooks/use-portfolio-value-history";

const ADDRESS = "GABCDEF";

function dateKey(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return toDateKey(d);
}

describe("portfolio value snapshot storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("builds local date keys", () => {
    const d = new Date(2026, 8, 7, 15, 30);
    expect(toDateKey(d)).toBe("2026-09-07");
  });

  it("returns an empty history when nothing stored", () => {
    expect(readValueHistory(ADDRESS)).toEqual([]);
  });

  it("upserts one snapshot per day and keeps the latest value", () => {
    upsertValueSnapshot(ADDRESS, 100, new Date());
    upsertValueSnapshot(ADDRESS, 120, new Date());
    expect(readValueHistory(ADDRESS)).toHaveLength(1);
    expect(readValueHistory(ADDRESS)[0]?.value).toBe(120);
  });

  it("stores multiple days sorted oldest first", () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    upsertValueSnapshot(ADDRESS, 90, yesterday);
    upsertValueSnapshot(ADDRESS, 110, today);
    const history = readValueHistory(ADDRESS);
    expect(history.map((p) => p.value)).toEqual([90, 110]);
  });

  it("clears history", () => {
    upsertValueSnapshot(ADDRESS, 100, new Date());
    clearValueHistory(ADDRESS);
    expect(readValueHistory(ADDRESS)).toEqual([]);
  });
});

describe("usePortfolioValueHistory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("records a snapshot when a value is provided and not loading", async () => {
    const { result } = renderHook(() => usePortfolioValueHistory(ADDRESS, 150, false));
    await waitFor(() => expect(result.current.points.length).toBeGreaterThan(0));
    expect(result.current.points[0]?.value).toBe(150);
    expect(result.current.points[0]?.date).toBe(dateKey(0));
  });

  it("does not record while loading", () => {
    const { result } = renderHook(() => usePortfolioValueHistory(ADDRESS, 150, true));
    expect(result.current.points).toEqual([]);
  });

  it("keeps snapshots when the value is absent", () => {
    upsertValueSnapshot(ADDRESS, 200, new Date());
    const { result } = renderHook(() => usePortfolioValueHistory(ADDRESS, null, false));
    expect(result.current.points).toHaveLength(1);
    expect(result.current.points[0]?.value).toBe(200);
  });

  it("clears history through the returned helper", () => {
    upsertValueSnapshot(ADDRESS, 200, new Date());
    const { result } = renderHook(() => usePortfolioValueHistory(ADDRESS, null, false));
    act(() => result.current.clear());
    expect(result.current.points).toEqual([]);
    expect(readValueHistory(ADDRESS)).toEqual([]);
  });

  it("updates snapshots when the address changes", async () => {
    upsertValueSnapshot("GOTHER", 321, new Date());
    const { result, rerender } = renderHook(
      ({ address }) => usePortfolioValueHistory(address, null, false),
      { initialProps: { address: ADDRESS } }
    );
    rerender({ address: "GOTHER" });
    await waitFor(() => expect(result.current.points[0]?.value).toBe(321));
  });
});
