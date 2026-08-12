import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── env.ts ────────────────────────────────────────────────────────────

import { validateEnv, requireEnv, getEnv } from "@/lib/env";

describe("env", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "testnet");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("validateEnv", () => {
    it("returns valid when required vars are set", () => {
      const result = validateEnv();
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it("returns invalid when required var is missing", () => {
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "");
      const result = validateEnv();
      expect(result.valid).toBe(false);
      expect(result.missing).toContain("NEXT_PUBLIC_STELLAR_NETWORK");
    });

    it("validates contract ID format", () => {
      vi.stubEnv("NEXT_PUBLIC_TRADING_PREFERENCES_CONTRACT_ID", "not-a-contract-id");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      validateEnv();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid contract ID format"));
      consoleSpy.mockRestore();
    });

    it("validates fee collector address format", () => {
      vi.stubEnv("NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS", "invalid");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      validateEnv();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid fee collector address"));
      consoleSpy.mockRestore();
    });

    it("logs warnings for unset optional vars", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      validateEnv();
      // Some optional vars may be unset; warnings are expected
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe("requireEnv", () => {
    it("returns value when set", () => {
      const val = requireEnv("NEXT_PUBLIC_STELLAR_NETWORK");
      expect(val).toBe("testnet");
    });

    it("throws when missing", () => {
      expect(() => requireEnv("MISSING_VAR_XYZ")).toThrow();
    });
  });

  describe("getEnv", () => {
    it("returns value when set", () => {
      expect(getEnv("NEXT_PUBLIC_STELLAR_NETWORK", "fallback")).toBe("testnet");
    });

    it("returns fallback when unset", () => {
      expect(getEnv("UNSET_VAR", "default-value")).toBe("default-value");
    });
  });
});

// ── api/cors.ts ────────────────────────────────────────────────────────

import { getAllowedOrigin, OPTIONS, ALLOWED_ORIGINS } from "@/lib/api/cors";
import { NextRequest } from "next/server";

describe("cors", () => {
  it("ALLOWED_ORIGINS is an array", () => {
    expect(Array.isArray(ALLOWED_ORIGINS)).toBe(true);
    expect(ALLOWED_ORIGINS.length).toBeGreaterThan(0);
  });

  it("getAllowedOrigin returns matching origin", () => {
    const req = new NextRequest("http://localhost:3000/api/test", {
      headers: { origin: "http://localhost:3000" },
    });
    expect(getAllowedOrigin(req)).toBe("http://localhost:3000");
  });

  it("OPTIONS returns 204 with CORS headers", () => {
    const response = OPTIONS();
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

// ── sw-register.ts ────────────────────────────────────────────────────

import { registerSW } from "@/lib/sw-register";

describe("sw-register", () => {
  it("does not throw in non-browser environment", () => {
    // Should be a no-op when window is undefined
    expect(() => registerSW()).not.toThrow();
  });
});
