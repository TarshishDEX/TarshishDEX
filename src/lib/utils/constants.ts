/** Application-wide constants. */

/** Default slippage tolerance in basis points (0.5%). */
export const DEFAULT_SLIPPAGE_BPS = 50;

/** Maximum allowed slippage in basis points (5%). */
export const MAX_SLIPPAGE_BPS = 500;

/** Default quote expiration time in milliseconds (30 seconds). */
export const QUOTE_EXPIRATION_MS = 30_000;

/** Polling interval for live data refreshes. */
export const LIVE_REFRESH_INTERVAL_MS = 10_000;

/** Maximum number of assets displayed per page. */
export const ASSETS_PER_PAGE = 50;

/** Maximum number of trade history entries shown. */
export const MAX_TRADE_HISTORY = 100;

/** Stellar native asset identifier. */
export const XLM_NATIVE = "native";

/** Horizon API rate limit (requests per second). */
export const HORIZON_RATE_LIMIT = 10;

/** Testnet network passphrase. */
export const STELLAR_TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

/** Public network passphrase. */
export const STELLAR_PUBLIC_PASSPHRASE = "Public Global Stellar Network ; September 2015";
