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
    console.warn("[routing] direct orderbook failed", error);
    return { path: [input, output], fill: null, method: "direct", midPrice: null };
  }
}

/** Simulate a two-hop swap through a bridge asset. */
async function simulateBridgeRoute(
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
    if (!firstFill || !firstFill.fullyFilled) {
      return { path: [input, bridge, output], fill: null, method: "multi-hop", midPrice: null };
    }
    const second = await fetchOrderbook(bridge, output, 100);
    const secondFill = simulateOrderbookFill(firstFill.output, second);
    // Execution price is the combined output per input
    const combinedMid =
      first.midPrice !== null && second.midPrice !== null
        ? Number(
            new BigNumber(first.midPrice.toString()).times(second.midPrice.toString()).toString()
          )
        : null;
    return {
      path: [input, bridge, output],
      fill: secondFill,
      method: "multi-hop",
      midPrice: combinedMid,
    };
  } catch (error) {
    console.warn("[routing] bridge route failed", error);
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
    console.warn("[routing] horizon path finding unavailable", error);
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
  const priceImpactPct = computePriceImpact(candidate.fill.avgPrice, candidate.midPrice);
  const warnings = buildWarnings(candidate.fill, priceImpactPct, slippagePct);
  return {
    path: candidate.path,
    sourceAmount: amountIn,
    outputAmount: candidate.fill.output,
    executionPrice: candidate.fill.avgPrice,
    priceImpactPct,
    minReceived: computeMinReceived(candidate.fill.output, slippagePct),
    feeEstimateXlm: estimateSwapFeeXlm(Math.max(1, candidate.path.length - 1)),
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

  if (routes.length === 0) return null;

  // Prefer the highest output; tie-break by fewer hops.
  return routes.sort((a, b) => {
    const diff = Number(b.outputAmount) - Number(a.outputAmount);
    if (Math.abs(diff) > 1e-12) return diff;
    return a.path.length - b.path.length;
  })[0];
}
