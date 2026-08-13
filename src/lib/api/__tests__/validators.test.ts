import { describe, it, expect } from "vitest";
import {
  assetParamSchema,
  amountParamSchema,
  slippageParamSchema,
  addressParamSchema,
  limitParamSchema,
  resolutionParamSchema,
  rangeParamSchema,
} from "../validators";

// ─── assetParamSchema ──────────────────────────────────────────────────

describe("assetParamSchema", () => {
  it("accepts 'XLM'", () => {
    expect(assetParamSchema.parse("XLM")).toBe("XLM");
  });

  it("accepts 'native'", () => {
    expect(assetParamSchema.parse("native")).toBe("native");
  });

  it("accepts CODE:ISSUER format", () => {
    expect(
      assetParamSchema.parse("USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN")
    ).toBe("USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN");
  });

  it("rejects empty string", () => {
    expect(() => assetParamSchema.parse("")).toThrow();
  });

  it("rejects strings > 80 chars", () => {
    expect(() => assetParamSchema.parse("A".repeat(81))).toThrow();
  });

  it("rejects single token without colon", () => {
    expect(() => assetParamSchema.parse("USDC")).toThrow();
  });

  it("rejects issuer not starting with G", () => {
    expect(() =>
      assetParamSchema.parse("USDC:MA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZV2")
    ).toThrow();
  });

  it("rejects 12+ char codes", () => {
    expect(() =>
      assetParamSchema.parse(
        "TOOLONGASSETX:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
      )
    ).toThrow();
  });
});

// ─── amountParamSchema ─────────────────────────────────────────────────

describe("amountParamSchema", () => {
  it("accepts a positive number string", () => {
    expect(amountParamSchema.parse("100")).toBe("100");
  });

  it("accepts decimal numbers", () => {
    expect(amountParamSchema.parse("0.001")).toBe("0.001");
  });

  it("rejects empty string", () => {
    expect(() => amountParamSchema.parse("")).toThrow();
  });

  it("rejects non-numeric strings", () => {
    expect(() => amountParamSchema.parse("abc")).toThrow();
  });

  it("rejects zero", () => {
    expect(() => amountParamSchema.parse("0")).toThrow();
  });

  it("rejects negative numbers", () => {
    expect(() => amountParamSchema.parse("-1")).toThrow();
  });

  it("rejects Infinity", () => {
    expect(() => amountParamSchema.parse("Infinity")).toThrow();
  });
});

// ─── slippageParamSchema ───────────────────────────────────────────────

describe("slippageParamSchema", () => {
  it("defaults to 1 when not provided", () => {
    expect(slippageParamSchema.parse(undefined)).toBe(1);
  });

  it("parses a valid slippage string", () => {
    expect(slippageParamSchema.parse("5")).toBe(5);
  });

  it("rejects negative slippage", () => {
    expect(() => slippageParamSchema.parse("-1")).toThrow();
  });

  it("rejects 0 (below min)", () => {
    expect(() => slippageParamSchema.parse("0")).toThrow();
  });

  it("rejects slippage > 100", () => {
    expect(() => slippageParamSchema.parse("101")).toThrow();
  });

  it("accepts max slippage (100)", () => {
    expect(slippageParamSchema.parse("100")).toBe(100);
  });

  it("returns 1 for invalid numeric strings", () => {
    expect(slippageParamSchema.parse("abc")).toBe(1);
  });
});

// ─── addressParamSchema ────────────────────────────────────────────────

describe("addressParamSchema", () => {
  it("accepts a valid 56-char Stellar address", () => {
    expect(
      addressParamSchema.parse("GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN")
    ).toBe("GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN");
  });

  it("rejects an address that does not start with G", () => {
    expect(() =>
      addressParamSchema.parse("MA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZV2")
    ).toThrow();
  });

  it("rejects wrong length strings", () => {
    expect(() => addressParamSchema.parse("GABC")).toThrow();
  });
});

// ─── limitParamSchema ──────────────────────────────────────────────────

describe("limitParamSchema", () => {
  it("defaults to 20 when not provided", () => {
    expect(limitParamSchema.parse(undefined)).toBe(20);
  });

  it("parses a valid limit", () => {
    expect(limitParamSchema.parse("50")).toBe(50);
  });

  it("rejects limit 0", () => {
    expect(() => limitParamSchema.parse("0")).toThrow();
  });

  it("rejects limit > 200", () => {
    expect(() => limitParamSchema.parse("201")).toThrow();
  });

  it("returns 20 for invalid strings", () => {
    expect(limitParamSchema.parse("abc")).toBe(20);
  });

  it("accepts limit at max", () => {
    expect(limitParamSchema.parse("200")).toBe(200);
  });
});

// ─── resolutionParamSchema ─────────────────────────────────────────────

describe("resolutionParamSchema", () => {
  it("accepts valid resolutions", () => {
    expect(resolutionParamSchema.parse("60000")).toBe("60000");
    expect(resolutionParamSchema.parse("300000")).toBe("300000");
    expect(resolutionParamSchema.parse("900000")).toBe("900000");
    expect(resolutionParamSchema.parse("3600000")).toBe("3600000");
    expect(resolutionParamSchema.parse("14400000")).toBe("14400000");
    expect(resolutionParamSchema.parse("86400000")).toBe("86400000");
  });

  it("rejects invalid resolutions", () => {
    expect(() => resolutionParamSchema.parse("2000")).toThrow();
    expect(() => resolutionParamSchema.parse("1h")).toThrow();
  });
});

// ─── rangeParamSchema ──────────────────────────────────────────────────

describe("rangeParamSchema", () => {
  it("defaults to 86400000 (1 day) when not provided", () => {
    expect(rangeParamSchema.parse(undefined)).toBe(86400000);
  });

  it("parses a valid range", () => {
    expect(rangeParamSchema.parse("3600000")).toBe(3600000);
  });

  it("rejects negative ranges", () => {
    expect(() => rangeParamSchema.parse("-1000")).toThrow();
  });

  it("returns default for invalid strings", () => {
    expect(rangeParamSchema.parse("abc")).toBe(86400000);
  });
});
