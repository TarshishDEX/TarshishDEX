import BigNumber from "bignumber.js";
import type { OrderbookData, OrderbookFill } from "@/lib/stellar/types";
import { BASE_FEE_XLM } from "@/lib/stellar/config";

const ZERO = "0";

/**
 * Walk an orderbook to simulate selling `amountIn` of the base asset.
 * Consumes ask levels until the order fills or depth is exhausted.
 */
export function simulateOrderbookFill(
  amountIn: string,
  orderbook: OrderbookData
): OrderbookFill | null {
  const asks = orderbook.asks;
  if (asks.length === 0) return null;

  let remaining = new BigNumber(amountIn);
  let output = new BigNumber(ZERO);

  for (const level of asks) {
    if (remaining.isLessThanOrEqualTo(0)) break;
    const levelAmount = new BigNumber(level.amount.toString());
    const take = remaining.isLessThan(levelAmount) ? remaining : levelAmount;
    output = output.plus(take.times(level.price.toString()));
    remaining = remaining.minus(take);
  }

  const fullyFilled = remaining.isLessThanOrEqualTo(0);
  const outputStr = output.toString();
  const avgPrice = Number(amountIn) > 0 ? Number(output.dividedBy(amountIn).toString()) : 0;

  return { output: outputStr, avgPrice, fullyFilled };
}

/** Estimate price impact (%) of an execution against the orderbook mid price. */
export function computePriceImpact(avgPrice: number, midPrice: number | null): number {
  if (midPrice === null || midPrice <= 0 || avgPrice <= 0) return 0;
  return ((midPrice - avgPrice) / midPrice) * 100;
}

/** Compute minimum guaranteed output after slippage tolerance. */
export function computeMinReceived(outputAmount: string, slippagePct: number): string {
  const out = new BigNumber(outputAmount);
  const factor = new BigNumber(1).minus(new BigNumber(slippagePct.toString()).dividedBy(100));
  return out.times(factor).toString();
}

/** Build the standard fee estimate for a swap (2 ops: path payment + change trust overhead). */
export function estimateSwapFeeXlm(numHops: number): string {
  return new BigNumber(BASE_FEE_XLM).times(numHops + 1).toString();
}

/** Derive warnings from a simulation result. */
export function buildWarnings(
  fill: OrderbookFill | null,
  priceImpactPct: number,
  slippagePct: number
): string[] {
  const warnings: string[] = [];
  if (!fill) {
    warnings.push("No liquidity found for this route.");
    return warnings;
  }
  if (!fill.fullyFilled) {
    warnings.push("Insufficient orderbook depth — your order may only partially fill.");
  }
  if (priceImpactPct > 1) {
    warnings.push(`High price impact (${priceImpactPct.toFixed(2)}%). Consider a smaller amount.`);
  }
  if (priceImpactPct > slippagePct) {
    warnings.push("Estimated price impact exceeds your slippage tolerance.");
  }
  if (priceImpactPct > 5) {
    warnings.push("Extreme price impact detected. This trade may be unfavorable.");
  }
  return warnings;
}
