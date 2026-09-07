"use client";

import { useCallback, useEffect, useState } from "react";

export type SwapStatus = "pending" | "success" | "failed";

export interface SwapHistoryEntry {
  id: string;
  timestamp: number;
  inputAsset: string;
  outputAsset: string;
  inputAmount: string;
  outputAmount: string;
  txHash?: string;
  explorerUrl?: string;
  status?: SwapStatus;
}

const STORAGE_KEY = "tarshishdex-swap-history";
const SYNC_EVENT = "tarshishdex:swap-history-updated";
const MAX_ENTRIES = 50;

/** Read the full persisted swap history (newest first). */
export function readSwapHistory(): SwapHistoryEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as SwapHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSwapHistory(entries: SwapHistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage unavailable — keep in-memory state only.
  }
  // Notify other hook instances (and the history panel) on the same page.
  window.dispatchEvent(new Event(SYNC_EVENT));
}

function makeEntry(entry: Omit<SwapHistoryEntry, "id" | "timestamp">): SwapHistoryEntry {
  return {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    status: entry.status ?? "success",
  };
}

/**
 * Record a swap history entry (non-React, usable from execution flows).
 * Persists and notifies subscribers so any mounted history panel updates.
 */
export function recordSwapHistory(
  entry: Omit<SwapHistoryEntry, "id" | "timestamp">
): SwapHistoryEntry {
  const created = makeEntry(entry);
  writeSwapHistory([created, ...readSwapHistory()].slice(0, MAX_ENTRIES));
  return created;
}

/** Patch an existing entry (e.g. flip pending → success/failed once the tx settles). */
export function updateSwapHistoryEntry(id: string, patch: Partial<SwapHistoryEntry>): void {
  writeSwapHistory(readSwapHistory().map((e) => (e.id === id ? { ...e, ...patch } : e)));
}

/** Clear the persisted swap history. */
export function clearSwapHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
  window.dispatchEvent(new Event(SYNC_EVENT));
}

function subscribe(listener: () => void): () => void {
  const reload = () => listener();
  window.addEventListener(SYNC_EVENT, reload);
  window.addEventListener("storage", reload);
  return () => {
    window.removeEventListener(SYNC_EVENT, reload);
    window.removeEventListener("storage", reload);
  };
}

/**
 * Local swap history stored in localStorage. Records completed swaps with
 * amounts, status, and optional tx hash. Instances sync across the page via
 * a custom event so a history panel always reflects the latest execution.
 */
export function useSwapHistory() {
  const [entries, setEntries] = useState<SwapHistoryEntry[]>(readSwapHistory);

  useEffect(() => {
    const unsubscribe = subscribe(() => setEntries(readSwapHistory()));
    return unsubscribe;
  }, []);

  const addEntry = useCallback((entry: Omit<SwapHistoryEntry, "id" | "timestamp">) => {
    recordSwapHistory(entry);
    setEntries(readSwapHistory());
  }, []);

  const clearHistory = useCallback(() => {
    clearSwapHistory();
    setEntries([]);
  }, []);

  return { entries, addEntry, clearHistory };
}
