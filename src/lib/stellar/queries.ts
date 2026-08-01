import { useQuery } from "@tanstack/react-query";
import { findBestRoute } from "@/lib/stellar/routing";
import { fetchOrderbook } from "@/lib/stellar/orderbook";
import { getMarketStatsForTokens, fetchTopAssets } from "@/lib/stellar/prices";
import type { StellarAsset, SwapRoute } from "@/lib/stellar/types";

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
}
