import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

// =========================================================================
// swap-execution (pure + orchestration)
// =========================================================================
const { loadAccountMock, submitTxMock, signTxMock } = vi.hoisted(() => ({
  loadAccountMock: vi.fn(),
  submitTxMock: vi.fn(),
  signTxMock: vi.fn(),
}));

// Use the real @stellar/stellar-sdk for transaction building; the signer mock
// returns the built XDR unchanged so fromXDR() can parse it.
let lastBuiltXdr = "";
signTxMock.mockImplementation((xdr: string) => {
  lastBuiltXdr = xdr;
  return Promise.resolve(xdr);
});

vi.mock("@/lib/stellar/horizon", () => ({
  getHorizonServer: () => ({
    loadAccount: loadAccountMock,
    submitTransaction: submitTxMock,
  }),
}));

vi.mock("@/lib/stellar/wallet-kit", () => ({
  signTransactionXdr: signTxMock,
}));

vi.mock("@/lib/stellar/config", () => ({
  getActiveNetwork: () => ({ passphrase: "test", label: "Testnet" }),
  explorerTxUrl: (hash: string) => `https://explorer/${hash}`,
}));

vi.mock("@/lib/stellar/fee-collector", () => ({
  calculateFee: (_amount: string, method: string) => (method === "direct" ? "0.5" : "0.7"),
  getFeeCollector: () => VALID_ADDRESS,
  getFeeBps: (method: string) => (method === "direct" ? 50 : 70),
}));

import {
  needsTrustline,
  intermediatePath,
  buildSwapOperations,
  classifySwapError,
  executeSwap,
} from "@/lib/stellar/swap-execution";

const XLM = { code: "XLM", isNative: true };
const USDC = { code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" };
const AQUA = { code: "AQUA", issuer: "GBNZ" };

describe("needsTrustline", () => {
  it("returns false for native XLM output", () => {
    expect(needsTrustline([], XLM)).toBe(false);
    expect(needsTrustline([], { code: "XLM" })).toBe(false);
  });

  it("returns true when the issued asset is not in balances", () => {
    expect(needsTrustline([{ asset_type: "native" }], USDC)).toBe(true);
  });

  it("returns false when the asset is already trusted", () => {
    expect(
      needsTrustline(
        [{ asset_type: "credit_alphanum4", asset_code: "USDC", asset_issuer: USDC.issuer }],
        USDC,
      ),
    ).toBe(false);
  });
});

describe("intermediatePath", () => {
  it("returns empty for a direct path", () => {
    expect(intermediatePath([XLM, USDC])).toEqual([]);
  });

  it("returns middle hops for a multi-hop path", () => {
    expect(intermediatePath([XLM, AQUA, USDC])).toEqual([AQUA]);
  });
});

describe("buildSwapOperations", () => {
  it("includes a fee payment for issued input assets", () => {
    const ops = buildSwapOperations({
      address: VALID_ADDRESS,
      input: USDC,
      output: XLM,
      amountIn: "100",
      minReceived: "98",
      path: [USDC, XLM],
      method: "direct",
    });
    expect(ops.length).toBe(2); // fee payment + path payment
  });

  it("skips the fee payment for native input", () => {
    const ops = buildSwapOperations({
      address: VALID_ADDRESS,
      input: XLM,
      output: USDC,
      amountIn: "100",
      minReceived: "98",
      path: [XLM, USDC],
      method: "direct",
    });
    expect(ops.length).toBe(1);
  });
});

describe("classifySwapError", () => {
  it("classifies insufficient balance", () => {
    expect(classifySwapError(new Error("op_underfunded"))).toBe("insufficient-balance");
    expect(classifySwapError(new Error("insufficient funds"))).toBe("insufficient-balance");
  });

  it("classifies user cancellation", () => {
    expect(classifySwapError(new Error("user cancelled"))).toBe("user-cancelled");
  });

  it("classifies network errors", () => {
    expect(classifySwapError(new Error("network timeout"))).toBe("network");
  });

  it("classifies invalid transactions", () => {
    expect(classifySwapError(new Error("malformed transaction"))).toBe("invalid-transaction");
  });

  it("returns unknown for anything else", () => {
    expect(classifySwapError(new Error("mystery"))).toBe("unknown");
    expect(classifySwapError("string error")).toBe("unknown");
  });
});

import { Account } from "@stellar/stellar-sdk";

describe("executeSwap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const realAccount = new Account(VALID_ADDRESS, "1");
    // Expose balances for needsTrustline + the real Account methods for the builder.
    Object.defineProperty(realAccount, "balances", {
      value: [{ asset_type: "native" }],
      configurable: true,
    });
    loadAccountMock.mockResolvedValue(realAccount as never);
    submitTxMock.mockResolvedValue({ hash: "tx-hash-1" });
  });

  it("reports phases and returns success with explorer URL", async () => {
    const phases: string[] = [];
    const result = await executeSwap(
      {
        address: VALID_ADDRESS,
        input: XLM,
        output: USDC,
        amountIn: "100",
        minReceived: "98",
        path: [XLM, USDC],
        method: "direct",
      },
      (p) => phases.push(p),
    );
    expect(result.phase).toBe("success");
    expect(result.hash).toBe("tx-hash-1");
    expect(result.explorerUrl).toBe("https://explorer/tx-hash-1");
    expect(phases).toEqual(["checking", "building", "signing", "submitting", "success"]);
  });

  it("adds a change-trust op when a trustline is needed", async () => {
    const result = await executeSwap({
      address: VALID_ADDRESS,
      input: XLM,
      output: USDC,
      amountIn: "100",
      minReceived: "98",
      path: [XLM, USDC],
      method: "direct",
    });
    console.log("ERRMSG:", result.error); expect(result.phase).toBe("success");
    expect(loadAccountMock).toHaveBeenCalledWith(VALID_ADDRESS);
  });

  it("returns failed state with classified error on failure", async () => {
    submitTxMock.mockRejectedValue(new Error("insufficient funds"));
    const result = await executeSwap({
      address: VALID_ADDRESS,
      input: XLM,
      output: USDC,
      amountIn: "100",
      minReceived: "98",
      path: [XLM, USDC],
      method: "direct",
    });
    expect(result.phase).toBe("failed");
    expect(result.errorKind).toBe("insufficient-balance");
  });

  it("calls onSuccess and swallows its errors", async () => {
    const onSuccess = vi.fn().mockRejectedValue(new Error("marking failed"));
    const result = await executeSwap(
      {
        address: VALID_ADDRESS,
        input: XLM,
        output: USDC,
        amountIn: "100",
        minReceived: "98",
        path: [XLM, USDC],
        method: "direct",
      },
      undefined,
      onSuccess,
    );
    console.log("ERRMSG:", result.error); expect(result.phase).toBe("success");
    expect(onSuccess).toHaveBeenCalledWith("tx-hash-1");
  });
});

// =========================================================================
// DisconnectDialog
// =========================================================================
import { DisconnectDialog } from "@/components/wallet/disconnect-dialog";

describe("DisconnectDialog", () => {
  it("renders the truncated address", () => {
    render(
      <DisconnectDialog
        address={VALID_ADDRESS}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText(/GAAAAA/)).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    render(<DisconnectDialog address={VALID_ADDRESS} onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onConfirm when Disconnect is clicked", () => {
    const onConfirm = vi.fn();
    render(<DisconnectDialog address={VALID_ADDRESS} onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(onConfirm).toHaveBeenCalled();
  });
});

// =========================================================================
// LimitOrderTable
// =========================================================================
const { useWalletMock, useUserLimitOrdersMock, useOraclePriceMock, signAndSubmitMock, toastMock } =
  vi.hoisted(() => ({
    useWalletMock: vi.fn(),
    useUserLimitOrdersMock: vi.fn(),
    useOraclePriceMock: vi.fn(),
    signAndSubmitMock: vi.fn(),
    toastMock: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
  }));

vi.mock("@/lib/stellar/wallet-store", () => ({
  useWallet: () => useWalletMock(),
}));

vi.mock("@/lib/stellar/limit-order-queries", () => ({
  useUserLimitOrders: () => useUserLimitOrdersMock(),
}));

vi.mock("@/lib/stellar/queries", () => ({
  useOraclePrice: () => useOraclePriceMock(),
}));

vi.mock("@/lib/stellar/contract-submit", () => ({
  signAndSubmitContractTx: (...args: unknown[]) => signAndSubmitMock(...args),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: toastMock,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    isLoading,
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled || isLoading}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div />,
}));

vi.mock("@/lib/utils", () => ({
  formatNumber: (n: number) => n.toString(),
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

import { LimitOrderTable } from "@/components/orders/limit-order-table";

const ORDERS = [
  { id: 1, owner: VALID_ADDRESS, base: "XLM", counter: "USDC", price: 2, amount: 100, expiryLedger: 0, side: "buy", placedAt: 1700000000 },
  { id: 2, owner: VALID_ADDRESS, base: "USDC", counter: "XLM", price: 0.5, amount: 50, expiryLedger: 0, side: "sell", placedAt: 1700000001 },
];

function wrapper(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("LimitOrderTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWalletMock.mockReturnValue({ address: null, networkPassphrase: "test" });
    useUserLimitOrdersMock.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() });
    useOraclePriceMock.mockReturnValue({ data: null, isLoading: false });
    signAndSubmitMock.mockResolvedValue({ success: true });
  });

  it("shows connect prompt when no wallet", () => {
    wrapper(<LimitOrderTable />);
    expect(screen.getByText("Connect your wallet")).toBeTruthy();
  });

  it("shows skeletons while loading", () => {
    useWalletMock.mockReturnValue({ address: VALID_ADDRESS, networkPassphrase: "test" });
    useUserLimitOrdersMock.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() });
    wrapper(<LimitOrderTable />);
    expect(screen.getByText("Limit Orders")).toBeTruthy();
  });

  it("shows an error message on query failure", () => {
    useWalletMock.mockReturnValue({ address: VALID_ADDRESS, networkPassphrase: "test" });
    useUserLimitOrdersMock.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() });
    wrapper(<LimitOrderTable />);
    expect(screen.getByText(/Could not load limit orders/)).toBeTruthy();
  });

  it("shows empty state when no orders", () => {
    useWalletMock.mockReturnValue({ address: VALID_ADDRESS, networkPassphrase: "test" });
    wrapper(<LimitOrderTable />);
    expect(screen.getByText("No open orders")).toBeTruthy();
  });

  it("renders orders with oracle distance", () => {
    useWalletMock.mockReturnValue({ address: VALID_ADDRESS, networkPassphrase: "test" });
    useUserLimitOrdersMock.mockReturnValue({ data: ORDERS, isLoading: false, isError: false, refetch: vi.fn() });
    useOraclePriceMock.mockReturnValue({ data: { price: 20_000_000 }, isLoading: false });
    wrapper(<LimitOrderTable />);
    expect(screen.getByText("2 open orders")).toBeTruthy();
    expect(screen.getByText("Buy")).toBeTruthy();
    expect(screen.getByText("Sell")).toBeTruthy();
    expect(screen.getAllByText("✓ fillable").length).toBeGreaterThan(0);
  });

  it("cancels an order via DELETE + sign + refetch", async () => {
    const refetch = vi.fn();
    useWalletMock.mockReturnValue({ address: VALID_ADDRESS, networkPassphrase: "test" });
    useUserLimitOrdersMock.mockReturnValue({ data: ORDERS, isLoading: false, isError: false, refetch });
    useOraclePriceMock.mockReturnValue({ data: { price: 20_000_000 }, isLoading: false });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ xdr: "cancel-xdr" }) }),
    );

    wrapper(<LimitOrderTable />);
    const cancelButtons = screen.getAllByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButtons[0]!);

    await waitFor(() => expect(signAndSubmitMock).toHaveBeenCalled());
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/orders",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(refetch).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("shows toast error when cancel submission fails", async () => {
    useWalletMock.mockReturnValue({ address: VALID_ADDRESS, networkPassphrase: "test" });
    useUserLimitOrdersMock.mockReturnValue({ data: ORDERS, isLoading: false, isError: false, refetch: vi.fn() });
    useOraclePriceMock.mockReturnValue({ data: { price: 20_000_000 }, isLoading: false });
    signAndSubmitMock.mockResolvedValue({ success: false, error: "rejected" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ xdr: "cancel-xdr" }) }),
    );

    wrapper(<LimitOrderTable />);
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[0]!);
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("rejected"));
    vi.unstubAllGlobals();
  });

  it("shows oracle unavailability dash", () => {
    useWalletMock.mockReturnValue({ address: VALID_ADDRESS, networkPassphrase: "test" });
    useUserLimitOrdersMock.mockReturnValue({ data: ORDERS, isLoading: false, isError: false, refetch: vi.fn() });
    useOraclePriceMock.mockReturnValue({ data: null, isLoading: false });
    wrapper(<LimitOrderTable />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});

// =========================================================================
// LimitOrderForm
// =========================================================================
vi.mock("@/components/swap/token-selector", () => ({
  TokenSelector: ({ value, onSelect }: { value: unknown; onSelect: (a: unknown) => void }) => (
    <button type="button" onClick={() => onSelect({ code: "XLM", isNative: true })}>
      Token: {String((value as { code?: string })?.code ?? "none")}
    </button>
  ),
}));

import { LimitOrderForm } from "@/components/orders/limit-order-form";

describe("LimitOrderForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWalletMock.mockReturnValue({ address: VALID_ADDRESS, connect: vi.fn(), networkPassphrase: "test" });
  });

  it("disables submit until price and amount are entered", () => {
    wrapper(<LimitOrderForm />);
    const button = screen.getByRole("button", { name: /Place Buy Order/ });
    expect(button).toHaveProperty("disabled", true);
  });

  it("toggles buy/sell side", () => {
    wrapper(<LimitOrderForm />);
    fireEvent.click(screen.getByText("Sell"));
    expect(screen.getByRole("button", { name: /Place Sell Order/ })).toBeTruthy();
  });

  it("places an order successfully and clears inputs", async () => {
    signAndSubmitMock.mockResolvedValue({ success: true });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ xdr: "xdr-1" }) }),
    );

    wrapper(<LimitOrderForm />);
    fireEvent.change(screen.getByLabelText("Limit price"), { target: { value: "1.5" } });
    fireEvent.change(screen.getByLabelText("Order amount"), { target: { value: "10" } });

    const button = screen.getByRole("button", { name: /Place Buy Order/ });
    expect(button).toHaveProperty("disabled", false);
    fireEvent.click(button);

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    expect(signAndSubmitMock).toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalledWith("Limit order placed successfully");
    vi.unstubAllGlobals();
  });

  it("connects wallet first when disconnected", async () => {
    const connect = vi.fn().mockResolvedValue(true);
    useWalletMock.mockReturnValue({ address: null, connect, networkPassphrase: "test" });
    signAndSubmitMock.mockResolvedValue({ success: true });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ xdr: "xdr-1" }) }),
    );

    wrapper(<LimitOrderForm />);
    fireEvent.change(screen.getByLabelText("Limit price"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Order amount"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: /Place Buy Order/ }));

    await waitFor(() => expect(connect).toHaveBeenCalled());
    vi.unstubAllGlobals();
  });

  it("shows toast when connection is rejected", async () => {
    const connect = vi.fn().mockResolvedValue(false);
    useWalletMock.mockReturnValue({ address: null, connect, networkPassphrase: "test" });

    wrapper(<LimitOrderForm />);
    fireEvent.change(screen.getByLabelText("Limit price"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Order amount"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: /Place Buy Order/ }));

    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith("Please connect your wallet to place limit orders."),
    );
  });

  it("shows toast error when API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: vi.fn().mockResolvedValue({ error: "bad fields" }) }),
    );

    wrapper(<LimitOrderForm />);
    fireEvent.change(screen.getByLabelText("Limit price"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Order amount"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: /Place Buy Order/ }));

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("bad fields"));
    vi.unstubAllGlobals();
  });
});
