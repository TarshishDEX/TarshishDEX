/**
 * Application-wide constants.
 * Centralizes magic numbers so they're easy to find and change.
 */

/** Maximum slippage in basis points (100%). */
export const MAX_SLIPPAGE_BPS = 10_000;

/** Default slippage in basis points (1%). */
export const DEFAULT_SLIPPAGE_BPS = 100;

/** Maximum assets in a swap route. */
export const MAX_ROUTE_HOPS = 5;

/** Default number of orderbook levels to fetch. */
export const DEFAULT_ORDERBOOK_DEPTH = 50;

/** Maximum number of trade history entries. */
export const MAX_TRADE_HISTORY = 200;

/** Minimum XLM reserve for a Stellar account (in stroops). */
export const MIN_XLM_RESERVE_STROOPS = 1_000_000n; // 1 XLM

/** Maximum entries in the token watchlist. */
export const MAX_WATCHLIST_SIZE = 20;

/** Default quote refresh interval in milliseconds. */
export const DEFAULT_QUOTE_REFRESH_MS = 15_000;

/** Maximum asset code length (Stellar protocol limit). */
export const MAX_ASSET_CODE_LENGTH = 12;

/** Stellar public key length. */
export const STELLAR_PUBLIC_KEY_LENGTH = 56;

/** App name for metadata and headers. */
export const APP_NAME = "TarshishDEX";
