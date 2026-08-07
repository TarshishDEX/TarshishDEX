import { useQuery } from "@tanstack/react-query";
import { findBestRoute } from "@/lib/stellar/routing";
import { fetchOrderbook } from "@/lib/stellar/orderbook";
import { getMarketStatsForTokens, fetchTopAssets, fetchCandles } from "@/lib/stellar/prices";
import { fetchPortfolioSummary, fetchXlmBalance, isValidPublicKey } from "@/lib/stellar/account";
import { fetchTradeHistory } from "@/lib/stellar/history";
import { readPriceObservation } from "@/lib/soroban/market-oracle";
import type { StellarAsset, SwapRoute, Token } from "@/lib/stellar/types";

/** Live quote for a swap via the routing engine. */
export function useSwapQuote(
  input: StellarAsset | null,
  output: StellarAsset | null,
  amountIn: string,
  slippagePct: number
) {
  return useQuery({
    queryKey: [
      "swap-quote",
      input?.code,
      input?.issuer ?? "",
      output?.code,
      output?.issuer ?? "",
      amountIn,
      slippagePct,
    ],
    queryFn: async (): Promise<SwapRoute | null> => {
      if (!input || !output || !amountIn || Number(amountIn) <= 0) return null;
      return findBestRoute(input, output, amountIn, slippagePct);
    },
    enabled: Boolean(
      input && output && amountIn && Number(amountIn) > 0 && input.code !== output.code
    ),
  });
}

/** Orderbook depth for a pair. */
export function useOrderbook(selling: StellarAsset, buying: StellarAsset) {
  return useQuery({
    queryKey: ["orderbook", selling.code, selling.issuer ?? "", buying.code, buying.issuer ?? ""],
    queryFn: () => fetchOrderbook(selling, buying, 20),
  });
}

/** Market stats for a curated set of tokens. */
export function useMarketStats() {
  return useQuery({
    queryKey: ["market-stats"],
    queryFn: async () => {
      const tokens = await fetchTopAssets(10);
      return getMarketStatsForTokens(tokens);
    },
    staleTime: 30_000,
  });
} /** Portfolio summary for a Stellar address (watch mode). */
export function usePortfolioSummary(address: string) {
  return useQuery({
    queryKey: ["portfolio", address],
    queryFn: () => fetchPortfolioSummary(address),
    enabled: Boolean(address && isValidPublicKey(address)),
    staleTime: 20_000,
  });
}

/** Native XLM balance for a connected wallet (refreshed on invalidation). */
export function useXlmBalance(address: string) {
  return useQuery({
    queryKey: ["xlm-balance", address],
    queryFn: () => fetchXlmBalance(address),
    enabled: Boolean(address && isValidPublicKey(address)),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

/** Trade history for a Stellar address. */
export function useTradeHistory(address: string) {
  return useQuery({
    queryKey: ["trade-history", address],
    queryFn: () => fetchTradeHistory(address),
    enabled: Boolean(address && isValidPublicKey(address)),
    staleTime: 20_000,
  });
}

/** OHLCV price history for a pair over a given lookback range, used by the analytics charts. */
export function usePriceHistory(
  base: Token,
  counter: Token,
  resolutionMs: number,
  rangeMs: number
) {
  return useQuery({
    queryKey: [
      "price-history",
      base.code,
      base.issuer ?? "",
      counter.code,
      counter.issuer ?? "",
      resolutionMs,
      rangeMs,
    ],
    queryFn: () => fetchCandles(base, counter, Date.now() - rangeMs, Date.now(), resolutionMs),
    enabled: Boolean(base && counter && base.code !== counter.code),
    staleTime: 60_000,
  });
}

/** Current oracle price for a pair from the market-oracle Soroban contract. */
export function useOraclePrice(base: string, counter: string) {
  return useQuery({
    queryKey: ["oracle-price", base, counter],
    queryFn: () => readPriceObservation(base, counter),
    enabled: Boolean(base && counter),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
