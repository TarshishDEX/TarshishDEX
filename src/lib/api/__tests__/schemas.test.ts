import { describe, it, expect } from "vitest";
import {
  assetSchema,
  amountSchema,
  slippageSchema,
  limitSchema,
  addressSchema,
  swapQuoteParamsSchema,
  marketStatsParamsSchema,
  candlesParamsSchema,
  orderbookParamsSchema,
  assetsParamsSchema,
  eventsParamsSchema,
} from "../schemas";

// ─── assetSchema ───────────────────────────────────────────────────────

describe("assetSchema", () => {
  it("parses 'XLM' as native", () => {
    const result = assetSchema.parse("XLM");
    expect(result).toEqual({ code: "XLM", isNative: true });
  });

  it("parses 'native' as native (case-insensitive)", () => {
    const result = assetSchema.parse("native");
    expect(result).toEqual({ code: "XLM", isNative: true });
  });

  it("parses a valid CODE:ISSUER pair", () => {
    const result = assetSchema.parse(
      "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    expect(result).toEqual({
      code: "USDC",
      issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    });
  });

  it("uppercases the asset code", () => {
    const result = assetSchema.parse(
      "usdc:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    expect(result.code).toBe("USDC");
  });

  it("rejects empty string", () => {
    expect(() => assetSchema.parse("")).toThrow();
  });

  it("rejects single token (no colon)", () => {
    expect(() => assetSchema.parse("USDC")).toThrow();
  });

  it("rejects invalid issuer format", () => {
    expect(() => assetSchema.parse("USDC:invalid")).toThrow();
  });

  it("rejects asset codes longer than 12 chars", () => {
    expect(() =>
      assetSchema.parse("TOOLONGASSETX:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN")
    ).toThrow();
  });

  it("rejects asset codes with special characters", () => {
    expect(() =>
      assetSchema.parse("US@C:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN")
    ).toThrow();
  });
});

// ─── amountSchema ──────────────────────────────────────────────────────

describe("amountSchema", () => {
  it("parses a valid positive amount", () => {
    expect(amountSchema.parse("100.5")).toBe("100.5");
  });

  it("rejects empty string", () => {
    expect(() => amountSchema.parse("")).toThrow();
  });

  it("rejects NaN", () => {
    expect(() => amountSchema.parse("abc")).toThrow();
  });

  it("rejects zero", () => {
    expect(() => amountSchema.parse("0")).toThrow();
  });

  it("rejects negative numbers", () => {
    expect(() => amountSchema.parse("-5")).toThrow();
  });

  it("trims whitespace", () => {
    expect(amountSchema.parse("  42  ")).toBe("42");
  });
});

// ─── slippageSchema ────────────────────────────────────────────────────

describe("slippageSchema", () => {
  it("parses a valid slippage", () => {
    expect(slippageSchema.parse(1)).toBe(1);
  });

  it("defaults to 1", () => {
    expect(slippageSchema.parse(undefined)).toBe(1);
  });

  it("rejects negative slippage", () => {
    expect(() => slippageSchema.parse(-1)).toThrow();
  });

  it("rejects slippage > 50", () => {
    expect(() => slippageSchema.parse(51)).toThrow();
  });

  it("accepts slippage at max (50)", () => {
    expect(slippageSchema.parse(50)).toBe(50);
  });

  it("accepts 0", () => {
    expect(slippageSchema.parse(0)).toBe(0);
  });
});

// ─── limitSchema ────────────────────────────────────────────────────────

describe("limitSchema", () => {
  it("parses a valid limit", () => {
    expect(limitSchema.parse(10)).toBe(10);
  });

  it("defaults to 20", () => {
    expect(limitSchema.parse(undefined)).toBe(20);
  });

  it("rejects limit of 0", () => {
    expect(() => limitSchema.parse(0)).toThrow();
  });

  it("rejects limit > 200", () => {
    expect(() => limitSchema.parse(201)).toThrow();
  });

  it("accepts max limit", () => {
    expect(limitSchema.parse(200)).toBe(200);
  });

  it("rejects non-integer limits", () => {
    expect(() => limitSchema.parse(10.5)).toThrow();
  });
});

// ─── addressSchema ─────────────────────────────────────────────────────

describe("addressSchema", () => {
  it("accepts a valid Stellar address", () => {
    expect(addressSchema.parse("GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN")).toBe(
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
  });

  it("rejects an address not starting with G", () => {
    expect(() =>
      addressSchema.parse("MA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZV2")
    ).toThrow();
  });

  it("rejects wrong-length strings", () => {
    expect(() => addressSchema.parse("GABC")).toThrow();
  });
});

// ─── compound schemas ──────────────────────────────────────────────────

describe("swapQuoteParamsSchema", () => {
  it("parses valid swap params", () => {
    const result = swapQuoteParamsSchema.parse({
      input: "XLM",
      output: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      amount: "100",
      slippage: 1,
    });
    expect(result.amount).toBe("100");
    expect(result.slippage).toBe(1);
  });

  it("rejects missing fields", () => {
    expect(() => swapQuoteParamsSchema.parse({})).toThrow();
  });
});

describe("marketStatsParamsSchema", () => {
  it("parses with default limit", () => {
    const result = marketStatsParamsSchema.parse({});
    expect(result.limit).toBe(20);
  });

  it("accepts custom limit", () => {
    const result = marketStatsParamsSchema.parse({ limit: 50 });
    expect(result.limit).toBe(50);
  });
});

describe("candlesParamsSchema", () => {
  it("parses valid candle params with defaults", () => {
    const result = candlesParamsSchema.parse({
      base: "XLM",
      counter: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    });
    expect(result.resolution).toBe(3_600_000);
    expect(result.range).toBe(86_400_000);
  });
});

describe("orderbookParamsSchema", () => {
  it("parses valid orderbook params", () => {
    const result = orderbookParamsSchema.parse({
      selling: "XLM",
      buying: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    });
    expect(result.limit).toBe(20);
  });
});

describe("assetsParamsSchema", () => {
  it("parses with defaults", () => {
    const result = assetsParamsSchema.parse({});
    expect(result.limit).toBe(20);
  });

  it("accepts optional code and issuer", () => {
    const result = assetsParamsSchema.parse({
      code: "USDC",
      issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    });
    expect(result.code).toBe("USDC");
    expect(result.issuer).toBe("GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN");
  });
});

describe("eventsParamsSchema", () => {
  it("requires counter asset", () => {
    const result = eventsParamsSchema.parse({
      counter: "XLM",
    });
    expect(result.counter.code).toBe("XLM");
  });

  it("accepts optional base", () => {
    const result = eventsParamsSchema.parse({
      base: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      counter: "XLM",
    });
    expect(result.base?.code).toBe("USDC");
  });
});
