/** A Stellar asset reference (native XLM or issued asset). */
export interface StellarAsset {
  code: string;
  issuer?: string;
  isNative?: boolean;
}

/** A tradeable token with display metadata. */
export interface Token extends StellarAsset {
  name: string;
  decimals: number;
  icon?: string;
  domain?: string;
}

/** One level of an orderbook (bids or asks). */
export interface OrderbookLevel {
  price: number;
  amount: number;
  value: number;
}

/** Normalized orderbook data for a base/counter pair. */
export interface OrderbookData {
  base: StellarAsset;
  counter: StellarAsset;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  bestBid: number | null;
  bestAsk: number | null;
  midPrice: number | null;
  spreadPct: number | null;
}

/** Result of walking an orderbook to fill an order. */
export interface OrderbookFill {
  output: string;
  avgPrice: number;
  fullyFilled: boolean;
}

/** A candidate swap route and its estimated outcome. */
export interface SwapRoute {
  path: StellarAsset[];
  sourceAmount: string;
  outputAmount: string;
  executionPrice: number;
  priceImpactPct: number;
  minReceived: string;
  feeEstimateXlm: string;
  slippagePct: number;
  method: "direct" | "multi-hop" | "path-finding";
  warnings: string[];
}

/** OHLCV candle from Horizon trade aggregations. */
export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volumeBase: number;
  volumeCounter: number;
  tradeCount: number;
}

/** Market stats for a token quoted against XLM. */
export interface MarketStats {
  token: Token;
  priceInXlm: number | null;
  volume24hXlm: number;
  change24hPct: number | null;
  bestBid: number | null;
  bestAsk: number | null;
}
