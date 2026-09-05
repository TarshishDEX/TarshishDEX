import { describe, it, expect, vi, afterEach } from "vitest";
import {
  DEFAULT_RATE_LIMIT_RETRY_AFTER_SECONDS,
  HorizonRateLimitError,
  getHorizonErrorStatus,
  getHorizonRetryAfterSeconds,
  isHorizonRateLimitError,
  isTransientHorizonError,
  withHorizonResilience,
} from "@/lib/stellar/horizon-guard";
import { resetCircuitBreaker } from "@/lib/server/circuit-breaker";

/** Build an error shaped like the Stellar SDK's Horizon.NetworkError. */
function horizonError(
  status: number,
  retryAfter?: string
): Error & {
  response: { status: number; headers: Record<string, string> };
} {
  const error = new Error(`Horizon HTTP ${status}`) as Error & {
    response: { status: number; headers: Record<string, string> };
  };
  error.response = {
    status,
    headers: retryAfter ? { "retry-after": retryAfter } : {},
  };
  return error;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  resetCircuitBreaker("horizon:test");
});

describe("getHorizonErrorStatus", () => {
  it("extracts the HTTP status from a response-shaped error", () => {
    expect(getHorizonErrorStatus(horizonError(429))).toBe(429);
    expect(getHorizonErrorStatus(horizonError(503))).toBe(503);
  });

  it("returns null for errors without a response", () => {
    expect(getHorizonErrorStatus(new Error("network down"))).toBeNull();
    expect(getHorizonErrorStatus("plain string")).toBeNull();
    expect(getHorizonErrorStatus(null)).toBeNull();
  });
});

describe("isHorizonRateLimitError", () => {
  it("returns true for HTTP 429", () => {
    expect(isHorizonRateLimitError(horizonError(429))).toBe(true);
  });

  it("returns false for other statuses and non-response errors", () => {
    expect(isHorizonRateLimitError(horizonError(502))).toBe(false);
    expect(isHorizonRateLimitError(horizonError(400))).toBe(false);
    expect(isHorizonRateLimitError(new Error("boom"))).toBe(false);
  });
});

describe("getHorizonRetryAfterSeconds", () => {
  it("reads a numeric retry-after header", () => {
    expect(getHorizonRetryAfterSeconds(horizonError(429, "12"))).toBe(12);
  });

  it("rounds fractional retry-after values up", () => {
    expect(getHorizonRetryAfterSeconds(horizonError(429, "2.5"))).toBe(3);
  });

  it("falls back to the default when the header is missing", () => {
    expect(getHorizonRetryAfterSeconds(horizonError(429))).toBe(
      DEFAULT_RATE_LIMIT_RETRY_AFTER_SECONDS
    );
  });

  it("falls back to the default for errors without a response", () => {
    expect(getHorizonRetryAfterSeconds(new Error("boom"))).toBe(
      DEFAULT_RATE_LIMIT_RETRY_AFTER_SECONDS
    );
  });
});

describe("isTransientHorizonError", () => {
  it("retries 429s", () => {
    expect(isTransientHorizonError(horizonError(429))).toBe(true);
  });

  it("retries 5xx responses", () => {
    expect(isTransientHorizonError(horizonError(500))).toBe(true);
    expect(isTransientHorizonError(horizonError(503))).toBe(true);
  });

  it("retries network-level failures without an HTTP status", () => {
    expect(isTransientHorizonError(new Error("fetch failed"))).toBe(true);
  });

  it("does not retry other 4xx client errors", () => {
    expect(isTransientHorizonError(horizonError(400))).toBe(false);
    expect(isTransientHorizonError(horizonError(404))).toBe(false);
  });
});

describe("withHorizonResilience", () => {
  it("returns the result of a successful call", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withHorizonResilience("test", fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries transient failures and succeeds on a later attempt", async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockRejectedValueOnce(horizonError(503)).mockResolvedValueOnce("recovered");

    const promise = withHorizonResilience("test", fn, { maxRetries: 2 });
    // Flush the backoff delay between attempts.
    await vi.advanceTimersByTimeAsync(60_000);
    await expect(promise).resolves.toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("translates a final 429 into HorizonRateLimitError with retry-after", async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockRejectedValue(horizonError(429, "15"));

    const promise = withHorizonResilience("test", fn, { maxRetries: 1 });
    // Mark handled immediately so the rejection during timer advancement
    // is never reported as unhandled.
    promise.catch(() => {});
    await vi.advanceTimersByTimeAsync(60_000);

    await expect(promise).rejects.toBeInstanceOf(HorizonRateLimitError);
    await expect(promise).rejects.toMatchObject({ retryAfterSeconds: 15 });
  });

  it("does not translate non-rate-limit failures", async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockRejectedValue(horizonError(400));

    const promise = withHorizonResilience("test", fn, { maxRetries: 1 });
    promise.catch(() => {});
    await vi.advanceTimersByTimeAsync(60_000);

    await expect(promise).rejects.toThrow("Horizon HTTP 400");
    await expect(promise).rejects.not.toBeInstanceOf(HorizonRateLimitError);
  });

  it("opens the circuit breaker after repeated 429s and fails fast", async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockRejectedValue(horizonError(429));

    // 5 consecutive rate-limited calls (threshold=5) open the circuit.
    for (let i = 0; i < 5; i++) {
      const promise = withHorizonResilience("test", fn, { maxRetries: 0 });
      promise.catch(() => {});
      await vi.advanceTimersByTimeAsync(60_000);
      await expect(promise).rejects.toBeInstanceOf(HorizonRateLimitError);
    }

    // The circuit is now open — the next call fails fast without invoking fn.
    const circuitPromise = withHorizonResilience("test", fn, { maxRetries: 0 });
    circuitPromise.catch(() => {});
    await expect(circuitPromise).rejects.toThrow(/Circuit breaker "horizon:test" is open/);
    expect(fn).toHaveBeenCalledTimes(5);
  });
});
