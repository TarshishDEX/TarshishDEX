import { describe, it, expect } from "vitest";
import { findKnownToken, toToken, KNOWN_TOKENS } from "@/lib/stellar/tokens";
import { STELLAR_DECIMALS } from "@/lib/stellar/config";

describe("findKnownToken", () => {
  it("finds XLM by code", () => {
    const token = findKnownToken("XLM");
    expect(token).toBeDefined();
    expect(token!.code).toBe("XLM");
    expect(token!.isNative).toBe(true);
  });

  it("finds USDC by code", () => {
    const token = findKnownToken("USDC");
    expect(token).toBeDefined();
    expect(token!.code).toBe("USDC");
    expect(token!.issuer).toBe(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
  });

  it("is case-insensitive", () => {
    expect(findKnownToken("xlm")).toBeDefined();
    expect(findKnownToken("usdc")).toBeDefined();
    expect(findKnownToken("UsDc")).toBeDefined();
  });

  it("returns undefined for unknown tokens", () => {
    expect(findKnownToken("BTC")).toBeUndefined();
    expect(findKnownToken("ETH")).toBeUndefined();
  });
});

describe("toToken", () => {
  it("returns known token metadata for XLM", () => {
    const token = toToken("XLM");
    expect(token.code).toBe("XLM");
    expect(token.name).toBe("Lumen");
    expect(token.isNative).toBe(true);
    expect(token.decimals).toBe(STELLAR_DECIMALS);
  });

  it("returns known token metadata for USDC", () => {
    const token = toToken("USDC");
    expect(token.code).toBe("USDC");
    expect(token.name).toBe("USD Coin");
    expect(token.issuer).toBeDefined();
  });

  it("creates fallback token for unknown codes", () => {
    const token = toToken("MARS");
    expect(token.code).toBe("MARS");
    expect(token.name).toBe("MARS");
    expect(token.decimals).toBe(STELLAR_DECIMALS);
  });

  it("attaches issuer when provided for unknown tokens", () => {
    const issuer = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
    const token = toToken("CUSTOM", issuer);
    expect(token.code).toBe("CUSTOM");
    expect(token.issuer).toBe(issuer);
  });

  it("uppercases code for consistency", () => {
    const token = toToken("xlm");
    expect(token.code).toBe("XLM");
  });
});

describe("KNOWN_TOKENS", () => {
  it("contains at least XLM and USDC", () => {
    expect(KNOWN_TOKENS.length).toBeGreaterThanOrEqual(2);
    const codes = KNOWN_TOKENS.map((t) => t.code);
    expect(codes).toContain("XLM");
    expect(codes).toContain("USDC");
  });

  it("XLM has native flag and Lumen name", () => {
    const xlm = KNOWN_TOKENS.find((t) => t.code === "XLM");
    expect(xlm).toBeDefined();
    expect(xlm!.isNative).toBe(true);
    expect(xlm!.name).toBe("Lumen");
  });
});
