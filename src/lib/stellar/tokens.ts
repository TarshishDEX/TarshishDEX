import type { Token } from "@/lib/stellar/types";
import { STELLAR_DECIMALS } from "@/lib/stellar/config";

/** Curated registry of well-known Stellar assets (testnet-focused by default). */
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
  {
    code: "USDT",
    name: "Tether",
    decimals: STELLAR_DECIMALS,
    issuer: "GCQTGZ4Z3J4YDGJJVVVKPNZBV4MU7YQN7S7AQLBEKBCGBA4XPTQ2Z7LM",
    domain: "tether.to",
    icon: "💲",
  },
  {
    code: "BRL",
    name: "Brazilian Digital",
    decimals: STELLAR_DECIMALS,
    issuer: "GDVKY2GU2DSXWTYHHGSWS4TKWB4DP2QJX5YCDHMQOVVRSDWEWV7CYPBH",
    domain: "stably.io",
    icon: "🇧🇷",
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
