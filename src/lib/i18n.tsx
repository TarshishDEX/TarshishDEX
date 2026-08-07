/**
 * Internationalization (i18n) stub for TarshishDEX.
 *
 * Currently returns English-only strings. To add a language:
 * 1. Create `src/lib/i18n/locales/{lang}.json` with key-value pairs.
 * 2. Add a language switcher that calls `setLocale(...)`.
 * 3. Wrap the app with `I18nProvider` and use `useT()` in components.
 *
 * The `t()` function supports basic interpolation: t("hello {name}", { name: "World" }).
 */

"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Locale = "en";

const DEFAULT_LOCALE: Locale = "en";

/** Placeholder entries — replace with locale files for real i18n. */
const strings: Record<Locale, Record<string, string>> = {
  en: {
    "app.name": "TarshishDEX",
    "app.tagline": "The trading gateway to the Stellar ecosystem",
    "nav.swap": "Swap",
    "nav.markets": "Markets",
    "nav.portfolio": "Portfolio",
    "nav.assets": "Assets",
    "nav.analytics": "Analytics",
    "wallet.connect": "Connect Wallet",
    "wallet.disconnect": "Disconnect",
    "swap.title": "Swap",
    "swap.from": "From",
    "swap.to": "To",
    "swap.review": "Review Swap",
    "common.loading": "Loading…",
    "common.error": "Something went wrong",
    "common.retry": "Try again",
  },
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key: string) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const template = strings[locale]?.[key] ?? key;
      if (!vars) return template;
      return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
    },
    [locale]
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

/** Translation hook for components. */
export function useT() {
  const { t, locale } = useContext(I18nContext);
  return { t, locale };
}
