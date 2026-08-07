"use client";

import { useState, useEffect, useCallback } from "react";
import type { Token } from "@/lib/stellar/types";

const STORAGE_KEY = "tarshishdex-watchlist";
const MAX_WATCHLIST = 20;

function loadFromStorage(): Token[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Token[];
      if (Array.isArray(parsed)) return parsed.slice(0, MAX_WATCHLIST);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return [];
}

/**
 * Persistent watchlist of favorite tokens stored in localStorage.
 * Supports add, remove, toggle, and reorder operations.
 */
export function useWatchlist() {
  // Initialise from localStorage in the lazy initialiser to avoid
  // calling setState inside a useEffect.
  const [tokens, setTokens] = useState<Token[]>(() => loadFromStorage());

  const persist = useCallback((updated: Token[]) => {
    setTokens(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const add = useCallback(
    (token: Token) => {
      if (tokens.length >= MAX_WATCHLIST) return;
      if (tokens.some((t) => t.code === token.code && t.issuer === token.issuer)) return;
      persist([...tokens, token]);
    },
    [tokens, persist]
  );

  const remove = useCallback(
    (token: Token) => {
      persist(tokens.filter((t) => !(t.code === token.code && t.issuer === token.issuer)));
    },
    [tokens, persist]
  );

  const toggle = useCallback(
    (token: Token) => {
      if (tokens.some((t) => t.code === token.code && t.issuer === token.issuer)) {
        remove(token);
      } else {
        add(token);
      }
    },
    [tokens, add, remove]
  );

  const isWatched = useCallback(
    (token: Token) => tokens.some((t) => t.code === token.code && t.issuer === token.issuer),
    [tokens]
  );

  return { tokens, add, remove, toggle, isWatched };
}
