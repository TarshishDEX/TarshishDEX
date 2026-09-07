"use client";

import { useCallback, useEffect, useState } from "react";

/** A single daily portfolio value snapshot. */
export interface ValueSnapshot {
  /** Local date key, e.g. 2026-09-07. */
  date: string;
  /** Portfolio total value in XLM at that snapshot. */
  value: number;
}

const STORAGE_PREFIX = "tarshishdex-portfolio-value:";
const SYNC_EVENT = "tarshishdex:portfolio-value-updated";
const MAX_SNAPSHOTS = 90;

/** Build the local date key (YYYY-MM-DD) for a Date in local time. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function storageKey(address: string): string {
  return `${STORAGE_PREFIX}${address}`;
}

/** Read the stored snapshot history for an address, sorted oldest → newest. */
export function readValueHistory(address: string): ValueSnapshot[] {
  if (!address) return [];
  try {
    const raw = localStorage.getItem(storageKey(address));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ValueSnapshot[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p && typeof p.date === "string" && typeof p.value === "number")
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-MAX_SNAPSHOTS);
  } catch {
    return [];
  }
}

/** Persist history for an address (does not notify React state). */
export function upsertValueSnapshot(
  address: string,
  value: number,
  date: Date = new Date()
): ValueSnapshot[] {
  if (!address) return readValueHistory(address);
  const key = toDateKey(date);
  const existing = readValueHistory(address).filter((p) => p.date !== key);
  const next = [...existing, { date: key, value }]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_SNAPSHOTS);
  try {
    localStorage.setItem(storageKey(address), JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode / quota) — the chart still works for the session.
  }
  return next;
}

/** Remove all stored history for an address. */
export function clearValueHistory(address: string): void {
  try {
    localStorage.removeItem(storageKey(address));
  } catch {
    // Ignore storage failures.
  }
}

function dispatchSync() {
  window.dispatchEvent(new Event(SYNC_EVENT));
}

function subscribe(address: string, listener: () => void): () => void {
  const reload = () => listener();
  window.addEventListener(SYNC_EVENT, reload);
  window.addEventListener("storage", reload);
  return () => {
    window.removeEventListener(SYNC_EVENT, reload);
    window.removeEventListener("storage", reload);
  };
}

/**
 * Tracks daily portfolio value snapshots for an address in localStorage.
 * Whenever a non-null, non-loading value is observed it is upserted as that
 * calendar day's snapshot (one value per day). Instances stay in sync through
 * a custom window event so the chart always shows the latest recording.
 */
export function usePortfolioValueHistory(
  address: string,
  currentValueXlm: number | null | undefined,
  loading: boolean
) {
  const [snapshots, setSnapshots] = useState<ValueSnapshot[]>(() => readValueHistory(address));

  // Re-read from storage whenever another instance (or another tab) writes,
  // and immediately when the tracked address changes (the refresh flows through
  // the subscription's event callback rather than setting state directly here).
  useEffect(() => {
    const unsubscribe = subscribe(address, () => setSnapshots(readValueHistory(address)));
    dispatchSync();
    return unsubscribe;
  }, [address]);

  // Upsert today's snapshot once the portfolio has a real value. The write
  // happens in an effect (external side-effect) and the state refresh arrives
  // through the subscription above, so no state is set inside this effect.
  useEffect(() => {
    if (loading || typeof currentValueXlm !== "number" || !Number.isFinite(currentValueXlm)) {
      return;
    }
    const existing = readValueHistory(address);
    const today = toDateKey(new Date());
    const alreadyToday = existing.find((p) => p.date === today);
    if (alreadyToday && alreadyToday.value === currentValueXlm) {
      return;
    }
    upsertValueSnapshot(address, currentValueXlm);
    dispatchSync();
  }, [address, currentValueXlm, loading]);

  const recordToday = useCallback(
    (value: number, date: Date = new Date()) => {
      upsertValueSnapshot(address, value, date);
      dispatchSync();
    },
    [address]
  );

  const clear = useCallback(() => {
    clearValueHistory(address);
    dispatchSync();
  }, [address]);

  return { points: snapshots, recordToday, clear };
}
