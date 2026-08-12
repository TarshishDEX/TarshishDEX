import { describe, it, expect, vi } from "vitest";
import { sleep } from "@/lib/utils/sleep";

describe("sleep", () => {
  it("resolves after the specified delay", async () => {
    vi.useFakeTimers();
    const promise = sleep(1000);
    let resolved = false;
    promise.then(() => {
      resolved = true;
    });

    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1000);
    expect(resolved).toBe(true);
    vi.useRealTimers();
  });

  it("resolves with undefined", async () => {
    vi.useFakeTimers();
    const promise = sleep(500);
    vi.advanceTimersByTime(500);
    const result = await promise;
    expect(result).toBeUndefined();
    vi.useRealTimers();
  });

  it("handles zero delay", async () => {
    vi.useFakeTimers();
    const promise = sleep(0);
    vi.advanceTimersByTime(0);
    await promise;
    // Should resolve without error
    vi.useRealTimers();
  });

  it("does not resolve before delay", async () => {
    vi.useFakeTimers();
    const promise = sleep(2000);
    let resolved = false;
    promise.then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(1000);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1000);
    expect(resolved).toBe(true);
    vi.useRealTimers();
  });
});
