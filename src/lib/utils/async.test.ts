import { describe, it, expect, vi } from "vitest";
import { sleep, sequential, withConcurrency, tryAsync } from "@/lib/utils/async";

describe("sleep", () => {
  it("resolves after the specified delay", async () => {
    vi.useFakeTimers();
    const promise = sleep(1000);
    let resolved = false;
    promise.then(() => { resolved = true; });

    expect(resolved).toBe(false);
    vi.advanceTimersByTime(999);
    await Promise.resolve();
    expect(resolved).toBe(false);
    vi.advanceTimersByTime(1);
    await promise;
    expect(resolved).toBe(true);
    vi.useRealTimers();
  });
});

describe("sequential", () => {
  it("executes functions in order", async () => {
    const order: number[] = [];
    const fns = [
      async () => { order.push(1); return "a"; },
      async () => { order.push(2); return "b"; },
      async () => { order.push(3); return "c"; },
    ];

    const results = await sequential(fns);
    expect(results).toEqual(["a", "b", "c"]);
    expect(order).toEqual([1, 2, 3]);
  });

  it("returns empty array for no functions", async () => {
    const results = await sequential([]);
    expect(results).toEqual([]);
  });

  it("propagates errors from a failing function", async () => {
    const fns = [
      async () => "ok",
      async () => { throw new Error("fail"); },
    ];
    await expect(sequential(fns)).rejects.toThrow("fail");
  });
});

describe("withConcurrency", () => {
  it("returns results for tasks within limit", async () => {
    const tasks = [1, 2].map((id) => async () => {
      return id * 10;
    });

    const results = await withConcurrency(tasks, 5);
    expect(results).toHaveLength(2);
    expect(results).toContain(10);
    expect(results).toContain(20);
  });

  it("handles empty tasks array", async () => {
    const results = await withConcurrency([], 2);
    expect(results).toEqual([]);
  });
});

describe("tryAsync", () => {
  it("returns [result, null] on success", async () => {
    const [result, error] = await tryAsync(() => Promise.resolve(42));
    expect(result).toBe(42);
    expect(error).toBeNull();
  });

  it("returns [null, error] on failure", async () => {
    const [result, error] = await tryAsync(() =>
      Promise.reject(new Error("boom"))
    );
    expect(result).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error!.message).toBe("boom");
  });

  it("wraps non-Error throwables", async () => {
    const [result, error] = await tryAsync(() =>
      Promise.reject("string error")
    );
    expect(result).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error!.message).toBe("string error");
  });
});
