import { describe, it, expect } from "vitest";
import { isValidPublicKey } from "@/lib/stellar/account";

describe("isValidPublicKey", () => {
  it("accepts valid Stellar public keys", () => {
    expect(
      isValidPublicKey(
        "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
      )
    ).toBe(true);
    expect(
      isValidPublicKey(
        "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
      )
    ).toBe(true);
  });

  it("rejects strings that are too short", () => {
    expect(isValidPublicKey("GA5Z")).toBe(false);
    expect(isValidPublicKey("G")).toBe(false);
  });

  it("rejects strings that are too long", () => {
    expect(isValidPublicKey("G" + "A".repeat(56))).toBe(false);
  });

  it("rejects strings not starting with G", () => {
    expect(isValidPublicKey("S" + "A".repeat(55))).toBe(false);
    expect(isValidPublicKey("CA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN")).toBe(
      false
    );
  });

  it("rejects empty strings", () => {
    expect(isValidPublicKey("")).toBe(false);
  });

  it("trims whitespace before validation", () => {
    expect(
      isValidPublicKey(
        "  GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN  "
      )
    ).toBe(true);
  });

  it("rejects invalid base32 characters (0, 1, 8, 9)", () => {
    // A key containing '0' is not valid base32
    expect(isValidPublicKey("G" + "0".repeat(55))).toBe(false);
    expect(isValidPublicKey("G" + "1".repeat(55))).toBe(false);
  });
});
