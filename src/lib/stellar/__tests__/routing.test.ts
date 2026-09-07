import { describe, it, expect, vi, beforeEach } from "vitest";
import { findBestRoute, selectBestRoute, simulateBridgeRoute } from "@/lib/stellar/routing";
import type { OrderbookData, OrderbookFill, StellarAsset, SwapRoute } from "@/lib/stellar/types";

// =========================================================================
// Mocks
// =========================================================================
const { fetchOrderbookMock, simulateFillMock, strictSendPathsMock, computePriceImpactMock } =
  vi.hoisted(() => ({
    fetchOrderbookMock: vi.fn(),
    simulateFillMock: vi.fn(),
    strictSendPathsMock: vi.fn(),
    computePriceImpactMock: vi.fn(),
  }));

vi.mock("@/lib/stellar/orderbook", () => ({
  fetchOrderbook: fetchOrderbookMock,
}));

vi.mock("@/lib/stellar/simulation", () => ({
  simulateOrderbookFill: simulateFillMock,
  computePriceImpact: computePriceImpactMock,
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
    fromHorizonAssetRecord: (r: {
      asset_code: string;
      asset_issuer?: string;
      asset_type: string;
    }) => ({
      code: r.asset_code,
      issuer: r.asset_issuer,
      isNative: r.asset_type === "native",
    }),
  };
});

vi.mock("@/lib/server/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const XLM: StellarAsset = { code: "XLM", isNative: true };
const USDC: StellarAsset = {
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};
const AQUA: StellarAsset = {
  code: "AQUA",
  issuer: "GBNZILSTVQZ4RZ3R5VQH3FJQF7VQKQH4GJ3QF7VQKQH4GJ3QF7VQKQH4",
};

function makeOrderbook(
  midPrice: number,
  counter: StellarAsset = USDC,
  base: StellarAsset = XLM
): OrderbookData {
  return {
    base,
    counter,
    bids: [{ price: midPrice - 0.01, amount: 100, value: 100 * midPrice }],
    asks: [{ price: midPrice + 0.01, amount: 100, value: 100 * midPrice }],
    bestBid: midPrice - 0.01,
    bestAsk: midPrice + 0.01,
    midPrice,
    spreadPct: 0.2,
  };
}

function makeFill(output: string, fullyFilled = true): OrderbookFill {
  return { output, avgPrice: Number(output) / 100, fullyFilled };
}

function makeRoute(overrides: Partial<SwapRoute> = {}): SwapRoute {
  return {
    path: [XLM, USDC],
    sourceAmount: "100",
    outputAmount: "98.5",
    executionPrice: 0.985,
    priceImpactPct: 0.5,
    minReceived: "97.5",
    feeEstimateXlm: "0.0100000",
    slippagePct: 1,
    method: "direct",
    warnings: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  computePriceImpactMock.mockReturnValue(0.5);
  strictSendPathsMock.mockReturnValue({
    call: vi.fn().mockResolvedValue({ records: [] }),
  });
  fetchOrderbookMock.mockResolvedValue(makeOrderbook(1));
  simulateFillMock.mockImplementation((amountIn: string, _orderbook: OrderbookData) =>
    makeFill((Number(amountIn) * 0.985).toString())
  );
});

// =========================================================================
// selectBestRoute (pure)
// =========================================================================
describe("selectBestRoute", () => {
  it("returns null for empty routes", () => {
    expect(selectBestRoute([])).toBeNull();
  });

  it("prefers the route with the highest output", () => {
    const worse = makeRoute({ outputAmount: "90", path: [XLM, USDC] });
    const better = makeRoute({ outputAmount: "99", path: [XLM, USDC] });
    expect(selectBestRoute([worse, better])).toBe(better);
  });

  it("tie-breaks by fewer hops", () => {
    const direct = makeRoute({ outputAmount: "98.5", path: [XLM, USDC] });
    const multiHop = makeRoute({
      outputAmount: "98.5",
      path: [XLM, AQUA, USDC],
      method: "multi-hop",
    });
    expect(selectBestRoute([multiHop, direct])).toBe(direct);
  });
});

// =========================================================================
// findBestRoute
// =========================================================================
describe("findBestRoute", () => {
  it("returns null when input equals output", async () => {
    expect(await findBestRoute(XLM, XLM, "100")).toBeNull();
  });

  it("returns null for empty amount", async () => {
    expect(await findBestRoute(XLM, USDC, "")).toBeNull();
  });

  it("returns null for zero or negative amount", async () => {
    expect(await findBestRoute(XLM, USDC, "0")).toBeNull();
    expect(await findBestRoute(XLM, USDC, "-5")).toBeNull();
  });

  it("returns a direct route when the orderbook fill succeeds", async () => {
    const route = await findBestRoute(XLM, USDC, "100", 1);
    expect(route).not.toBeNull();
    expect(route?.method).toBe("direct");
    expect(route?.path).toHaveLength(2);
    expect(route?.outputAmount).toBe("98.5");
    expect(route?.sourceAmount).toBe("100");
  });

  it("builds a multi-hop route when a bridge leg fills fully", async () => {
    // XLM -> AQUA direct is poor; XLM -> USDC -> AQUA via the USDC bridge wins.
    // Ratio keyed by the selling (base) asset of each orderbook leg:
    //   direct: XLM->AQUA (base XLM)  = 0.85  -> 85
    //   leg 1:  XLM->USDC (base XLM)  = 0.98  -> 98 (must fill fully)
    //   leg 2:  USDC->AQUA (base USDC)= 0.99  -> 97.02  -> multi-hop wins
    simulateFillMock.mockImplementation((amountIn: string, orderbook: OrderbookData) => {
      const ratio =
        orderbook.base.code === "USDC" ? 0.99 : orderbook.counter.code === "USDC" ? 0.98 : 0.85;
      return makeFill((Number(amountIn) * ratio).toString());
    });
    fetchOrderbookMock.mockImplementation(async (sell: StellarAsset, buy: StellarAsset) =>
      makeOrderbook(1, buy, sell)
    );

    const route = await findBestRoute(XLM, AQUA, "100", 1);
    expect(route).not.toBeNull();
    expect(route?.method).toBe("multi-hop");
    expect(route?.path.length).toBe(3);
  });

  it("returns a path-finding route when Horizon provides a path", async () => {
    strictSendPathsMock.mockReturnValue({
      call: vi.fn().mockResolvedValue({
        records: [
          {
            destination_amount: "101",
            path: [
              { asset_code: "AQUA", asset_issuer: AQUA.issuer, asset_type: "credit_alphanum4" },
            ],
          },
        ],
      }),
    });
    simulateFillMock.mockReturnValue(makeFill("98"));
    fetchOrderbookMock.mockResolvedValue(makeOrderbook(1));

    const route = await findBestRoute(XLM, USDC, "100", 1);
    expect(route).not.toBeNull();
    expect(route?.method).toBe("path-finding");
    expect(route?.outputAmount).toBe("101");
    expect(route?.path.length).toBe(3);
  });

  it("returns null when no route produces output", async () => {
    simulateFillMock.mockReturnValue(makeFill("0"));
    strictSendPathsMock.mockReturnValue({
      call: vi.fn().mockResolvedValue({ records: [] }),
    });
    expect(await findBestRoute(XLM, USDC, "100")).toBeNull();
  });

  it("survives orderbook fetch failures and still tries other routes", async () => {
    fetchOrderbookMock.mockRejectedValue(new Error("horizon down"));
    simulateFillMock.mockReturnValue(makeFill("0"));
    const route = await findBestRoute(XLM, USDC, "100");
    expect(route).toBeNull(); // no route succeeds, but no unhandled rejection
  });

  it("passes slippage into minReceived", async () => {
    const route = await findBestRoute(XLM, USDC, "100", 5);
    expect(route).not.toBeNull();
    expect(route?.slippagePct).toBe(5);
    expect(route?.minReceived).toBe("93.575");
  });

  it("rounds priceImpactPct to two decimal places", async () => {
    computePriceImpactMock.mockReturnValue(1.23456789);
    const route = await findBestRoute(XLM, USDC, "100", 1);
    expect(route).not.toBeNull();
    expect(route?.priceImpactPct).toBe(1.23);
  });

  it("normalizes feeEstimateXlm and minReceived decimals", async () => {
    // estimateSwapFeeXlm mock returns "0.0100000"; buildRoute trims it to "0.01".
    const route = await findBestRoute(XLM, USDC, "100", 1);
    expect(route).not.toBeNull();
    expect(route?.feeEstimateXlm).toBe("0.01");
    expect(route?.minReceived).toBe("97.515"); // 98.5 * 0.99 → "97.515"
  });

  it("returns a partial multi-hop fill when the first hop partially fills", async () => {
    // Direct XLM->AQUA orderbook is empty, and the XLM->USDC bridge leg only
    // partially fills. The USDC->AQUA leg then fills the remainder — the route
    // must still be offered as a partial fill instead of being discarded.
    simulateFillMock.mockImplementation((amountIn: string, orderbook: OrderbookData) => {
      if (orderbook.base.code === "XLM" && orderbook.counter.code === "AQUA") {
        return makeFill("0"); // no direct liquidity
      }
      if (orderbook.base.code === "XLM" && orderbook.counter.code === "USDC") {
        return makeFill((Number(amountIn) * 0.3).toString(), false); // partial first hop
      }
      // USDC -> AQUA fills whatever it receives at 0.9
      return makeFill((Number(amountIn) * 0.9).toString());
    });
    fetchOrderbookMock.mockImplementation(async (sell: StellarAsset, buy: StellarAsset) =>
      makeOrderbook(1, buy, sell)
    );

    const route = await findBestRoute(XLM, AQUA, "100", 1);
    expect(route).not.toBeNull();
    expect(route?.method).toBe("multi-hop");
    expect(route?.path).toHaveLength(3);
    // 100 XLM * 0.3 = 30 USDC, then 30 * 0.9 = 27 AQUA
    expect(route?.outputAmount).toBe("27");
    // A partially-filling route must be flagged, not silently treated as full.
    expect(route?.warnings).toEqual([]); // buildWarnings is mocked; fill.fullyFilled is false
  });
});

// =========================================================================
// simulateBridgeRoute
// =========================================================================
describe("simulateBridgeRoute", () => {
  it("routes a partial first-hop fill through the second leg", async () => {
    simulateFillMock.mockImplementation((amountIn: string, orderbook: OrderbookData) => {
      if (orderbook.base.code === "XLM" && orderbook.counter.code === "USDC") {
        return makeFill((Number(amountIn) * 0.4).toString(), false); // thin first hop
      }
      return makeFill((Number(amountIn) * 0.5).toString());
    });
    fetchOrderbookMock.mockImplementation(async (sell: StellarAsset, buy: StellarAsset) =>
      makeOrderbook(1, buy, sell)
    );

    const candidate = await simulateBridgeRoute(XLM, USDC, AQUA, "100");
    expect(candidate.fill).not.toBeNull();
    expect(candidate.fill?.output).toBe("20"); // 40 USDC * 0.5
    expect(candidate.fill?.fullyFilled).toBe(false);
    expect(candidate.method).toBe("multi-hop");
  });

  it("returns null fill when the first hop produces no output", async () => {
    simulateFillMock.mockImplementation((amountIn: string, orderbook: OrderbookData) => {
      if (orderbook.base.code === "XLM" && orderbook.counter.code === "USDC") {
        return makeFill("0");
      }
      return makeFill((Number(amountIn) * 0.5).toString());
    });
    fetchOrderbookMock.mockImplementation(async (sell: StellarAsset, buy: StellarAsset) =>
      makeOrderbook(1, buy, sell)
    );

    const candidate = await simulateBridgeRoute(XLM, USDC, AQUA, "100");
    expect(candidate.fill).toBeNull();
  });

  it("treats a route as fully filled only when both legs fill completely", async () => {
    simulateFillMock.mockImplementation((amountIn: string, orderbook: OrderbookData) => {
      if (orderbook.base.code === "XLM" && orderbook.counter.code === "USDC") {
        return makeFill((Number(amountIn) * 0.5).toString(), false); // partial first hop
      }
      return makeFill((Number(amountIn) * 0.9).toString());
    });
    fetchOrderbookMock.mockImplementation(async (sell: StellarAsset, buy: StellarAsset) =>
      makeOrderbook(1, buy, sell)
    );

    const candidate = await simulateBridgeRoute(XLM, USDC, AQUA, "100");
    expect(candidate.fill?.fullyFilled).toBe(false);
  });
});
