import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  preferencesToScVal,
  preferencesFromScVal,
  readTradingPreferences,
  batchReadTradingPreferences,
  readPreferenceCount,
  readContractVersion,
  writeTradingPreferences,
} from "@/lib/soroban/trading-preferences";
import {
  queryOrder,
  queryUserOrders,
  queryOrderCount,
  buildPlaceOrderTx,
  buildCancelOrExecuteTx,
} from "@/lib/soroban/limit-order";
import { observationFromScVal, readPriceObservation } from "@/lib/soroban/market-oracle";
import { xdr, scValToNative, Address, nativeToScVal } from "@stellar/stellar-sdk";

const VALID_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

// =========================================================================
// Mocks
// =========================================================================
const { buildMock, simulateMock, signAndSendMock, getTransactionResponseMock } = vi.hoisted(() => ({
  buildMock: vi.fn(),
  simulateMock: vi.fn(),
  signAndSendMock: vi.fn(),
  getTransactionResponseMock: vi.fn(),
}));

/**
 * Capture the parseResultXdr passed to build() and make simulate() apply it
 * to a raw ScVal — mirroring real SDK behavior where simulate() runs the
 * parser over the returned result.
 */
let capturedParse: ((scv: xdr.ScVal) => unknown) | undefined;

function stubRawResult(rawResult: unknown) {
  simulateMock.mockImplementation(async () => ({
    result: capturedParse ? capturedParse(rawResult as xdr.ScVal) : rawResult,
  }));
}

vi.mock("@stellar/stellar-sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@stellar/stellar-sdk")>();
  return {
    ...actual,
    contract: {
      AssembledTransaction: {
        build: buildMock,
      },
    },
  };
});

vi.mock("@/lib/soroban/config", () => ({
  getTradingPreferencesContractId: vi.fn(),
  getMarketOracleContractId: vi.fn(),
  getLimitOrderContractId: vi.fn(),
  getSorobanRpcServer: vi.fn(() => ({})),
}));

vi.mock("@/lib/stellar/config", () => ({
  getActiveNetwork: vi.fn(() => ({
    name: "testnet",
    label: "Testnet",
    horizonUrl: "https://horizon-testnet.stellar.org",
    rpcUrl: "https://soroban-testnet.stellar.org",
    passphrase: "Test SDF Network ; September 2015",
    explorerUrl: "https://stellar.expert/explorer/testnet",
  })),
}));

vi.mock("@/lib/stellar/wallet-kit", () => ({
  signTransactionXdr: vi.fn(() => Promise.resolve("signed-xdr")),
}));

vi.mock("@/lib/utils/retry", () => ({
  withRetry: <T>(fn: () => Promise<T>) => fn(),
}));

// Grab the mocked getters
import {
  getTradingPreferencesContractId,
  getMarketOracleContractId,
  getLimitOrderContractId,
} from "@/lib/soroban/config";
import { getActiveNetwork } from "@/lib/stellar/config";
import { signTransactionXdr } from "@/lib/stellar/wallet-kit";

const mockContractId = vi.mocked(getTradingPreferencesContractId);
const mockOracleContractId = vi.mocked(getMarketOracleContractId);
const mockLimitContractId = vi.mocked(getLimitOrderContractId);
const mockActiveNetwork = vi.mocked(getActiveNetwork);
const mockSign = vi.mocked(signTransactionXdr);

function makeTx(overrides: Record<string, unknown> = {}) {
  return {
    simulate: simulateMock,
    signAndSend: signAndSendMock,
    toXDR: vi.fn(() => "tx-xdr"),
    getTransactionResponse: getTransactionResponseMock,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  capturedParse = undefined;
  buildMock.mockImplementation(
    async ({ parseResultXdr }: { parseResultXdr?: (scv: xdr.ScVal) => unknown }) => {
      capturedParse = parseResultXdr;
      return makeTx();
    }
  );
  mockActiveNetwork.mockReturnValue({
    name: "testnet",
    label: "Testnet",
    horizonUrl: "https://horizon-testnet.stellar.org",
    rpcUrl: "https://soroban-testnet.stellar.org",
    passphrase: "Test SDF Network ; September 2015",
    explorerUrl: "https://stellar.expert/explorer/testnet",
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// =========================================================================
// preferencesToScVal / preferencesFromScVal (pure)
// =========================================================================
describe("preferencesToScVal / preferencesFromScVal", () => {
  it("encodes a Preferences struct as an ScMap", () => {
    const scv = preferencesToScVal({
      max_slippage_bps: 250,
      routing_mode: "auto",
      allowed_assets: ["USDC", "XLM"],
    });
    const map = scv.map();
    expect(map?.length).toBe(3);
    const native = scValToNative(scv) as Record<string, unknown>;
    expect(native.max_slippage_bps).toBe(250);
    expect(native.routing_mode).toBe("auto");
    expect(native.allowed_assets).toEqual(["USDC", "XLM"]);
  });

  it("decodes a Preferences ScVal into a typed object", () => {
    const scv = preferencesToScVal({
      max_slippage_bps: 500,
      routing_mode: "direct",
      allowed_assets: ["XLM"],
    });
    const decoded = preferencesFromScVal(scv);
    expect(decoded.max_slippage_bps).toBe(500);
    expect(decoded.routing_mode).toBe("direct");
    expect(decoded.allowed_assets).toEqual(["XLM"]);
  });

  it("applies defaults for missing fields", () => {
    const scv = xdr.ScVal.scvMap([]);
    const decoded = preferencesFromScVal(scv);
    expect(decoded.max_slippage_bps).toBe(100);
    expect(decoded.routing_mode).toBe("auto");
    expect(decoded.allowed_assets).toEqual([]);
  });
});

// =========================================================================
// readTradingPreferences
// =========================================================================
describe("readTradingPreferences", () => {
  it("returns null when contract is not configured", async () => {
    mockContractId.mockReturnValue(null);
    expect(await readTradingPreferences(VALID_ADDRESS)).toBeNull();
  });

  it("returns decoded preferences on success", async () => {
    mockContractId.mockReturnValue("CABC");
    const resultScv = preferencesToScVal({
      max_slippage_bps: 100,
      routing_mode: "auto",
      allowed_assets: [],
    });
    stubRawResult(resultScv);

    const prefs = await readTradingPreferences(VALID_ADDRESS);
    expect(prefs).not.toBeNull();
    expect(prefs?.max_slippage_bps).toBe(100);
  });

  it("returns null when the RPC call throws", async () => {
    mockContractId.mockReturnValue("CABC");
    buildMock.mockRejectedValue(new Error("rpc down"));
    expect(await readTradingPreferences(VALID_ADDRESS)).toBeNull();
  });
});

// =========================================================================
// batchReadTradingPreferences
// =========================================================================
describe("batchReadTradingPreferences", () => {
  it("returns nulls for all when unconfigured", async () => {
    mockContractId.mockReturnValue(null);
    const addr2 = "GADQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOZPI";
    const map = await batchReadTradingPreferences([VALID_ADDRESS, addr2]);
    expect(map.size).toBe(2);
    expect(map.get(VALID_ADDRESS)).toBeNull();
    expect(map.get(addr2)).toBeNull();
  });

  it("returns empty map for empty input", async () => {
    mockContractId.mockReturnValue("CABC");
    const map = await batchReadTradingPreferences([]);
    expect(map.size).toBe(0);
  });

  it("fills nulls when the batch call fails", async () => {
    mockContractId.mockReturnValue("CABC");
    buildMock.mockRejectedValue(new Error("batch failed"));
    const map = await batchReadTradingPreferences([VALID_ADDRESS]);
    expect(map.get(VALID_ADDRESS)).toBeNull();
  });

  it("parses batch results into the map", async () => {
    mockContractId.mockReturnValue("CABC");
    const addr2 = "GADQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOZPI";
    const inner = nativeToScVal([
      [
        VALID_ADDRESS,
        {
          max_slippage_bps: 77,
          routing_mode: "bridge",
          allowed_assets: [],
        },
      ],
    ]);
    stubRawResult(inner);

    const map = await batchReadTradingPreferences([VALID_ADDRESS, addr2]);
    const first = map.get(VALID_ADDRESS);
    expect(first).not.toBeNull();
    expect(first?.max_slippage_bps).toBe(77);
    expect(first?.routing_mode).toBe("bridge");
    expect(map.get(addr2)).toBeNull();
  });
});

// =========================================================================
// readPreferenceCount / readContractVersion
// =========================================================================
describe("readPreferenceCount", () => {
  it("returns null when unconfigured", async () => {
    mockContractId.mockReturnValue(null);
    expect(await readPreferenceCount()).toBeNull();
  });

  it("returns the count", async () => {
    mockContractId.mockReturnValue("CABC");
    // Count parses with Number(scValToNative(scv)) — pass an ScVal wrapping 42
    stubRawResult(xdr.ScVal.scvU32(42 as never));
    expect(await readPreferenceCount()).toBe(42);
  });

  it("returns null on error", async () => {
    mockContractId.mockReturnValue("CABC");
    buildMock.mockRejectedValue(new Error("boom"));
    expect(await readPreferenceCount()).toBeNull();
  });
});

describe("readContractVersion", () => {
  it("returns null when unconfigured", async () => {
    mockContractId.mockReturnValue(null);
    expect(await readContractVersion()).toBeNull();
  });

  it("returns the version", async () => {
    mockContractId.mockReturnValue("CABC");
    stubRawResult(xdr.ScVal.scvU32(3 as never));
    expect(await readContractVersion()).toBe(3);
  });
});

// =========================================================================
// writeTradingPreferences
// =========================================================================
describe("writeTradingPreferences", () => {
  it("returns not-configured when no contract id", async () => {
    mockContractId.mockReturnValue(null);
    const result = await writeTradingPreferences(VALID_ADDRESS, {
      max_slippage_bps: 100,
      routing_mode: "auto",
      allowed_assets: [],
    });
    expect(result).toEqual({ ok: false, reason: "not-configured" });
  });

  it("returns success with hash on confirmed tx", async () => {
    mockContractId.mockReturnValue("CABC");
    const sent = {
      getTransactionResponse: { status: "SUCCESS", txHash: "tx-hash-1" },
      sendTransactionResponse: { hash: "tx-hash-1" },
    };
    signAndSendMock.mockResolvedValue(sent);
    buildMock.mockResolvedValue(makeTx());

    const result = await writeTradingPreferences(VALID_ADDRESS, {
      max_slippage_bps: 100,
      routing_mode: "auto",
      allowed_assets: [],
    });
    expect(result).toEqual({ ok: true, hash: "tx-hash-1" });
  });

  it("returns failed when transaction status is not success", async () => {
    mockContractId.mockReturnValue("CABC");
    const sent = {
      getTransactionResponse: { status: "FAILED", txHash: "tx" },
      sendTransactionResponse: { hash: "tx" },
    };
    signAndSendMock.mockResolvedValue(sent);
    buildMock.mockResolvedValue(makeTx());

    const result = await writeTradingPreferences(VALID_ADDRESS, {
      max_slippage_bps: 100,
      routing_mode: "auto",
      allowed_assets: [],
    });
    expect(result).toEqual({ ok: false, reason: "failed" });
  });

  it("returns failed when signAndSend rejects generically", async () => {
    mockContractId.mockReturnValue("CABC");
    signAndSendMock.mockRejectedValue(new Error("timeout"));
    buildMock.mockResolvedValue(makeTx());

    const result = await writeTradingPreferences(VALID_ADDRESS, {
      max_slippage_bps: 100,
      routing_mode: "auto",
      allowed_assets: [],
    });
    expect(result).toEqual({ ok: false, reason: "failed" });
  });

  it("returns cancelled when the wallet declines", async () => {
    mockContractId.mockReturnValue("CABC");
    buildMock.mockRejectedValue(new Error("User cancelled the request"));
    const result = await writeTradingPreferences(VALID_ADDRESS, {
      max_slippage_bps: 100,
      routing_mode: "auto",
      allowed_assets: [],
    });
    expect(result).toEqual({ ok: false, reason: "cancelled" });
  });

  it("returns failed on generic error", async () => {
    mockContractId.mockReturnValue("CABC");
    buildMock.mockRejectedValue(new Error("network error"));
    const result = await writeTradingPreferences(VALID_ADDRESS, {
      max_slippage_bps: 100,
      routing_mode: "auto",
      allowed_assets: [],
    });
    expect(result).toEqual({ ok: false, reason: "failed" });
  });

  it("uses the wallet signer when building", async () => {
    mockContractId.mockReturnValue("CABC");
    mockSign.mockResolvedValue("signed-by-wallet");
    let capturedSigner: ((xdrStr: string) => Promise<{ signedTxXdr: string }>) | undefined;
    buildMock.mockImplementation(async ({ signTransaction, parseResultXdr }) => {
      capturedSigner = signTransaction;
      capturedParse = parseResultXdr;
      return makeTx();
    });
    signAndSendMock.mockResolvedValue({
      getTransactionResponse: { status: "SUCCESS", txHash: "h" },
      sendTransactionResponse: { hash: "h" },
    });

    const result = await writeTradingPreferences(VALID_ADDRESS, {
      max_slippage_bps: 100,
      routing_mode: "auto",
      allowed_assets: [],
    });
    expect(result.ok).toBe(true);
    // The signer callback should route to the wallet kit
    expect(typeof capturedSigner).toBe("function");
    if (capturedSigner) {
      const signed = await capturedSigner("raw-xdr");
      expect(signed.signedTxXdr).toBe("signed-by-wallet");
    }
  });

  it("returns failed when no tx hash present", async () => {
    mockContractId.mockReturnValue("CABC");
    signAndSendMock.mockResolvedValue({
      getTransactionResponse: { status: "SUCCESS" },
      sendTransactionResponse: {},
    });
    buildMock.mockResolvedValue(makeTx());

    const result = await writeTradingPreferences(VALID_ADDRESS, {
      max_slippage_bps: 100,
      routing_mode: "auto",
      allowed_assets: [],
    });
    expect(result).toEqual({ ok: false, reason: "failed" });
  });
});

// =========================================================================
// limit-order client
// =========================================================================
describe("limit-order client", () => {
  it("queryOrder returns null when unconfigured", async () => {
    mockLimitContractId.mockReturnValue(null);
    expect(await queryOrder(1)).toBeNull();
  });

  it("queryOrder returns null for void result", async () => {
    mockLimitContractId.mockReturnValue("CABC");
    stubRawResult(xdr.ScVal.scvVoid());
    expect(await queryOrder(1)).toBeNull();
  });

  it("queryOrder decodes an order", async () => {
    mockLimitContractId.mockReturnValue("CABC");
    const orderScv = nativeToScVal({
      id: 1,
      owner: VALID_ADDRESS,
      base: "XLM",
      counter: "USDC",
      price: 12500000,
      amount: 1000000,
      expiry_ledger: 0,
      side: "sell",
      placed_at: 123,
    });
    stubRawResult(orderScv);

    const order = await queryOrder(1);
    expect(order).not.toBeNull();
    expect(order?.id).toBe(1);
    expect(order?.base).toBe("XLM");
    expect(order?.side).toBe("sell");
  });

  it("queryUserOrders returns [] when unconfigured", async () => {
    mockLimitContractId.mockReturnValue(null);
    expect(await queryUserOrders(VALID_ADDRESS)).toEqual([]);
  });

  it("queryUserOrders returns [] when no orders", async () => {
    mockLimitContractId.mockReturnValue("CABC");
    stubRawResult(xdr.ScVal.scvVec([]));
    expect(await queryUserOrders(VALID_ADDRESS)).toEqual([]);
  });

  it("queryUserOrders fetches each order", async () => {
    mockLimitContractId.mockReturnValue("CABC");
    const orderScv = nativeToScVal({
      id: 7,
      owner: VALID_ADDRESS,
      base: "XLM",
      counter: "USDC",
      price: 1,
      amount: 1,
      expiry_ledger: 0,
      side: "buy",
      placed_at: 1,
    });
    buildMock.mockImplementation(async ({ method, parseResultXdr }) => {
      capturedParse = parseResultXdr;
      if (method === "get_user_orders") {
        stubRawResult(xdr.ScVal.scvVec([nativeToScVal(7, { type: "u64" })]));
        return makeTx();
      }
      stubRawResult(orderScv);
      return makeTx();
    });

    const orders = await queryUserOrders(VALID_ADDRESS);
    expect(orders.length).toBe(1);
    const first = orders[0];
    expect(first?.id).toBe(7);
  });

  it("queryOrderCount returns 0 when unconfigured", async () => {
    mockLimitContractId.mockReturnValue(null);
    expect(await queryOrderCount()).toBe(0);
  });

  it("queryOrderCount returns the count", async () => {
    mockLimitContractId.mockReturnValue("CABC");
    stubRawResult(xdr.ScVal.scvU32(5 as never));
    expect(await queryOrderCount()).toBe(5);
  });

  it("buildPlaceOrderTx returns null when unconfigured", async () => {
    mockLimitContractId.mockReturnValue(null);
    expect(await buildPlaceOrderTx(VALID_ADDRESS, "XLM", "USDC", 1, 1, 0, "buy")).toBeNull();
  });

  it("buildPlaceOrderTx returns XDR", async () => {
    mockLimitContractId.mockReturnValue("CABC");
    buildMock.mockResolvedValue(makeTx());
    expect(await buildPlaceOrderTx(VALID_ADDRESS, "XLM", "USDC", 1.5, 2.5, 0, "buy")).toBe(
      "tx-xdr"
    );
  });

  it("buildPlaceOrderTx returns null on error", async () => {
    mockLimitContractId.mockReturnValue("CABC");
    buildMock.mockRejectedValue(new Error("boom"));
    expect(await buildPlaceOrderTx(VALID_ADDRESS, "XLM", "USDC", 1, 1, 0, "buy")).toBeNull();
  });

  it("buildCancelOrExecuteTx uses cancel_order without txHash", async () => {
    mockLimitContractId.mockReturnValue("CABC");
    let capturedMethod = "";
    buildMock.mockImplementation(async ({ method }) => {
      capturedMethod = method;
      return makeTx();
    });
    await buildCancelOrExecuteTx(VALID_ADDRESS, 3);
    expect(capturedMethod).toBe("cancel_order");
  });

  it("buildCancelOrExecuteTx uses mark_executed with txHash", async () => {
    mockLimitContractId.mockReturnValue("CABC");
    let capturedMethod = "";
    buildMock.mockImplementation(async ({ method }) => {
      capturedMethod = method;
      return makeTx();
    });
    await buildCancelOrExecuteTx(VALID_ADDRESS, 3, "tx-hash");
    expect(capturedMethod).toBe("mark_executed");
  });

  it("buildCancelOrExecuteTx returns null when unconfigured", async () => {
    mockLimitContractId.mockReturnValue(null);
    expect(await buildCancelOrExecuteTx(VALID_ADDRESS, 3)).toBeNull();
  });
});

// =========================================================================
// market-oracle client
// =========================================================================
describe("market-oracle client", () => {
  it("observationFromScVal decodes an observation", () => {
    const scv = nativeToScVal({
      price: 10000000,
      ledger: 500,
      publisher: VALID_ADDRESS,
    });
    const obs = observationFromScVal(scv);
    expect(obs.price).toBe(10000000);
    expect(obs.ledger).toBe(500);
    expect(obs.publisher).toBe(VALID_ADDRESS);
  });

  it("observationFromScVal applies defaults for missing fields", () => {
    const scv = nativeToScVal({});
    const obs = observationFromScVal(scv);
    expect(obs.price).toBe(0);
    expect(obs.ledger).toBe(0);
    expect(obs.publisher).toBe("");
  });

  it("readPriceObservation returns null when unconfigured", async () => {
    mockOracleContractId.mockReturnValue(null);
    expect(await readPriceObservation("XLM", "USDC")).toBeNull();
  });

  it("readPriceObservation returns null for void result", async () => {
    mockOracleContractId.mockReturnValue("CABC");
    stubRawResult(xdr.ScVal.scvVoid());
    expect(await readPriceObservation("XLM", "USDC")).toBeNull();
  });

  it("readPriceObservation returns decoded observation", async () => {
    mockOracleContractId.mockReturnValue("CABC");
    const obsScv = nativeToScVal({
      price: 12345,
      ledger: 1,
      publisher: VALID_ADDRESS,
    });
    stubRawResult(obsScv);
    const obs = await readPriceObservation("XLM", "USDC");
    expect(obs?.price).toBe(12345);
  });

  it("readPriceObservation returns null on error", async () => {
    mockOracleContractId.mockReturnValue("CABC");
    buildMock.mockRejectedValue(new Error("rpc error"));
    expect(await readPriceObservation("XLM", "USDC")).toBeNull();
  });
});

// =========================================================================
// parseResultXdr arrow bodies (statement coverage)
// =========================================================================

describe("parseResultXdr arrow bodies", () => {
  beforeEach(() => {
    mockLimitContractId.mockReturnValue("CABC");
    mockContractId.mockReturnValue("CABC");
    buildMock.mockImplementation(
      async ({ parseResultXdr }: { parseResultXdr?: (scv: xdr.ScVal) => unknown }) => {
        capturedParse = parseResultXdr;
        return makeTx();
      }
    );
  });

  it("runs the place_order parser", async () => {
    await buildPlaceOrderTx(VALID_ADDRESS, "XLM", "USDC", 1, 1, 0, "buy");
    expect(capturedParse).toBeDefined();
    expect(capturedParse!(xdr.ScVal.scvSymbol("hello"))).toBe("hello");
  });

  it("runs the cancel/execute parser", async () => {
    await buildCancelOrExecuteTx(VALID_ADDRESS, 3);
    expect(capturedParse).toBeDefined();
    expect(capturedParse!(xdr.ScVal.scvVoid())).toBeUndefined();
  });

  it("runs the set_preferences parser", async () => {
    signAndSendMock.mockResolvedValue({
      getTransactionResponse: { status: "SUCCESS", txHash: "h" },
      sendTransactionResponse: { hash: "h" },
    });
    await writeTradingPreferences(VALID_ADDRESS, {
      max_slippage_bps: 100,
      routing_mode: "auto",
      allowed_assets: [],
    });
    expect(capturedParse).toBeDefined();
    expect(capturedParse!(xdr.ScVal.scvVoid())).toBeNull();
  });
});

// =========================================================================
// orderFromScVal default branches (missing fields)
// =========================================================================

describe("limit-order order defaults", () => {
  beforeEach(() => {
    mockLimitContractId.mockReturnValue("CABC");
    buildMock.mockImplementation(
      async ({ parseResultXdr }: { parseResultXdr?: (scv: xdr.ScVal) => unknown }) => {
        capturedParse = parseResultXdr;
        return makeTx();
      }
    );
  });

  it("applies defaults for an order missing every field", async () => {
    stubRawResult(xdr.ScVal.scvMap([]));
    const order = await queryOrder(1);
    expect(order).not.toBeNull();
    expect(order?.id).toBe(0);
    expect(order?.owner).toBe("");
    expect(order?.base).toBe("");
    expect(order?.counter).toBe("");
    expect(order?.price).toBe(0);
    expect(order?.amount).toBe(0);
    expect(order?.expiryLedger).toBe(0);
    expect(order?.placedAt).toBe(0);
  });
});

// =========================================================================
// trading-preferences batch defaults + non-Error rejection
// =========================================================================

describe("trading-preferences branch coverage", () => {
  const addr2 = "GADQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOZPI";

  beforeEach(() => {
    mockContractId.mockReturnValue("CABC");
    buildMock.mockImplementation(
      async ({ parseResultXdr }: { parseResultXdr?: (scv: xdr.ScVal) => unknown }) => {
        capturedParse = parseResultXdr;
        return makeTx();
      }
    );
  });

  it("applies defaults for missing batch preference fields", async () => {
    stubRawResult(nativeToScVal([[VALID_ADDRESS, {}]]));
    const map = await batchReadTradingPreferences([VALID_ADDRESS, addr2]);
    expect(map.get(VALID_ADDRESS)?.max_slippage_bps).toBe(100);
    expect(map.get(VALID_ADDRESS)?.routing_mode).toBe("auto");
    expect(map.get(VALID_ADDRESS)?.allowed_assets).toEqual([]);
  });

  it("returns failed when a non-Error is thrown during write", async () => {
    buildMock.mockRejectedValue("plain string failure");
    const result = await writeTradingPreferences(VALID_ADDRESS, {
      max_slippage_bps: 100,
      routing_mode: "auto",
      allowed_assets: [],
    });
    expect(result).toEqual({ ok: false, reason: "failed" });
  });
});
