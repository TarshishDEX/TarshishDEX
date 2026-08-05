/**
 * Locale-aware currency formatting utilities.
 * All formatters respect the user's browser locale but can be overridden.
 */

export type CurrencyLocale = "en-US" | "de-DE" | "ja-JP" | "ko-KR" | "zh-CN" | "auto";

/**
 * Format a number as a fiat currency value.
 * Defaults to USD with the user's browser locale.
 */
export function formatFiatCurrency(
  value: number,
  currency = "USD",
  locale: CurrencyLocale = "auto"
): string {
  const resolved =
    locale === "auto" ? (typeof navigator !== "undefined" ? navigator.language : "en-US") : locale;

  return new Intl.NumberFormat(resolved, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number with configurable significant digits.
 * Useful for crypto amounts where precision varies.
 */
export function formatToken(
  value: number,
  decimals: number,
  locale: CurrencyLocale = "auto"
): string {
  const resolved =
    locale === "auto" ? (typeof navigator !== "undefined" ? navigator.language : "en-US") : locale;

  return new Intl.NumberFormat(resolved, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a percentage change with locale-aware sign.
 */
export function formatPercentageChange(
  value: number,
  locale: CurrencyLocale = "auto"
): string {
  const resolved =
    locale === "auto" ? (typeof navigator !== "undefined" ? navigator.language : "en-US") : locale;

  return new Intl.NumberFormat(resolved, {
    style: "percent",
    signDisplay: "exceptZero",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}
