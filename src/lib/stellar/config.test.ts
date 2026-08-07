import { describe, it, expect } from "vitest";
import { getActiveNetwork } from "./config";

describe("getActiveNetwork", () => {
  it("returns testnet config by default", () => {
    const network = getActiveNetwork();
    expect(network).toBeDefined();
    expect(network.label).toBeDefined();
    expect(network.passphrase).toBeDefined();
    expect(network.rpcUrl).toBeDefined();
    expect(network.horizonUrl).toBeDefined();
  });

  it("returns consistent results on repeated calls", () => {
    const a = getActiveNetwork();
    const b = getActiveNetwork();
    expect(a.passphrase).toBe(b.passphrase);
    expect(a.horizonUrl).toBe(b.horizonUrl);
  });
});
