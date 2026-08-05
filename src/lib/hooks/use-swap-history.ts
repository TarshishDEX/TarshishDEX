"use client";

import { useState, useCallback, useEffect } from "react";

export interface SwapHistoryEntry {
  id: string;
  timestamp: number;
  inputAsset: string;
  outputAsset: string;
  inputAmount: string;
  outputAmount: string;
  txHash?: string;
  explorerUrl?: string;
}

const STORAGE_KEY = "tarshishdex-swap-history";
const MAX_ENTRIES = 50;

/**
 * Local swap history stored in localStorage.
 * Records each completed swap with amounts and optional tx hash.
 */
export function useSwapHistory() {
  const [entries, setEntries] = useState<SwapHistoryEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
      return [];
    }
  });

  const addEntry = useCallback((entry: Omit<SwapHistoryEntry, "id" | "timestamp">) => {
    const newEntry: SwapHistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setEntries((prev) => {
      const updated = [newEntry, ...prev].slice(0, MAX_ENTRIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { entries, addEntry, clearHistory };
}
