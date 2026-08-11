import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  withCircuitBreaker,
  resetCircuitBreaker,
} from "@/lib/server/circuit-breaker";

beforeEach(() => {
  resetCircuitBreaker("test-cb");
  resetCircuitBreaker("test-fast");
});

describe("withCircuitBreaker", () => {
  it("executes the function on first call", async () => {
    const result = await withCircuitBreaker("test-cb", () => Promise.resolve(42));
    expect(result).toBe(42);
  });

  it("opens circuit after threshold failures", async () => {
    const fail = () => Promise.reject(new Error("boom"));

    for (let i = 0; i < 5; i++) {
      await expect(
        withCircuitBreaker("test-cb", fail, { threshold: 5 })
      ).rejects.toThrow("boom");
    }

    // Circuit should now be open
    await expect(
      withCircuitBreaker("test-cb", () => Promise.resolve(1), { threshold: 5 })
    ).rejects.toThrow("Circuit breaker");
  });

  it("resets failures on success", async () => {
    const fail = () => Promise.reject(new Error("boom"));

    // 4 failures — circuit stays closed
    for (let i = 0; i < 4; i++) {
      await expect(
        withCircuitBreaker("test-cb", fail, { threshold: 5 })
      ).rejects.toThrow("boom");
    }

    // Success resets failure count
    const result = await withCircuitBreaker("test-cb", () =>
      Promise.resolve(99)
    );
    expect(result).toBe(99);

    // Should still be closed — can execute again
    const result2 = await withCircuitBreaker("test-cb", () =>
      Promise.resolve(100)
    );
    expect(result2).toBe(100);
  });

  it("transitions to half-open after timeout", async () => {
    const fail = () => Promise.reject(new Error("boom"));

    // Trip the circuit with a very short timeout
    for (let i = 0; i < 5; i++) {
      await expect(
        withCircuitBreaker("test-fast", fail, {
          threshold: 5,
          timeoutMs: 1, // 1ms timeout
        })
      ).rejects.toThrow("boom");
    }

    // Wait for the timeout to expire
    await new Promise((r) => setTimeout(r, 10));

    // Should now be half-open and allow one attempt
    const result = await withCircuitBreaker("test-fast", () =>
      Promise.resolve(42),
      { timeoutMs: 1 }
    );
    expect(result).toBe(42);
  });

  it("isolates different circuit names", async () => {
    const fail = () => Promise.reject(new Error("boom"));

    // Trip circuit A
    for (let i = 0; i < 5; i++) {
      await expect(
        withCircuitBreaker("cb-a", fail, { threshold: 5 })
      ).rejects.toThrow("boom");
    }

    // Circuit B should still work
    const result = await withCircuitBreaker("cb-b", () => Promise.resolve(77));
    expect(result).toBe(77);
  });
});
