import { describe, it, expect } from "vitest";

// ── trading-preferences pure functions ───────────────────────────────────
import {
  preferencesToScVal,
  preferencesFromScVal,
} from "@/lib/soroban/trading-preferences";
import type { OnChainPreferences } from "@/lib/soroban/trading-preferences";
import { xdr } from "@stellar/stellar-sdk";

describe("preferencesToScVal", () => {
  it("encodes preferences to ScVal map", () => {
    const prefs: OnChainPreferences = {
      max_slippage_bps: 250,
      routing_mode: "auto",
      allowed_assets: ["USDC"],
    };
    const scv = preferencesToScVal(prefs);
    expect(scv.switch().name).toBe("scvMap");
  });

  it("encodes empty allowed_assets", () => {
    const prefs: OnChainPreferences = {
      max_slippage_bps: 100,
      routing_mode: "direct",
      allowed_assets: [],
    };
    const scv = preferencesToScVal(prefs);
    expect(scv.switch().name).toBe("scvMap");
  });
});

describe("preferencesFromScVal", () => {
  it("decodes ScVal map to preferences", () => {
    const scv = xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("max_slippage_bps"),
        val: xdr.ScVal.scvU32(250),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("routing_mode"),
        val: xdr.ScVal.scvSymbol("auto"),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("allowed_assets"),
        val: xdr.ScVal.scvVec([]),
      }),
    ]);
    const prefs = preferencesFromScVal(scv);
    expect(prefs.max_slippage_bps).toBe(250);
    expect(prefs.routing_mode).toBe("auto");
    expect(prefs.allowed_assets).toEqual([]);
  });

  it("uses defaults for missing fields", () => {
    const scv = xdr.ScVal.scvMap([]);
    const prefs = preferencesFromScVal(scv);
    expect(prefs.max_slippage_bps).toBe(100);
    expect(prefs.routing_mode).toBe("auto");
    expect(prefs.allowed_assets).toEqual([]);
  });
});

// ── market-oracle pure functions ─────────────────────────────────────────
import { observationFromScVal } from "@/lib/soroban/market-oracle";

describe("observationFromScVal", () => {
  it("decodes observation ScVal", () => {
    const scv = xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("price"),
        val: xdr.ScVal.scvI128(
          new xdr.Int128Parts({ lo: xdr.Uint64.fromString("10000000"), hi: xdr.Int64.fromString("0") })
        ),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("ledger"),
        val: xdr.ScVal.scvU32(12345),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("publisher"),
        val: xdr.ScVal.scvSymbol("GSOURCE"),
      }),
    ]);
    const obs = observationFromScVal(scv);
    expect(obs.price).toBeGreaterThan(0);
    expect(obs.ledger).toBe(12345);
    expect(obs.publisher).toBe("GSOURCE");
  });
});
