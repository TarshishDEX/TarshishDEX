import { describe, it, expect } from "vitest";
import {
  assetParamSchema,
  amountParamSchema,
  slippageParamSchema,
  addressParamSchema,
  limitParamSchema,
  resolutionParamSchema,
  rangeParamSchema,
} from "@/lib/api/validators";

describe("assetParamSchema", () => {
  it("accepts XLM", () => {
    expect(assetParamSchema.parse("XLM")).toBe("XLM");
    expect(assetParamSchema.parse("native")).toBe("native");
  });

  it("accepts CODE:ISSUER", () => {
    const key = "G".repeat(56);
    expect(assetParamSchema.parse(`USDC:${key}`)).toBe(`USDC:${key}`);
  });

  it("rejects invalid format", () => {
    expect(() => assetParamSchema.parse("INVALID")).toThrow();
    expect(() => assetParamSchema.parse("A:B:C")).toThrow();
    expect(() => assetParamSchema.parse("")).toThrow();
  });

  it("rejects short issuer", () => {
    expect(() => assetParamSchema.parse("USDC:GABC")).toThrow();
  });
});

describe("amountParamSchema", () => {
  it("accepts positive numbers", () => {
    expect(amountParamSchema.parse("100")).toBe("100");
    expect(amountParamSchema.parse("0.001")).toBe("0.001");
  });

  it("rejects zero", () => {
    expect(() => amountParamSchema.parse("0")).toThrow();
  });

  it("rejects negative", () => {
    expect(() => amountParamSchema.parse("-1")).toThrow();
  });

  it("rejects non-numeric", () => {
    expect(() => amountParamSchema.parse("abc")).toThrow();
  });
});

describe("slippageParamSchema", () => {
  it("defaults to 1", () => {
    expect(slippageParamSchema.parse(undefined)).toBe(1);
  });

  it("accepts valid range", () => {
    expect(slippageParamSchema.parse("0.5")).toBe(0.5);
    expect(slippageParamSchema.parse("50")).toBe(50);
  });

  it("rejects negative", () => {
    expect(() => slippageParamSchema.parse("-1")).toThrow();
  });

  it("rejects >100", () => {
    expect(() => slippageParamSchema.parse("101")).toThrow();
  });
});

describe("addressParamSchema", () => {
  it("accepts valid 56-char key", () => {
    const key = "G" + "A".repeat(55);
    expect(addressParamSchema.parse(key)).toBe(key);
  });

  it("rejects wrong length", () => {
    expect(() => addressParamSchema.parse("GABC")).toThrow();
  });

  it("rejects non-G prefix", () => {
    const key = "S" + "A".repeat(55);
    expect(() => addressParamSchema.parse(key)).toThrow();
  });
});

describe("limitParamSchema", () => {
  it("defaults to 20", () => {
    expect(limitParamSchema.parse(undefined)).toBe(20);
  });

  it("accepts valid range", () => {
    expect(limitParamSchema.parse("1")).toBe(1);
    expect(limitParamSchema.parse("200")).toBe(200);
  });

  it("rejects 0", () => {
    expect(() => limitParamSchema.parse("0")).toThrow();
  });
});

describe("resolutionParamSchema", () => {
  it("accepts valid resolutions", () => {
    expect(resolutionParamSchema.parse("60000")).toBe("60000");
    expect(resolutionParamSchema.parse("3600000")).toBe("3600000");
    expect(resolutionParamSchema.parse("86400000")).toBe("86400000");
  });

  it("rejects invalid", () => {
    expect(() => resolutionParamSchema.parse("12345")).toThrow();
  });
});

describe("rangeParamSchema", () => {
  it("defaults to 86400000", () => {
    expect(rangeParamSchema.parse(undefined)).toBe(86400000);
  });

  it("accepts custom range", () => {
    expect(rangeParamSchema.parse("3600000")).toBe(3600000);
  });

  it("rejects negative", () => {
    expect(() => rangeParamSchema.parse("-1")).toThrow();
  });
});
