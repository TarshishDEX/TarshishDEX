import { describe, it, expect, vi, afterEach } from "vitest";
import { getActiveNetwork, explorerTxUrl, explorerAccountUrl, NETWORKS } from "./config";

describe("getActiveNetwork", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns testnet config by default", () => {
    const network = getActiveNetwork();
    expect(network).toBeDefined();
    expect(network.label).toBeDefined();
    expect(network.passphrase).toBeDefined();
    expect(network.rpcUrl).toBeDefined();
    expect(network.horizonUrl).toBeDefined();
  });

  it("returns public network when env override is set", () => {
    vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "public");
    const network = getActiveNetwork();
    expect(network.name).toBe("public");
    expect(network.passphrase).toBe(NETWORKS.public.passphrase);
  });

  it("returns consistent results on repeated calls", () => {
    const a = getActiveNetwork();
    const b = getActiveNetwork();
    expect(a.passphrase).toBe(b.passphrase);
    expect(a.horizonUrl).toBe(b.horizonUrl);
  });
});

describe("explorerTxUrl", () => {
  it("builds a testnet explorer URL for a transaction", () => {
    const url = explorerTxUrl("abc123");
    expect(url).toContain("testnet");
    expect(url).toContain("/tx/abc123");
  });
});

describe("explorerAccountUrl", () => {
  it("builds a testnet explorer URL for an account", () => {
    const url = explorerAccountUrl("GABC");
    expect(url).toContain("testnet");
    expect(url).toContain("/account/GABC");
  });
});
