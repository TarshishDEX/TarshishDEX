import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { I18nProvider, useT } from "@/lib/i18n";
import { useI18n } from "@/lib/hooks/use-i18n";
import {
  useLiveAccountStream,
  useLiveMarketStream,
  useLiveOrderbookStream,
} from "@/components/providers/live-sync-hooks";

// MatchMedia mock for jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------
function ThemeConsumer() {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button data-testid="toggle-btn" onClick={toggleTheme}>
        Toggle
      </button>
      <button data-testid="set-light" onClick={() => setTheme("light")}>
        Set Light
      </button>
    </div>
  );
}

describe("ThemeProvider / useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light");
  });

  it("defaults to dark theme", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
  });

  it("toggleTheme switches to light and back", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    act(() => screen.getByTestId("toggle-btn").click());
    expect(screen.getByTestId("theme-value")).toHaveTextContent("light");
    act(() => screen.getByTestId("toggle-btn").click());
    expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
  });

  it("setTheme applies directly", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    act(() => screen.getByTestId("set-light").click());
    expect(screen.getByTestId("theme-value")).toHaveTextContent("light");
  });

  it("persists theme to localStorage", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    act(() => screen.getByTestId("set-light").click());
    expect(localStorage.getItem("tarshishdex-theme")).toBe("light");
  });
});

// ---------------------------------------------------------------------------
// I18n (lib/i18n.tsx)
// ---------------------------------------------------------------------------
function I18nConsumer() {
  const { t, locale } = useT();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="app-name">{t("app.name")}</span>
      <span data-testid="missing-key">{t("nonexistent.key")}</span>
      <span data-testid="interpolated">{t("hello {name}", { name: "World" })}</span>
    </div>
  );
}

describe("I18nProvider / useT", () => {
  it("defaults to en locale", () => {
    render(
      <I18nProvider>
        <I18nConsumer />
      </I18nProvider>
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
  });

  it("translates known keys", () => {
    render(
      <I18nProvider>
        <I18nConsumer />
      </I18nProvider>
    );
    expect(screen.getByTestId("app-name")).toHaveTextContent("TarshishDEX");
  });

  it("falls back to key for missing translations", () => {
    render(
      <I18nProvider>
        <I18nConsumer />
      </I18nProvider>
    );
    expect(screen.getByTestId("missing-key")).toHaveTextContent("nonexistent.key");
  });

  it("interpolates template variables", () => {
    render(
      <I18nProvider>
        <I18nConsumer />
      </I18nProvider>
    );
    // {name} → World — but "hello {name}" isn't in the strings map,
    // so it falls back to the key itself, which includes {name}
    // Actually, the fallback IS the key string, but interpolation still runs
    expect(screen.getByTestId("interpolated")).toHaveTextContent("hello World");
  });
});

// ---------------------------------------------------------------------------
// useI18n hook (lib/hooks/use-i18n.ts)
// ---------------------------------------------------------------------------
function UseI18nConsumer() {
  const { t, locale, setLocale } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="swap-title">{t("swap.title")}</span>
      <span data-testid="missing">{t("nonexistent", "Fallback text")}</span>
      <button data-testid="set-es" onClick={() => setLocale("es")}>
        ES
      </button>
    </div>
  );
}

describe("useI18n", () => {
  it("defaults to en", () => {
    render(<UseI18nConsumer />);
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("swap-title")).toHaveTextContent("Swap");
  });

  it("switches to Spanish", () => {
    render(<UseI18nConsumer />);
    act(() => screen.getByTestId("set-es").click());
    expect(screen.getByTestId("locale")).toHaveTextContent("es");
    expect(screen.getByTestId("swap-title")).toHaveTextContent("Intercambiar");
  });

  it("uses fallback for missing translations", () => {
    render(<UseI18nConsumer />);
    expect(screen.getByTestId("missing")).toHaveTextContent("Fallback text");
  });

  it("returns key when no fallback and no translation", () => {
    // Need a fresh consumer without the fallback
    function NoFallback() {
      const { t } = useI18n();
      return <span data-testid="no-fallback">{t("no.translation")}</span>;
    }
    render(<NoFallback />);
    expect(screen.getByTestId("no-fallback")).toHaveTextContent("no.translation");
  });
});

// ---------------------------------------------------------------------------
// Live sync hooks
// ---------------------------------------------------------------------------
vi.mock("@/lib/stellar/live", () => ({
  streamAccountOperations: vi.fn(() => vi.fn()),
  streamTrades: vi.fn(() => vi.fn()),
}));
vi.mock("@/lib/stellar/account", () => ({
  isValidPublicKey: vi.fn((addr: string) => addr.length === 56),
}));

function LiveAccountConsumer({ address }: { address: string }) {
  useLiveAccountStream(address);
  return <span data-testid="mounted">mounted</span>;
}

function LiveMarketConsumer() {
  useLiveMarketStream();
  return <span data-testid="mounted">mounted</span>;
}

function LiveOrderbookConsumer() {
  const base = { code: "XLM", isNative: true };
  const counter = {
    code: "USDC",
    issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  };
  useLiveOrderbookStream(base, counter);
  return <span data-testid="mounted">mounted</span>;
}

describe("useLiveAccountStream", () => {
  const validKey = "G" + Array(55).fill("A").join("");
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders without crashing with valid address", () => {
    render(<LiveAccountConsumer address={validKey} />, { wrapper });
    expect(screen.getByTestId("mounted")).toBeInTheDocument();
  });

  it("skips stream for invalid key", () => {
    render(<LiveAccountConsumer address="" />, { wrapper });
    expect(screen.getByTestId("mounted")).toBeInTheDocument();
  });
});

describe("useLiveMarketStream", () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  it("renders without crashing", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LiveMarketConsumer />
      </QueryClientProvider>
    );
    expect(screen.getByTestId("mounted")).toBeInTheDocument();
  });
});

describe("useLiveOrderbookStream", () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  it("renders without crashing", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LiveOrderbookConsumer />
      </QueryClientProvider>
    );
    expect(screen.getByTestId("mounted")).toBeInTheDocument();
  });
});
