"use client";

import { useState, useCallback } from "react";

type Locale = "en" | "es" | "ja" | "ko" | "zh";

// Minimal translation map — extend as needed.
const translations: Record<Locale, Record<string, string>> = {
  en: {
    "swap.title": "Swap",
    "swap.pay": "You pay",
    "swap.receive": "You receive",
    "swap.review": "Review Swap",
    "swap.connect": "Connect Wallet to Swap",
    "markets.title": "Markets",
    "portfolio.title": "Portfolio",
    "assets.title": "Assets",
    "analytics.title": "Analytics",
    "common.connect": "Connect Wallet",
    "common.disconnect": "Disconnect",
    "common.loading": "Loading…",
    "common.error": "Something went wrong",
    "common.retry": "Retry",
  },
  es: {
    "swap.title": "Intercambiar",
    "swap.pay": "Tú pagas",
    "swap.receive": "Tú recibes",
    "swap.connect": "Conectar billetera para intercambiar",
    "markets.title": "Mercados",
    "portfolio.title": "Portafolio",
    "common.connect": "Conectar billetera",
    "common.disconnect": "Desconectar",
    "common.loading": "Cargando…",
  },
  ja: {
    "swap.title": "スワップ",
    "swap.pay": "支払い",
    "swap.receive": "受取",
    "markets.title": "マーケット",
    "common.connect": "ウォレット接続",
  },
  ko: {
    "swap.title": "스왑",
    "markets.title": "마켓",
    "common.connect": "지갑 연결",
  },
  zh: {
    "swap.title": "兑换",
    "markets.title": "市场",
    "common.connect": "连接钱包",
  },
};

/**
 * Minimal i18n hook. Returns the current locale, a translation function,
 * and a setter. Falls back to the English key when a translation is missing.
 */
export function useI18n() {
  const [locale, setLocale] = useState<Locale>("en");

  const t = useCallback(
    (key: string, fallback?: string): string => {
      return translations[locale]?.[key] ?? fallback ?? key;
    },
    [locale]
  );

  return { locale, setLocale, t };
}
