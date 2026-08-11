import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to test getHorizonUrl and getHorizonServer — re-import after env setup
const horizonModule = await import("@/lib/stellar/horizon");

describe("getHorizonUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the network default when no override is set", () => {
    vi.stubEnv("HORIZON_URL", undefined);
    const url = horizonModule.getHorizonUrl();
    expect(url).toBeTruthy();
    expect(url).toContain("https://");
  });

  it("uses HORIZON_URL override when set", () => {
    vi.stubEnv("HORIZON_URL", "https://custom-horizon.example.com");
    const url = horizonModule.getHorizonUrl();
    expect(url).toBe("https://custom-horizon.example.com");
  });

  it("strips trailing slashes from override", () => {
    vi.stubEnv("HORIZON_URL", "https://custom-horizon.example.com///");
    const url = horizonModule.getHorizonUrl();
    expect(url).toBe("https://custom-horizon.example.com");
  });

  it("rejects non-http override and falls back to default", () => {
    vi.stubEnv("HORIZON_URL", "not-a-url");
    const url = horizonModule.getHorizonUrl();
    expect(url).toContain("https://");
    expect(url).not.toBe("not-a-url");
  });

  it("handles blank override gracefully", () => {
    vi.stubEnv("HORIZON_URL", "   ");
    const url = horizonModule.getHorizonUrl();
    expect(url).toContain("https://");
  });
});

describe("getHorizonServer", () => {
  it("returns a server instance", () => {
    const server = horizonModule.getHorizonServer();
    expect(server).toBeDefined();
    expect(typeof server).toBe("object");
  });

  it("returns the same instance on repeated calls (singleton)", () => {
    const a = horizonModule.getHorizonServer();
    const b = horizonModule.getHorizonServer();
    expect(a).toBe(b);
  });
});
