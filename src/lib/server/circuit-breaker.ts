/**
 * Simple circuit breaker for external API calls (Horizon, Soroban RPC).
 * When `failureThreshold` consecutive calls fail, the breaker opens and
 * fast-fails subsequent calls for `cooldownMs`. After the cooldown, one
 * probe request (half-open) is allowed through to test recovery.
 */

type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreakerOptions {
  failureThreshold?: number;
  cooldownMs?: number;
  name?: string;
}

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  readonly name: string;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.cooldownMs = options.cooldownMs ?? 30_000;
    this.name = options.name ?? "default";
  }

  /** Execute fn with circuit breaker protection. Throws if the circuit is open. */
  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.cooldownMs) {
        this.state = "half-open";
      } else {
        throw new CircuitOpenError(this.name);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.state = "closed";
    this.failureCount = 0;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = "open";
    }
  }

  get isOpen(): boolean {
    return this.state === "open";
  }
}

export class CircuitOpenError extends Error {
  constructor(breakerName: string) {
    super(`Circuit breaker "${breakerName}" is open — fast-failing`);
    this.name = "CircuitOpenError";
  }
}
