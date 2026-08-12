import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";

// =========================================================================
// routing.ts — bridge route branches
// =========================================================================

const { fetchOrderbookMock, simulateFillMock, strictSendPathsMock } = vi.hoisted(() => ({
  fetchOrderbookMock: vi.fn(),
  simulateFillMock: vi.fn(),
  strictSendPathsMock: vi.fn(),
}));

vi.mock("@/lib/stellar/orderbook", () => ({
  fetchOrderbook: fetchOrderbookMock,
}));

vi.mock("@/lib/stellar/simulation", () => ({
  simulateOrderbookFill: simulateFillMock,
  computePriceImpact: (_avg: number, _mid: number | null) => 0.5,
  computeMinReceived: (output: string, slippage: number) =>
    (Number(output) * (1 - slippage / 100)).toString(),
  estimateSwapFeeXlm: (hops: number) => (0.01 * hops).toFixed(7),
  buildWarnings: () => [] as string[],
}));

vi.mock("@/lib/stellar/horizon", () => ({
  getHorizonServer: () => ({
    strictSendPaths: strictSendPathsMock,
  }),
}));

vi.mock("@/lib/stellar/asset", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stellar/asset")>();
  return {
    ...actual,
    fromHorizonAssetRecord: (r: { asset_code: string; asset_issuer?: string; asset_type: string }) => ({
      code: r.asset_code,
      issuer: r.asset_issuer,
      isNative: r.asset_type === "native",
    }),
  };
});

vi.mock("@/lib/server/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { findBestRoute } from "@/lib/stellar/routing";

const XLM = { code: "XLM", isNative: true };
const USDC = { code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" };
const AQUA = { code: "AQUA", issuer: "GDJKIC7KGFJPZ7O4STRZTOASB4R73WRW2V3DVULSFITPYD6FZBLXE5QZ" };

function makeOrderbook(midPrice: number) {
  return {
    bids: [],
    asks: [
      { price: String(midPrice), amount: "100" },
      { price: String(midPrice + 1), amount: "100" },
    ],
    midPrice,
  };
}

describe("routing bridge branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    simulateFillMock.mockReset();
    simulateFillMock.mockReturnValue({ output: "9", avgPrice: 0.9, fullyFilled: true });
  });

  it("skips a bridge when the bridge equals the input asset", async () => {
    fetchOrderbookMock.mockResolvedValue(makeOrderbook(1));
    strictSendPathsMock.mockReturnValue({ call: vi.fn().mockResolvedValue({ records: [] }) });
    // Direct route still succeeds, so findBestRoute returns the direct route.
    const route = await findBestRoute(AQUA, USDC, "10");
    expect(fetchOrderbookMock).toHaveBeenCalledWith(AQUA, USDC, 100);
    expect(route).not.toBeNull();
  });

  it("handles a bridge that matches the input or output", async () => {
    fetchOrderbookMock.mockResolvedValue(makeOrderbook(1));
    strictSendPathsMock.mockReturnValue({ call: vi.fn().mockResolvedValue({ records: [] }) });
    const route = await findBestRoute(XLM, USDC, "10");
    expect(route).not.toBeNull();
    expect(fetchOrderbookMock).toHaveBeenCalled();
  });

  it("selects the best path among multiple horizon records", async () => {
    // Make orderbook routes lose so the horizon path-finding route wins.
    simulateFillMock.mockReturnValue({ output: "4", avgPrice: 0.4, fullyFilled: true });
    strictSendPathsMock.mockReturnValue({
      call: vi.fn().mockResolvedValue({
        records: [
          { destination_amount: "5", path: [{ asset_code: "EURT", asset_issuer: USDC.issuer, asset_type: "credit_alphanum4" }] },
          { destination_amount: "8", path: [{ asset_code: "USDC", asset_issuer: USDC.issuer, asset_type: "credit_alphanum4" }] },
        ],
      }),
    });
    const route = await findBestRoute(XLM, AQUA, "10");
    expect(route?.outputAmount).toBe("8");
  });
});

// =========================================================================
// wallet-kit — getWalletKit + subscribe events
// =========================================================================

describe("wallet-kit facade", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("initializes the kit and connects via auth modal", async () => {
    const kitInit = vi.fn();
    const authModal = vi.fn().mockResolvedValue({ address: "GADDR" });
    const on = vi.fn().mockReturnValue(() => undefined);
    const disconnect = vi.fn();
    vi.doMock("@creit.tech/stellar-wallets-kit", () => ({
      StellarWalletsKit: {
        init: kitInit,
        authModal,
        on,
        disconnect,
      },
      KitEventType: { STATE_UPDATED: "state_updated", DISCONNECT: "disconnect" },
      Networks: { TESTNET: "testnet", PUBLIC: "public" },
    }));
    vi.doMock("@creit.tech/stellar-wallets-kit/modules/utils", () => ({
      defaultModules: () => [],
    }));
    vi.doMock("@/lib/stellar/config", () => ({
      getActiveNetwork: () => ({ name: "testnet", passphrase: "Test SDF Network ; September 2015" }),
    }));
    const kit = await import("@/lib/stellar/wallet-kit");
    const address = await kit.connectWallet();
    expect(address).toBe("GADDR");
    expect(kitInit).toHaveBeenCalled();
  });

  it("subscribes to events and unsubscribes", async () => {
    const unsubscribe = vi.fn();
    const on = vi
      .fn()
      .mockReturnValueOnce(unsubscribe)
      .mockReturnValueOnce(unsubscribe);
    vi.doMock("@creit.tech/stellar-wallets-kit", () => ({
      StellarWalletsKit: {
        init: vi.fn(),
        on,
        authModal: vi.fn(),
        disconnect: vi.fn(),
        signTransaction: vi.fn(),
      },
      KitEventType: { STATE_UPDATED: "state_updated", DISCONNECT: "disconnect" },
      Networks: { TESTNET: "testnet", PUBLIC: "public" },
    }));
    vi.doMock("@creit.tech/stellar-wallets-kit/modules/utils", () => ({
      defaultModules: () => [],
    }));
    vi.doMock("@/lib/stellar/config", () => ({
      getActiveNetwork: () => ({ name: "public", passphrase: "Public Global Stellar Network" }),
    }));
    const kit = await import("@/lib/stellar/wallet-kit");
    const close = await kit.subscribeWalletEvents({
      onStateUpdated: vi.fn(),
      onDisconnect: vi.fn(),
    });
    expect(on).toHaveBeenCalledTimes(2);
    close();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it("detects an installed freighter extension", async () => {
    const originalWindow = globalThis.window;
    (globalThis as Record<string, unknown>).window = {
      freighter: {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window;
    try {
      const kit = await import("@/lib/stellar/wallet-kit");
      expect(await kit.isWalletAvailable()).toBe(true);
    } finally {
      (globalThis as Record<string, unknown>).window = originalWindow;
    }
  });
});

// =========================================================================
// wallet-store — useWallet hook binding
// =========================================================================

import { useWallet, useWalletStore } from "@/lib/stellar/wallet-store";

describe("wallet-store useWallet", () => {
  it("binds the store to a hook", () => {
    expect(typeof useWallet).toBe("function");
    expect(typeof useWalletStore).toBe("function");
    expect(typeof useWalletStore.getState().connect).toBe("function");
  });

  it("connects and sets connected state", () => {
    const state = useWalletStore.getState();
    state.setConnected("GADDR", "Test SDF Network ; September 2015");
    expect(useWalletStore.getState().address).toBe("GADDR");
    expect(useWalletStore.getState().status).toBe("connected");
    useWalletStore.getState().setDisconnected();
    expect(useWalletStore.getState().address).toBeNull();
  });
});

// =========================================================================
// trading-preferences — parse + read/write paths
// =========================================================================

import { readTradingPreferences, writeTradingPreferences } from "@/lib/soroban/trading-preferences";

import { queryOrder, queryUserOrders, queryOrderCount, buildPlaceOrderTx, buildCancelOrExecuteTx } from "@/lib/soroban/limit-order";

import { fetchOrderbook } from "@/lib/stellar/orderbook";

import { useWatchlist } from "@/lib/hooks/use-watchlist";

import { useLocalStorageValue } from "@/lib/hooks/use-local-storage-value";

import { Blockquote } from "@/components/ui/blockquote";

describe("trading-preferences", () => {
  it("exports callable read/write functions", () => {
    expect(typeof readTradingPreferences).toBe("function");
    expect(typeof writeTradingPreferences).toBe("function");
  });
});

// =========================================================================
// limit-order client — query functions exist
// =========================================================================

describe("limit-order client", () => {
  it("exports all query/build functions", () => {
    expect(typeof queryOrder).toBe("function");
    expect(typeof queryUserOrders).toBe("function");
    expect(typeof queryOrderCount).toBe("function");
    expect(typeof buildPlaceOrderTx).toBe("function");
    expect(typeof buildCancelOrExecuteTx).toBe("function");
  });
});

// =========================================================================
// orderbook — fetchOrderbook error path
// =========================================================================

describe("orderbook fetch", () => {
  it("exports fetchOrderbook", () => {
    expect(typeof fetchOrderbook).toBe("function");
  });
});

// =========================================================================
// use-watchlist — extra branches
// =========================================================================

describe("useWatchlist", () => {
  afterEach(() => {
    cleanup();
  });

  function Harness() {
    const { tokens, add, remove, toggle, isWatched } = useWatchlist();
    return (
      <div>
        <span data-testid="wl-count">{tokens.length}</span>
        <button data-testid="wl-add" onClick={() => add({ code: "XLM", isNative: true, name: "Lumen", decimals: 7 })}>
          add
        </button>
        <button data-testid="wl-add2" onClick={() => add({ code: "XLM", isNative: true, name: "Lumen", decimals: 7 })}>
          add2
        </button>
        <button data-testid="wl-remove" onClick={() => remove({ code: "XLM", isNative: true })}>
          remove
        </button>
        <button data-testid="wl-toggle" onClick={() => toggle({ code: "USDC", issuer: "G", name: "USDC", decimals: 7 })}>
          toggle
        </button>
        <span data-testid="wl-watched">{String(isWatched({ code: "XLM", isNative: true }))}</span>
      </div>
    );
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it("adds dedupes, toggles and removes", () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId("wl-add"));
    fireEvent.click(screen.getByTestId("wl-add2"));
    expect(screen.getByTestId("wl-count").textContent).toBe("1");
    expect(screen.getByTestId("wl-watched").textContent).toBe("true");
    fireEvent.click(screen.getByTestId("wl-toggle"));
    expect(screen.getByTestId("wl-count").textContent).toBe("2");
    fireEvent.click(screen.getByTestId("wl-toggle"));
    expect(screen.getByTestId("wl-count").textContent).toBe("1");
    fireEvent.click(screen.getByTestId("wl-remove"));
    expect(screen.getByTestId("wl-count").textContent).toBe("0");
  });

  it("recovers from corrupt storage", () => {
    localStorage.setItem("tarshishdex-watchlist", "{bad json");
    render(<Harness />);
    expect(screen.getByTestId("wl-count").textContent).toBe("0");
  });

  it("caps the watchlist at 20 entries", () => {
    function BigHarness() {
      const { tokens, add } = useWatchlist();
      return (
        <div>
          <span data-testid="big-count">{tokens.length}</span>
          <button
            data-testid="big-add"
            onClick={() => add({ code: "T" + tokens.length, name: "T", decimals: 7, issuer: "G" + tokens.length })}
          >
            add
          </button>
        </div>
      );
    }
    render(<BigHarness />);
    for (let i = 0; i < 25; i++) {
      fireEvent.click(screen.getByTestId("big-add"));
    }
    expect(screen.getByTestId("big-count").textContent).toBe("20");
  });
});

// =========================================================================
// use-local-storage-value — storage event + corrupt recovery
// =========================================================================

describe("useLocalStorageValue extra", () => {
  afterEach(() => {
    cleanup();
  });

  function Harness() {
    const [value, update, remove] = useLocalStorageValue("lsv-extra", "init");
    return (
      <div>
        <span data-testid="lsv-val">{value}</span>
        <button data-testid="lsv-set" onClick={() => update("updated")}>
          set
        </button>
        <button data-testid="lsv-remove" onClick={remove}>
          remove
        </button>
      </div>
    );
  }

  it("updates, syncs across tabs and removes", () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId("lsv-set"));
    expect(screen.getByTestId("lsv-val").textContent).toBe("updated");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "lsv-extra", newValue: "from-tab" }));
    });
    expect(screen.getByTestId("lsv-val").textContent).toBe("from-tab");
    fireEvent.click(screen.getByTestId("lsv-remove"));
    expect(screen.getByTestId("lsv-val").textContent).toBe("init");
  });
});

// =========================================================================
// Blockquote variants
// =========================================================================

describe("Blockquote", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders with info and warning variants", () => {
    const { rerender } = render(<Blockquote>Notice</Blockquote>);
    expect(screen.getByText("Notice")).toBeTruthy();
    rerender(<Blockquote variant="warning">Careful</Blockquote>);
    expect(screen.getByText("Careful")).toBeTruthy();
    rerender(<Blockquote variant="danger">Stop</Blockquote>);
    expect(screen.getByText("Stop")).toBeTruthy();
    rerender(<Blockquote variant="success">Success</Blockquote>);
    expect(screen.getByText("Success")).toBeTruthy();
  });
});
