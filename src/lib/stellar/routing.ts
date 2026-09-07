import BigNumber from "bignumber.js";
import { getHorizonServer } from "@/lib/stellar/horizon";
import { fetchOrderbook } from "@/lib/stellar/orderbook";
import { fromHorizonAssetRecord, isSameAsset, toSdkAsset } from "@/lib/stellar/asset";
import {
  buildWarnings,
  computePriceImpact,
  computeMinReceived,
  estimateSwapFeeXlm,
  simulateOrderbookFill,
} from "@/lib/stellar/simulation";
import { formatAmount } from "@/lib/utils";
import { logger } from "@/lib/server/logger";
import type { OrderbookFill, StellarAsset, SwapRoute } from "@/lib/stellar/types";

/** Bridge assets tried for multi-hop routing. */
const BRIDGE_TOKENS: StellarAsset[] = [
  { code: "XLM", isNative: true },
  { code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" },
];

interface RouteCandidate {
  path: StellarAsset[];
  fill: OrderbookFill | null;
  method: SwapRoute["method"];
  midPrice: number | null;
}

/** Simulate a direct single-hop swap through the orderbook. */
async function simulateDirectRoute(
  input: StellarAsset,
  output: StellarAsset,
  amountIn: string
): Promise<RouteCandidate> {
  try {
    const orderbook = await fetchOrderbook(input, output, 100);
    const fill = simulateOrderbookFill(amountIn, orderbook);
    return {
      path: [input, output],
      fill,
      method: "direct",
      midPrice: orderbook.midPrice,
    };
  } catch (error) {
    logger.warn("routing: direct orderbook fetch failed", { error: String(error) });
    return { path: [input, output], fill: null, method: "direct", midPrice: null };
  }
}

/** Simulate a two-hop swap through a bridge asset. */
export async function simulateBridgeRoute(
  input: StellarAsset,
  bridge: StellarAsset,
  output: StellarAsset,
  amountIn: string
): Promise<RouteCandidate> {
  if (isSameAsset(input, bridge) || isSameAsset(bridge, output)) {
    return { path: [input, bridge, output], fill: null, method: "multi-hop", midPrice: null };
  }
  try {
    const first = await fetchOrderbook(input, bridge, 100);
    const firstFill = simulateOrderbookFill(amountIn, first);
    // Bail out when the first hop yields no fill at all — a zero-output leg is
    // indistinguishable from no liquidity and would only produce a useless
    // "route" with a zero output (mirrors buildRoute's own guard).
    if (!firstFill || firstFill.output === "0" || firstFill.output === "") {
      return { path: [input, bridge, output], fill: null, method: "multi-hop", midPrice: null };
    }

    // A partially-filled first hop still produces bridge output worth routing
    // through the second leg. Only bail out when the first hop yields nothing
    // at all — gating the second hop on `fullyFilled` discarded valid partial
    // fills on thin orderbooks.
    const second = await fetchOrderbook(bridge, output, 100);
    const secondFill = simulateOrderbookFill(firstFill.output, second);

    // Execution price is the combined output per input
    const combinedMid =
      first.midPrice !== null && second.midPrice !== null
        ? Number(
            new BigNumber(first.midPrice.toString()).times(second.midPrice.toString()).toString()
          )
        : null;

    if (!secondFill) {
      return {
        path: [input, bridge, output],
        fill: null,
        method: "multi-hop",
        midPrice: combinedMid,
      };
    }

    // The route only fully fills when BOTH legs fill completely; a partial
    // first hop makes the whole route a partial fill. The combined execution
    // price is the final output per unit of input, which keeps price-impact
    // scoring consistent for partial fills.
    const fullyFilled = firstFill.fullyFilled && secondFill.fullyFilled;
    const combinedOutput = new BigNumber(secondFill.output);
    const avgPrice = firstFill.fullyFilled
      ? secondFill.avgPrice
      : Number(amountIn) > 0
        ? Number(combinedOutput.dividedBy(amountIn).toString())
        : 0;

    return {
      path: [input, bridge, output],
      fill: { output: secondFill.output, avgPrice, fullyFilled },
      method: "multi-hop",
      midPrice: combinedMid,
    };
  } catch (error) {
    logger.warn("routing: bridge route fetch failed", { error: String(error) });
    return { path: [input, bridge, output], fill: null, method: "multi-hop", midPrice: null };
  }
} /** Query Horizon's strict-send path finding as a routing enhancement. */
async function simulateHorizonPath(
  input: StellarAsset,
  output: StellarAsset,
  amountIn: string
): Promise<RouteCandidate> {
  try {
    const server = getHorizonServer();
    // SDK v16 accepts the destination asset list directly.
    const response = await server
      .strictSendPaths(toSdkAsset(input), amountIn, [toSdkAsset(output)])
      .call();

    const records = response.records.filter(
      (r) => r.destination_amount && Number(r.destination_amount) > 0
    );
    if (records.length === 0) {
      return { path: [input, output], fill: null, method: "path-finding", midPrice: null };
    }

    // Pick the path with the greatest destination amount
    const best = records.reduce((acc, r) =>
      Number(r.destination_amount) > Number(acc.destination_amount) ? r : acc
    );

    return {
      path: [input, ...best.path.map(fromHorizonAssetRecord), output],
      fill: {
        output: best.destination_amount,
        avgPrice: Number(amountIn) > 0 ? Number(best.destination_amount) / Number(amountIn) : 0,
        fullyFilled: true,
      },
      method: "path-finding",
      midPrice: null,
    };
  } catch (error) {
    logger.warn("routing: Horizon path-finding unavailable", { error: String(error) });
    return { path: [input, output], fill: null, method: "path-finding", midPrice: null };
  }
}

function buildRoute(
  candidate: RouteCandidate,
  input: StellarAsset,
  output: StellarAsset,
  amountIn: string,
  slippagePct: number
): SwapRoute | null {
  if (!candidate.fill || candidate.fill.output === "0" || candidate.fill.output === "") {
    return null;
  }
  const rawPriceImpactPct = computePriceImpact(candidate.fill.avgPrice, candidate.midPrice);
  // Round the response value to 2 decimals; warnings still use the raw value
  // so their thresholds are unaffected by display rounding.
  const priceImpactPct = Number(rawPriceImpactPct.toFixed(2));
  const warnings = buildWarnings(candidate.fill, rawPriceImpactPct, slippagePct);
  return {
    path: candidate.path,
    sourceAmount: amountIn,
    outputAmount: candidate.fill.output,
    executionPrice: candidate.fill.avgPrice,
    priceImpactPct,
    minReceived: formatAmount(computeMinReceived(candidate.fill.output, slippagePct)),
    feeEstimateXlm: formatAmount(estimateSwapFeeXlm(Math.max(1, candidate.path.length - 1))),
    slippagePct,
    method: candidate.method,
    warnings,
  };
}

/**
 * Find the most efficient route for a swap. Compares direct orderbook execution,
 * multi-hop bridge routes, and Horizon path-finding, returning the best output.
 */
export async function findBestRoute(
  input: StellarAsset,
  output: StellarAsset,
  amountIn: string,
  slippagePct = 1
): Promise<SwapRoute | null> {
  if (isSameAsset(input, output)) return null;
  if (!amountIn || Number(amountIn) <= 0) return null;

  const candidates: RouteCandidate[] = await Promise.all([
    simulateDirectRoute(input, output, amountIn),
    ...BRIDGE_TOKENS.map((bridge) => simulateBridgeRoute(input, bridge, output, amountIn)),
    simulateHorizonPath(input, output, amountIn),
  ]);

  const routes = candidates
    .map((c) => buildRoute(c, input, output, amountIn, slippagePct))
    .filter((r): r is SwapRoute => r !== null);

  return selectBestRoute(routes);
}

/**
 * Pure route selection: prefer the highest output, tie-break by fewer hops.
 * Extracted for unit testing.
 */
export function selectBestRoute(routes: SwapRoute[]): SwapRoute | null {
  if (routes.length === 0) return null;
  // Copy before sorting — never mutate the caller's array.
  const sorted = [...routes].sort((a, b) => {
    const diff = Number(b.outputAmount) - Number(a.outputAmount);
    if (Math.abs(diff) > 1e-12) return diff;
    return a.path.length - b.path.length;
  });
  return sorted[0] ?? null;
}
