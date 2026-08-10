/**
 * Circuit breaker pattern implementation.
 * Prevents cascading failures by temporarily stopping requests to
 * failing services after a threshold of errors is reached.
 */

interface CircuitBreaker {
  failures: number;
  lastFailure: number;
  state: "closed" | "open" | "half-open";
}

const breakers = new Map<string, CircuitBreaker>();

/**
 * Execute a function with circuit breaker protection.
 * After `threshold` failures within `windowMs`, the circuit opens
 * and requests fail fast for `timeoutMs` before attempting recovery.
 */
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  options: { threshold?: number; windowMs?: number; timeoutMs?: number } = {}
): Promise<T> {
  const { threshold = 5, timeoutMs = 60_000 } = options;

  let breaker = breakers.get(name);
  if (!breaker) {
    breaker = { failures: 0, lastFailure: 0, state: "closed" };
    breakers.set(name, breaker);
  }

  const now = Date.now();

  // Reset if window expired
  if (breaker.state === "open" && now - breaker.lastFailure > timeoutMs) {
    breaker.state = "half-open";
    breaker.failures = 0;
  }

  if (breaker.state === "open") {
    throw new Error(`Circuit breaker "${name}" is open`);
  }

  try {
    const result = await fn();
    breaker.state = "closed";
    breaker.failures = 0;
    return result;
  } catch (error) {
    breaker.failures++;
    breaker.lastFailure = now;

    if (breaker.failures >= threshold) {
      breaker.state = "open";
    }
    throw error;
  }
}

/** Reset a circuit breaker (useful in tests). */
export function resetCircuitBreaker(name: string): void {
  breakers.delete(name);
}
