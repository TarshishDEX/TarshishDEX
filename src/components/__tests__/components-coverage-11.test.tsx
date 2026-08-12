import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VolumeChart } from "@/components/charts/volume-chart";
import { WalletProvider } from "@/components/providers/wallet-provider";
import { NotificationCenter } from "@/components/features/notification-center";
import { Analytics } from "@/lib/analytics";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { useSwapHistory } from "@/lib/hooks/use-swap-history";
import { useSessionStorage } from "@/lib/hooks/use-session-storage";
import { useRenderCount } from "@/lib/hooks/use-render-count";
import { useTokenBalance } from "@/lib/hooks/use-token-balance";
import { toast } from "@/components/ui/toast";
import { useWallet } from "@/lib/stellar/wallet-store";
import { useWalletStore } from "@/lib/stellar/wallet-store";

const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

// =========================================================================
// Mocks
// =========================================================================

const { connectMock, disconnectMock, setConnectedMock, setDisconnectedMock, getHorizonServerMock } =
  vi.hoisted(() => ({
    connectMock: vi.fn().mockResolvedValue(true),
    disconnectMock: vi.fn(),
    setConnectedMock: vi.fn(),
    setDisconnectedMock: vi.fn(),
    getHorizonServerMock: vi.fn(),
  }));

// Recharts mock that captures formatter functions so their branches get covered.
vi.mock("recharts", () => {
  const React = require("react");
  const captured: Record<string, unknown> = {};
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="container">{children}</div>
    ),
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="bar-chart">{children}</div>
    ),
    Bar: () => <div data-testid="bar" />,
    CartesianGrid: () => <div />,
    XAxis: () => <div />,
    YAxis: ({ tickFormatter }: { tickFormatter: (v: number) => string }) => {
      captured.tick = tickFormatter;
      return <div data-testid="yaxis" />;
    },
    Tooltip: ({ formatter }: { formatter: (v: unknown) => unknown }) => {
      captured.format = formatter;
      return <div data-testid="tooltip" />;
    },
  };
});

const { subscribeMock } = vi.hoisted(() => ({ subscribeMock: vi.fn() }));
vi.mock("@/lib/stellar/wallet-kit", () => ({
  subscribeWalletEvents: subscribeMock,
  isWalletAvailable: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/stellar/wallet-store", () => ({
  useWallet: () => ({
    address: VALID_ADDRESS,
    status: "connected",
    connect: connectMock,
    disconnect: disconnectMock,
  }),
  useWalletStore: {
    getState: () => ({ setConnected: setConnectedMock, setDisconnected: setDisconnectedMock }),
  },
}));

vi.mock("@/lib/stellar/queries", () => ({
  useXlmBalance: () => ({ data: "1234.5" }),
}));

vi.mock("@/lib/stellar/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stellar/config")>();
  return {
    ...actual,
    explorerAccountUrl: (a: string) => `https://explorer/${a}`,
  };
});

vi.mock("@/components/ui/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/components/wallet/disconnect-dialog", () => ({
  DisconnectDialog: ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => (
    <div data-testid="disconnect-dialog">
      <button data-testid="confirm" onClick={onConfirm}>
        Confirm
      </button>
      <button data-testid="cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("@/lib/stellar/horizon", () => ({
  getHorizonServer: getHorizonServerMock,
}));

vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => <div data-testid="vercel-analytics" />,
}));
vi.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => <div data-testid="vercel-speed" />,
}));

function withProviders(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

// =========================================================================
// VolumeChart
// =========================================================================

describe("VolumeChart", () => {
  it("maps candles into the chart data shape", () => {
    render(
      <VolumeChart
        candles={[
          { timestamp: 1700000000000, open: 1, high: 2, low: 0.5, close: 1.5, volumeBase: 10, volumeCounter: 2000, tradeCount: 5 },
        ]}
      />
    );
    expect(screen.getByTestId("bar-chart")).toBeTruthy();
    expect(screen.getByTestId("yaxis")).toBeTruthy();
    expect(screen.getByTestId("tooltip")).toBeTruthy();
  });

  it("handles empty candle arrays", () => {
    render(<VolumeChart candles={[]} />);
    expect(screen.getByTestId("bar-chart")).toBeTruthy();
  });
});

// =========================================================================
// WalletProvider
// =========================================================================

describe("WalletProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes to wallet events and syncs on state update", async () => {
    let onStateUpdated: (a: string | undefined, n: string) => void = () => {};
    let onDisconnect: () => void = () => {};
    subscribeMock.mockImplementation((callbacks: {
      onStateUpdated?: (a: string | undefined, n: string) => void;
      onDisconnect?: () => void;
    }) => {
      onStateUpdated = callbacks.onStateUpdated ?? (() => {});
      onDisconnect = callbacks.onDisconnect ?? (() => {});
      return Promise.resolve(() => undefined);
    });
    render(<WalletProvider>child</WalletProvider>);
    await act(async () => {});
    expect(subscribeMock).toHaveBeenCalled();
    act(() => {
      onStateUpdated(VALID_ADDRESS, "testnet");
    });
    expect(setConnectedMock).toHaveBeenCalledWith(VALID_ADDRESS, "testnet");
    act(() => {
      onStateUpdated(undefined, "testnet");
    });
    expect(setDisconnectedMock).toHaveBeenCalled();
    act(() => {
      onDisconnect();
    });
    expect(setDisconnectedMock).toHaveBeenCalledTimes(2);
  });

  it("cleans up when unmounted before subscription resolves", async () => {
    const cleanup = vi.fn();
    let resolveSub: (c: () => void) => void = () => {};
    subscribeMock.mockImplementation(() => {
      return new Promise<() => void>((resolve) => {
        resolveSub = resolve;
      });
    });
    const { unmount } = render(<WalletProvider>child</WalletProvider>);
    unmount();
    act(() => {
      resolveSub(() => {
        cleanup();
      });
    });
    await act(async () => {});
    expect(cleanup).toHaveBeenCalled();
  });

  it("unsubscribes on unmount after resolve", async () => {
    const unsub = vi.fn();
    subscribeMock.mockResolvedValue(unsub);
    const { unmount } = render(<WalletProvider>child</WalletProvider>);
    await act(async () => {});
    unmount();
    expect(unsub).toHaveBeenCalled();
  });
});

// =========================================================================
// NotificationCenter
// =========================================================================

const NOTIFS: Array<{
  id: string;
  title: string;
  body: string;
  type: "swap" | "alert" | "system";
  timestamp: number;
  read: boolean;
}> = [
  { id: "n1", title: "Swap completed", body: "1 XLM → 0.5 USDC", type: "swap", timestamp: 1700000000000, read: false },
  { id: "n2", title: "Price alert", body: "XLM above 0.15", type: "alert", timestamp: 1700003600000, read: true },
];

describe("NotificationCenter", () => {
  it("shows unread badge and opens the panel", () => {
    render(<NotificationCenter initialNotifications={[...NOTIFS]} />);
    expect(screen.getByLabelText("Notifications (1 unread)")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Notifications (1 unread)"));
    expect(screen.getByText("Swap completed")).toBeTruthy();
    expect(screen.getByText("Price alert")).toBeTruthy();
  });

  it("marks all notifications as read", () => {
    render(<NotificationCenter initialNotifications={[...NOTIFS]} />);
    fireEvent.click(screen.getByLabelText("Notifications (1 unread)"));
    fireEvent.click(screen.getByText("Mark read"));
    expect(screen.getByLabelText("Notifications (0 unread)")).toBeTruthy();
  });

  it("clears all notifications", () => {
    render(<NotificationCenter initialNotifications={[...NOTIFS]} />);
    fireEvent.click(screen.getByLabelText("Notifications (1 unread)"));
    fireEvent.click(screen.getByText("Clear"));
    expect(screen.getByText("No notifications")).toBeTruthy();
  });

  it("renders an empty state with no notifications", () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByLabelText("Notifications (0 unread)"));
    expect(screen.getByText("No notifications")).toBeTruthy();
  });
});

// =========================================================================
// Analytics (production branch)
// =========================================================================

describe("Analytics", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(Analytics()).toBeNull();
  });

  it("renders Vercel analytics in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const el = Analytics() as ReactNode;
    render(<div>{el}</div>);
    expect(screen.getByTestId("vercel-analytics")).toBeTruthy();
    expect(screen.getByTestId("vercel-speed")).toBeTruthy();
  });
});

// =========================================================================
// Events route (SSE stream)
// =========================================================================

describe("events route", () => {
  it("streams a connected event then heartbeat chunks", async () => {
    vi.useFakeTimers();
    const { GET } = await import("@/app/api/events/route");
    const res = await GET();
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    const reader = (res.body as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();
    const first = await reader.read();
    expect(decoder.decode(first.value)).toContain("event: connected");
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    const second = await reader.read();
    expect(decoder.decode(second.value)).toContain("heartbeat");
    await reader.cancel();
    vi.useRealTimers();
  });
});

// =========================================================================
// ConnectWalletButton connected flow
// =========================================================================

describe("ConnectWalletButton connected flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the truncated address and balance dropdown", async () => {
    withProviders(<ConnectWalletButton />);
    expect(screen.getByText(/GAAA/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /GAAA/ }));
    expect(screen.getByText("Connected account")).toBeTruthy();
    expect(screen.getByText(/Balance:/)).toBeTruthy();
    expect(screen.getByText("View on explorer ↗")).toBeTruthy();
  });

  it("switch account reopens the wallet picker", async () => {
    withProviders(<ConnectWalletButton />);
    fireEvent.click(screen.getByRole("button", { name: /GAAA/ }));
    fireEvent.click(screen.getByText("Switch account"));
    await waitFor(() => expect(connectMock).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("Wallet connected");
  });

  it("opens the disconnect dialog and confirms disconnect", async () => {
    withProviders(<ConnectWalletButton />);
    fireEvent.click(screen.getByRole("button", { name: /GAAA/ }));
    fireEvent.click(screen.getByText("Disconnect"));
    expect(screen.getByTestId("disconnect-dialog")).toBeTruthy();
    fireEvent.click(screen.getByTestId("confirm"));
    expect(disconnectMock).toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith("Wallet disconnected");
  });

  it("closes the dropdown on outside click and escape", async () => {
    withProviders(<ConnectWalletButton />);
    fireEvent.click(screen.getByRole("button", { name: /GAAA/ }));
    expect(screen.getByText("Connected account")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Connected account")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /GAAA/ }));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Connected account")).toBeNull();
  });
});

// =========================================================================
// useTokenBalance (fetch branches)
// =========================================================================

describe("useTokenBalance", () => {
  beforeEach(() => {
    getHorizonServerMock.mockReturnValue({
      accounts: () => ({
        accountId: () => ({
          call: () => Promise.resolve({ balances: [] }),
        }),
      }),
    });
  });

  function makeWrapper() {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
  }

  it("leaves the query disabled with an invalid address", async () => {
    const { result } = renderHook(() => useTokenBalance("bad", { code: "XLM", isNative: true }), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isFetched).toBe(false));
    expect(result.current.data).toBeUndefined();
  });

  it("leaves the query disabled with no asset", async () => {
    const { result } = renderHook(() => useTokenBalance(VALID_ADDRESS, null), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isFetched).toBe(false));
    expect(result.current.data).toBeUndefined();
  });

  it("returns the native balance when the asset is XLM", async () => {
    getHorizonServerMock.mockReturnValue({
      accounts: () => ({
        accountId: () => ({
          call: () =>
            Promise.resolve({
              balances: [
                { asset_type: "native", balance: "77.7" },
                { asset_type: "credit_alphanum4", asset_code: "USDC", asset_issuer: VALID_ADDRESS, balance: "5" },
              ],
            }),
        }),
      }),
    });
    const { result } = renderHook(() => useTokenBalance(VALID_ADDRESS, { code: "XLM", isNative: true }), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.data).toBe("77.7"));
  });

  it("returns the issued balance and skips liquidity pools", async () => {
    getHorizonServerMock.mockReturnValue({
      accounts: () => ({
        accountId: () => ({
          call: () =>
            Promise.resolve({
              balances: [
                { asset_type: "liquidity_pool_shares", balance: "99" },
                { asset_type: "credit_alphanum4", asset_code: "USDC", asset_issuer: VALID_ADDRESS, balance: "12.5" },
              ],
            }),
        }),
      }),
    });
    const { result } = renderHook(
      () => useTokenBalance(VALID_ADDRESS, { code: "USDC", issuer: VALID_ADDRESS }),
      { wrapper: makeWrapper() }
    );
    await waitFor(() => expect(result.current.data).toBe("12.5"));
  });

  it("returns null when the asset is not held", async () => {
    const { result } = renderHook(() => useTokenBalance(VALID_ADDRESS, { code: "EURT", issuer: VALID_ADDRESS }), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.data).toBeNull());
  });
});

// =========================================================================
// useLocalStorage
// =========================================================================

describe("useLocalStorage", () => {
  function Harness() {
    const [value, setValue, remove] = useLocalStorage<number>("ls-key", 1);
    return (
      <div>
        <span data-testid="ls-value">{value}</span>
        <button data-testid="ls-set" onClick={() => setValue(42)}>
          set
        </button>
        <button data-testid="ls-fn" onClick={() => setValue((v: number) => (v ?? 0) + 1)}>
          fn
        </button>
        <button data-testid="ls-remove" onClick={remove}>
          remove
        </button>
      </div>
    );
  }

  it("hydrates, sets, updates functionally and removes", () => {
    localStorage.setItem("ls-key", "5");
    render(<Harness />);
    expect(screen.getByTestId("ls-value").textContent).toBe("5");
    fireEvent.click(screen.getByTestId("ls-fn"));
    expect(screen.getByTestId("ls-value").textContent).toBe("6");
    expect(JSON.parse(localStorage.getItem("ls-key") ?? "")).toBe(6);
    fireEvent.click(screen.getByTestId("ls-set"));
    expect(screen.getByTestId("ls-value").textContent).toBe("42");
    fireEvent.click(screen.getByTestId("ls-remove"));
    expect(screen.getByTestId("ls-value").textContent).toBe("1");
    expect(localStorage.getItem("ls-key")).toBeNull();
  });

  it("recovers from corrupt stored JSON", () => {
    localStorage.setItem("ls-key", "{oops");
    render(<Harness />);
    expect(screen.getByTestId("ls-value").textContent).toBe("1");
  });

  it("syncs across tabs via storage events", () => {
    render(<Harness />);
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "ls-key", newValue: "99" }));
    });
    expect(screen.getByTestId("ls-value").textContent).toBe("99");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "other", newValue: "1" }));
    });
    expect(screen.getByTestId("ls-value").textContent).toBe("99");
  });
});

// =========================================================================
// useSwapHistory
// =========================================================================

describe("useSwapHistory", () => {
  function Harness() {
    const { entries, addEntry, clearHistory } = useSwapHistory();
    return (
      <div>
        <span data-testid="sh-count">{entries.length}</span>
        <button
          data-testid="sh-add"
          onClick={() =>
            addEntry({ inputAsset: "XLM", outputAsset: "USDC", inputAmount: "1", outputAmount: "0.5" })
          }
        >
          add
        </button>
        <button data-testid="sh-clear" onClick={clearHistory}>
          clear
        </button>
      </div>
    );
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it("adds entries, persists and clears", () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId("sh-add"));
    fireEvent.click(screen.getByTestId("sh-add"));
    expect(screen.getByTestId("sh-count").textContent).toBe("2");
    const stored = JSON.parse(localStorage.getItem("tarshishdex-swap-history") ?? "[]");
    expect(stored).toHaveLength(2);
    fireEvent.click(screen.getByTestId("sh-clear"));
    expect(screen.getByTestId("sh-count").textContent).toBe("0");
    expect(localStorage.getItem("tarshishdex-swap-history")).toBeNull();
  });

  it("hydrates existing history from localStorage", () => {
    localStorage.setItem(
      "tarshishdex-swap-history",
      JSON.stringify([
        { id: "x", timestamp: 1, inputAsset: "XLM", outputAsset: "USDT", inputAmount: "2", outputAmount: "1" },
      ])
    );
    render(<Harness />);
    expect(screen.getByTestId("sh-count").textContent).toBe("1");
  });

  it("recovers from corrupt localStorage", () => {
    localStorage.setItem("tarshishdex-swap-history", "bad");
    render(<Harness />);
    expect(screen.getByTestId("sh-count").textContent).toBe("0");
  });
});

// =========================================================================
// useSessionStorage
// =========================================================================

describe("useSessionStorage", () => {
  function Harness() {
    const [value, update, remove] = useSessionStorage<string>("ss-key", "initial");
    return (
      <div>
        <span data-testid="ss-value">{value}</span>
        <button data-testid="ss-set" onClick={() => update("updated")}>
          set
        </button>
        <button data-testid="ss-remove" onClick={remove}>
          remove
        </button>
      </div>
    );
  }

  it("sets and removes sessionStorage values", () => {
    render(<Harness />);
    expect(screen.getByTestId("ss-value").textContent).toBe("initial");
    fireEvent.click(screen.getByTestId("ss-set"));
    expect(screen.getByTestId("ss-value").textContent).toBe("updated");
    expect(sessionStorage.getItem("ss-key")).toBe(JSON.stringify("updated"));
    fireEvent.click(screen.getByTestId("ss-remove"));
    expect(screen.getByTestId("ss-value").textContent).toBe("initial");
    expect(sessionStorage.getItem("ss-key")).toBeNull();
  });

  it("recovers from corrupt stored JSON", () => {
    sessionStorage.setItem("ss-key", "%%%");
    render(<Harness />);
    expect(screen.getByTestId("ss-value").textContent).toBe("initial");
  });
});

// =========================================================================
// useRenderCount (dev logging)
// =========================================================================

describe("useRenderCount", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("logs every 10 renders in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    function Counter() {
      useRenderCount("Counter");
      return <div>counter</div>;
    }
    const { rerender } = render(<Counter />);
    for (let i = 0; i < 9; i++) {
      rerender(<Counter />);
    }
    expect(debug).toHaveBeenCalledWith("[render-count] Counter: 10 renders");
    debug.mockRestore();
  });
});
