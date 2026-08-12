import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("instrumentation (register)", () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("skips validation when not in nodejs runtime", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");
    // Should not throw or log
    const mod = await import("@/instrumentation");
    await mod.register();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("validates environment when NEXT_RUNTIME is nodejs (valid env)", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");

    vi.doMock("@/lib/env", () => ({
      validateEnv: vi.fn(() => ({ valid: true, missing: [] })),
    }));

    const mod = await import("@/instrumentation");
    await mod.register();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("logs error when environment is misconfigured", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");

    vi.doMock("@/lib/env", () => ({
      validateEnv: vi.fn(() => ({
        valid: false,
        missing: ["NEXT_PUBLIC_STELLAR_NETWORK", "STELLAR_SOURCE_ACCOUNT"],
      })),
    }));

    const mod = await import("@/instrumentation");
    await mod.register();

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("FATAL: Missing required environment variables")
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_STELLAR_NETWORK")
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("STELLAR_SOURCE_ACCOUNT")
    );
  });

  it("handles single missing env var", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");

    vi.doMock("@/lib/env", () => ({
      validateEnv: vi.fn(() => ({
        valid: false,
        missing: ["STELLAR_SOURCE_ACCOUNT"],
      })),
    }));

    const mod = await import("@/instrumentation");
    await mod.register();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("STELLAR_SOURCE_ACCOUNT")
    );
  });
});
