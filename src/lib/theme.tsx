"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

const STORAGE_KEY = "tarshishdex-theme";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light") return "light";
  // Respect system preference when no stored value
  if (stored === null && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.style.colorScheme = theme;
}

/** Provider that manages dark/light theme state and persists to localStorage. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Hydrate theme from localStorage in the lazy initialiser to avoid
  // calling setState inside a useEffect. Also apply the theme class
  // immediately in the initialiser to avoid a flash of wrong theme.
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme();
    applyTheme(stored);
    return stored;
  });

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Consume the current theme and toggle/set functions. */
export function useTheme() {
  return useContext(ThemeContext);
}
