import { getHorizonServer } from "@/lib/stellar/horizon";
import { fetchOrderbook } from "@/lib/stellar/orderbook";
import { toSdkAsset } from "@/lib/stellar/asset";
import { toToken } from "@/lib/stellar/tokens";
import type { Candle, MarketStats, Token } from "@/lib/stellar/types";

const HOUR_MS = 3_600_000;

/** Aggregate 24h of trade data into OHLCV candles (1h resolution). */
export async function fetchCandles(
  base: Token,
  counter: Token,
  startMs: number,
  endMs: number,
  resolutionMs = HOUR_MS
): Promise<Candle[]> {
  const server = getHorizonServer();
  const response = await server
    .tradeAggregation(toSdkAsset(base), toSdkAsset(counter), startMs, endMs, resolutionMs, 0)
    .limit(200)
    .call();

  return response.records.map((r) => ({
    timestamp: new Date(r.timestamp).getTime(),
    open: Number(r.open),
    high: Number(r.high),
    low: Number(r.low),
    close: Number(r.close),
    volumeBase: Number(r.base_volume),
    volumeCounter: Number(r.counter_volume),
    tradeCount: Number(r.trade_count),
  }));
}

/** Compute market stats for a token quoted against XLM. */
export async function getMarketStats(token: Token): Promise<MarketStats> {
  const xlm: Token = { code: "XLM", name: "Lumen", decimals: 7, isNative: true };

  // Direct price from the token/XLM orderbook
  let priceInXlm: number | null = null;
  let bestBid: number | null = null;
  let bestAsk: number | null = null;

  if (token.isNative) {
    // XLM is the quote asset itself — always priced at 1
    priceInXlm = 1;
  } else {
    try {
      const ob = await fetchOrderbook(token, xlm, 5);
      priceInXlm = ob.midPrice;
      bestBid = ob.bestBid;
      bestAsk = ob.bestAsk;
    } catch {
      // No market — leave null
    }
  }

  // 24h volume + change from trade aggregations (skipped for native XLM itself)
  let volume24hXlm = 0;
  let change24hPct: number | null = null;
  if (priceInXlm !== null && !token.isNative) {
    try {
      const end = Date.now();
      const start = end - 24 * HOUR_MS;
      const candles = await fetchCandles(token, xlm, start, end);
      volume24hXlm = candles.reduce((sum, c) => sum + c.volumeCounter, 0);
      const first = candles[0];
      const last = candles[candles.length - 1];
      if (first && last && first.open > 0) {
        change24hPct = ((last.close - first.open) / first.open) * 100;
      }
    } catch {
      // Aggregations unavailable
    }
  }

  return { token, priceInXlm, volume24hXlm, change24hPct, bestBid, bestAsk };
}

/** Fetch top traded assets from Horizon for market discovery. */
export async function fetchTopAssets(limit = 12): Promise<Token[]> {
  const server = getHorizonServer();
  const response = await server.assets().limit(limit).call();
  return response.records.map((r) => toToken(r.asset_code ?? "XLM", r.asset_issuer ?? undefined));
}

/** Fetch market stats for many tokens in parallel. */
export async function getMarketStatsForTokens(tokens: Token[]): Promise<MarketStats[]> {
  const stats = await Promise.allSettled(tokens.map((t) => getMarketStats(t)));
  return stats
    .filter((s): s is PromiseFulfilledResult<MarketStats> => s.status === "fulfilled")
    .map((s) => s.value);
}
