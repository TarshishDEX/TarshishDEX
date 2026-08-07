import { describe, it, expect } from "vitest";
import { tryCatch, tryCatchSync } from "./try-catch";

describe("tryCatch", () => {
  it("returns [data, null] on success", async () => {
    const [data, error] = await tryCatch(Promise.resolve(42));
    expect(data).toBe(42);
    expect(error).toBeNull();
  });

  it("returns [null, error] on failure", async () => {
    const [data, error] = await tryCatch(Promise.reject(new Error("boom")));
    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe("boom");
  });

  it("handles non-Error thrown values", async () => {
    const [data, error] = await tryCatch(Promise.reject("string error"));
    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
  });
});

describe("tryCatchSync", () => {
  it("returns [data, null] on success", () => {
    const [data, error] = tryCatchSync(() => 42);
    expect(data).toBe(42);
    expect(error).toBeNull();
  });

  it("returns [null, error] on failure", () => {
    const [data, error] = tryCatchSync(() => {
      throw new Error("boom");
    });
    expect(data).toBeNull();
    expect(error).toBeInstanceOf(Error);
  });
});
