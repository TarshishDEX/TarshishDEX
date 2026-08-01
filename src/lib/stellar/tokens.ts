import type { Token } from "@/lib/stellar/types";
import { STELLAR_DECIMALS } from "@/lib/stellar/config";

/**
 * Curated registry of well-known Stellar assets, testnet-honest by default.
 * The app targets Testnet, so only assets with testnet-verified issuers are
 * listed here; any other asset can be added manually via CODE:ISSUER input.
 */
export const KNOWN_TOKENS: Token[] = [
  {
    code: "XLM",
    name: "Lumen",
    decimals: STELLAR_DECIMALS,
    isNative: true,
    icon: "⬡",
  },
  {
    code: "USDC",
    name: "USD Coin",
    decimals: STELLAR_DECIMALS,
    issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    domain: "centre.io",
    icon: "💵",
  },
];

/** Look up a token in the registry by code (first match wins). */
export function findKnownToken(code: string): Token | undefined {
  return KNOWN_TOKENS.find((t) => t.code.toUpperCase() === code.toUpperCase());
}

/** Build a Token from a code + optional issuer, preferring registry metadata. */
export function toToken(code: string, issuer?: string): Token {
  const known = findKnownToken(code);
  return (
    known ?? {
      code: code.toUpperCase(),
      name: code.toUpperCase(),
      decimals: STELLAR_DECIMALS,
      issuer,
    }
  );
}
