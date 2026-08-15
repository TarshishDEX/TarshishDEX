import { describe, it, expect } from "vitest";
import {
  isValidUrl,
  isValidEmail,
  isValidHexColor,
  isValidDomain,
  isValidPercentage,
  isPositiveInteger,
} from "@/lib/utils/validators";

describe("isValidUrl", () => {
  it("accepts http and https URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://localhost:3000")).toBe(true);
    expect(
      isValidUrl(
        "https://stellar.expert/explorer/testnet/asset/USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
      )
    ).toBe(true);
  });

  it("rejects unsupported protocols", () => {
    expect(isValidUrl("ftp://example.com")).toBe(false);
    expect(isValidUrl("mailto:user@example.com")).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
    expect(isValidUrl("example.com")).toBe(false);
    expect(isValidUrl("https://")).toBe(false);
    expect(isValidUrl("")).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("accepts standard email addresses", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user.name+tag@example.co.uk")).toBe(true);
    expect(isValidEmail("USER@Example.COM")).toBe(true);
  });

  it("ignores surrounding whitespace", () => {
    expect(isValidEmail(" user@example.com ")).toBe(true);
  });

  it("rejects addresses without a local part", () => {
    expect(isValidEmail("@example.com")).toBe(false);
  });

  it("rejects addresses without a domain", () => {
    expect(isValidEmail("user@example")).toBe(false);
  });

  it("rejects addresses without an @ separator", () => {
    expect(isValidEmail("user.example.com")).toBe(false);
  });

  it("rejects addresses with spaces or multiple @", () => {
    expect(isValidEmail("user@exa mple.com")).toBe(false);
    expect(isValidEmail("user@@example.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("isValidHexColor", () => {
  it("accepts 3-digit hex colors", () => {
    expect(isValidHexColor("#fff")).toBe(true);
    expect(isValidHexColor("#A3F")).toBe(true);
  });

  it("accepts 6-digit hex colors in any case", () => {
    expect(isValidHexColor("#ffffff")).toBe(true);
    expect(isValidHexColor("#aBcDeF")).toBe(true);
  });

  it("rejects colors without a # prefix", () => {
    expect(isValidHexColor("fff")).toBe(false);
  });

  it("rejects wrong-length hex colors", () => {
    expect(isValidHexColor("#ff")).toBe(false);
    expect(isValidHexColor("#ffff")).toBe(false);
    expect(isValidHexColor("#fffffff")).toBe(false);
    expect(isValidHexColor("#")).toBe(false);
    expect(isValidHexColor("")).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(isValidHexColor("#gggggg")).toBe(false);
  });
});

describe("isValidDomain", () => {
  it("accepts standard domains", () => {
    expect(isValidDomain("example.com")).toBe(true);
    expect(isValidDomain("sub.example.co.uk")).toBe(true);
    expect(isValidDomain("a-b.example.io")).toBe(true);
    expect(isValidDomain("123.example.com")).toBe(true);
  });

  it("rejects bare labels without a TLD", () => {
    expect(isValidDomain("example")).toBe(false);
  });

  it("rejects domains with leading or trailing hyphens", () => {
    expect(isValidDomain("-example.com")).toBe(false);
    expect(isValidDomain("example-.com")).toBe(false);
  });

  it("rejects domains with spaces or empty labels", () => {
    expect(isValidDomain("exa mple.com")).toBe(false);
    expect(isValidDomain("example..com")).toBe(false);
    expect(isValidDomain(".com")).toBe(false);
    expect(isValidDomain("")).toBe(false);
  });

  it("rejects trailing dots", () => {
    expect(isValidDomain("example.com.")).toBe(false);
  });
});

describe("isValidPercentage", () => {
  it("accepts values from 0 to 100 inclusive", () => {
    expect(isValidPercentage(0)).toBe(true);
    expect(isValidPercentage(0.5)).toBe(true);
    expect(isValidPercentage(50)).toBe(true);
    expect(isValidPercentage(100)).toBe(true);
  });

  it("rejects negative values", () => {
    expect(isValidPercentage(-1)).toBe(false);
  });

  it("rejects values above 100", () => {
    expect(isValidPercentage(100.01)).toBe(false);
  });

  it("rejects non-finite values", () => {
    expect(isValidPercentage(NaN)).toBe(false);
    expect(isValidPercentage(Infinity)).toBe(false);
  });
});

describe("isPositiveInteger", () => {
  it("accepts positive integers", () => {
    expect(isPositiveInteger(1)).toBe(true);
    expect(isPositiveInteger(42)).toBe(true);
    expect(isPositiveInteger(1000)).toBe(true);
  });

  it("rejects zero and negatives", () => {
    expect(isPositiveInteger(0)).toBe(false);
    expect(isPositiveInteger(-1)).toBe(false);
  });

  it("rejects non-integers", () => {
    expect(isPositiveInteger(1.5)).toBe(false);
  });

  it("rejects non-finite numbers", () => {
    expect(isPositiveInteger(NaN)).toBe(false);
    expect(isPositiveInteger(Infinity)).toBe(false);
  });

  it("rejects non-number values", () => {
    expect(isPositiveInteger("5")).toBe(false);
    expect(isPositiveInteger(null)).toBe(false);
    expect(isPositiveInteger(undefined)).toBe(false);
  });
});
