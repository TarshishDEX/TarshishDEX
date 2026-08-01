import { describe, expect, it } from "vitest";
import { nativeToScVal, xdr } from "@stellar/stellar-sdk";
import {
  preferencesFromScVal,
  preferencesToScVal,
  type OnChainPreferences,
} from "@/lib/soroban/trading-preferences";
import { observationFromScVal } from "@/lib/soroban/market-oracle";

describe("preferencesToScVal", () => {
  it("encodes preferences as an ScMap keyed by symbol", () => {
    const prefs: OnChainPreferences = {
      max_slippage_bps: 250,
      routing_mode: "auto",
      allowed_assets: ["USDC", "XLM"],
    };
    const scv = preferencesToScVal(prefs);

    expect(scv.switch()).toBe(xdr.ScValType.scvMap());
    const map = scv.map()!;
    expect(map.length).toBe(3);

    const byKey = new Map(map.map((entry) => [entry.key().sym()!.toString(), entry.val()]));
    expect(byKey.get("max_slippage_bps")!.u32()).toBe(250);
    expect(byKey.get("routing_mode")!.sym()!.toString()).toBe("auto");

    const assets = byKey.get("allowed_assets")!.vec()!;
    expect(assets.map((a) => a.sym()!.toString())).toEqual(["USDC", "XLM"]);
  });

  it("encodes an empty allow-list as an empty vector", () => {
    const scv = preferencesToScVal({
      max_slippage_bps: 100,
      routing_mode: "direct",
      allowed_assets: [],
    });
    const map = scv.map()!;
    const assets = map
      .find((e) => e.key().sym()!.toString() === "allowed_assets")!
      .val()
      .vec()!;
    expect(assets.length).toBe(0);
  });
});

describe("preferencesFromScVal", () => {
  it("decodes a struct ScMap back into typed preferences", () => {
    const scv = xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("max_slippage_bps"),
        val: xdr.ScVal.scvU32(500),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("routing_mode"),
        val: xdr.ScVal.scvSymbol("bridge"),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("allowed_assets"),
        val: xdr.ScVal.scvVec([xdr.ScVal.scvSymbol("ETH")]),
      }),
    ]);

    expect(preferencesFromScVal(scv)).toEqual({
      max_slippage_bps: 500,
      routing_mode: "bridge",
      allowed_assets: ["ETH"],
    });
  });

  it("falls back to defaults for missing fields", () => {
    const emptyMap = xdr.ScVal.scvMap([]);
    expect(preferencesFromScVal(emptyMap)).toEqual({
      max_slippage_bps: 100,
      routing_mode: "auto",
      allowed_assets: [],
    });
  });

  it("round-trips preferencesToScVal → preferencesFromScVal", () => {
    const prefs: OnChainPreferences = {
      max_slippage_bps: 1234,
      routing_mode: "auto",
      allowed_assets: ["USDC", "ETH", "XLM"],
    };
    expect(preferencesFromScVal(preferencesToScVal(prefs))).toEqual(prefs);
  });
});

describe("observationFromScVal", () => {
  it("decodes an Observation struct with a 7-decimal fixed-point price", () => {
    const publisher = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
    // Build the i128/address ScVals with nativeToScVal so the encodings match
    // what Soroban actually emits (hand-rolling xdr.Int128Parts / ScAddress is
    // error-prone and the Uint256.fromString API doesn't take strkeys).
    const scv = xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("price"),
        val: nativeToScVal(10000000n, { type: "i128" }),
      }),
      new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("ledger"), val: xdr.ScVal.scvU32(3918793) }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("publisher"),
        val: nativeToScVal(publisher, { type: "address" }),
      }),
    ]);

    const obs = observationFromScVal(scv);
    expect(obs.price).toBe(10000000);
    expect(obs.ledger).toBe(3918793);
    expect(obs.publisher).toBe(publisher);
  });
});
