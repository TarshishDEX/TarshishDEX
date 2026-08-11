import { describe, it, expect } from "vitest";
import {
  assetSchema,
  amountSchema,
  slippageSchema,
  limitSchema,
  addressSchema,
  swapQuoteParamsSchema,
  candlesParamsSchema,
} from "@/lib/api/schemas";

describe("assetSchema", () => {
  it("parses native XLM", () => {
    expect(assetSchema.parse("XLM")).toEqual({ code: "XLM", isNative: true });
    expect(assetSchema.parse("xlm")).toEqual({ code: "XLM", isNative: true });
    expect(assetSchema.parse("NATIVE")).toEqual({ code: "XLM", isNative: true });
  });

  it("parses CODE:ISSUER format", () => {
    const result = assetSchema.parse(
      "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );
    expect(result).toEqual({
      code: "USDC",
      issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    });
    expect(result.isNative).toBeUndefined();
  });

  it("rejects empty string", () => {
    expect(() => assetSchema.parse("")).toThrow();
  });

  it("rejects missing issuer", () => {
    expect(() => assetSchema.parse("USDC")).toThrow("CODE:ISSUER");
  });

  it("rejects invalid issuer (wrong length)", () => {
    expect(() => assetSchema.parse("USDC:GABC")).toThrow("Stellar public key");
  });
});

describe("amountSchema", () => {
  it("accepts positive decimals", () => {
    expect(amountSchema.parse("100.5")).toBe("100.5");
    expect(amountSchema.parse("0.001")).toBe("0.001");
  });

  it("rejects zero", () => {
    expect(() => amountSchema.parse("0")).toThrow("positive");
  });

  it("rejects negative", () => {
    expect(() => amountSchema.parse("-5")).toThrow("positive");
  });

  it("rejects non-numeric", () => {
    expect(() => amountSchema.parse("abc")).toThrow();
  });
});

describe("slippageSchema", () => {
  it("accepts valid range", () => {
    expect(slippageSchema.parse(1)).toBe(1);
    expect(slippageSchema.parse(0)).toBe(0);
    expect(slippageSchema.parse(50)).toBe(50);
  });

  it("defaults to 1", () => {
    expect(slippageSchema.parse(undefined)).toBe(1);
  });

  it("rejects >50", () => {
    expect(() => slippageSchema.parse(51)).toThrow();
  });

  it("rejects <0", () => {
    expect(() => slippageSchema.parse(-1)).toThrow();
  });
});

describe("limitSchema", () => {
  it("accepts valid range", () => {
    expect(limitSchema.parse(1)).toBe(1);
    expect(limitSchema.parse(200)).toBe(200);
  });

  it("defaults to 20", () => {
    expect(limitSchema.parse(undefined)).toBe(20);
  });

  it("rejects 0", () => {
    expect(() => limitSchema.parse(0)).toThrow();
  });
});

describe("addressSchema", () => {
  it("accepts valid Stellar key", () => {
    expect(
      addressSchema.parse("GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H")
    ).toBe("GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H");
  });

  it("rejects keys not starting with G", () => {
    expect(() =>
      addressSchema.parse("SBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H")
    ).toThrow();
  });

  it("rejects wrong length", () => {
    expect(() => addressSchema.parse("GABC")).toThrow();
  });
});

describe("swapQuoteParamsSchema", () => {
  it("validates full swap params", () => {
    const result = swapQuoteParamsSchema.parse({
      input: "XLM",
      output: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      amount: "100",
      slippage: 1,
    });
    expect(result.amount).toBe("100");
    expect(result.slippage).toBe(1);
    expect(result.input.code).toBe("XLM");
    expect(result.output.code).toBe("USDC");
  });
});

describe("candlesParamsSchema", () => {
  it("validates candles params with defaults", () => {
    const result = candlesParamsSchema.parse({
      base: "XLM",
      counter: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    });
    expect(result.resolution).toBe(3_600_000);
    expect(result.range).toBe(86_400_000);
  });
});
