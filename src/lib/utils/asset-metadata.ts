/**
 * Asset metadata helpers for Stellar tokens.
 */

/** Known Stellar assets with their metadata. */
export const KNOWN_ASSETS: Record<string, { name: string; domain?: string }> = {
  USDC: { name: "USD Coin", domain: "circle.com" },
  USDT: { name: "Tether USD", domain: "tether.to" },
  BTC: { name: "Bitcoin (Stellar)", domain: "ultrastellar.com" },
  ETH: { name: "Ethereum (Stellar)", domain: "ultrastellar.com" },
  EURMTL: { name: "EUR Montelibero" },
  SHX: { name: "Stronghold Token", domain: "stronghold.co" },
  AQUA: { name: "Aquarius", domain: "aqua.network" },
  yXLM: { name: "yXLM (Ultra Stellar)", domain: "ultrastellar.com" },
  XRP: { name: "XRP (Stellar)", domain: "ultrastellar.com" },
};

/** Get the display name for an asset code. */
export function getAssetDisplayName(code: string): string {
  return KNOWN_ASSETS[code]?.name ?? code;
}

/** Get the domain for an asset issuer, if known. */
export function getAssetDomain(code: string): string | undefined {
  return KNOWN_ASSETS[code]?.domain;
}
