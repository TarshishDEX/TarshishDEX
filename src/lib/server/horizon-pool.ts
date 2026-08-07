import { Horizon } from "@stellar/stellar-sdk";
import { getActiveNetwork } from "@/lib/stellar/config";
import { CircuitBreaker } from "@/lib/server/circuit-breaker";
import { logger } from "@/lib/server/logger";

/**
 * Managed Horizon connection pool.
 * Lazily creates a single Horizon.Server instance per network and wraps
 * it with a circuit breaker to prevent cascading failures when Horizon
 * is degraded.
 */

let horizonServer: Horizon.Server | null = null;
const horizonBreaker = new CircuitBreaker({
  failureThreshold: 3,
  cooldownMs: 15_000,
  name: "horizon",
});

/** Get the active Horizon server instance (lazily created). */
export function getPooledHorizonServer(): Horizon.Server {
  if (!horizonServer) {
    const network = getActiveNetwork();
    const override = process.env.HORIZON_URL?.trim().replace(/\/+$/, "");
    const url = override && /^https?:\/\//.test(override) ? override : network.horizonUrl;

    horizonServer = new Horizon.Server(url, {
      allowHttp: process.env.NODE_ENV !== "production",
    });

    logger.info("Horizon connection pool initialized", { url });
  }
  return horizonServer;
}

/**
 * Execute a Horizon query through the circuit breaker.
 * Automatically retries failed calls with backoff via the breaker.
 */
export async function executeHorizonQuery<T>(
  fn: (server: Horizon.Server) => Promise<T>
): Promise<T> {
  const server = getPooledHorizonServer();
  return horizonBreaker.call(() => fn(server));
}

/**
 * Health-check the Horizon connection by fetching the root endpoint.
 * Returns latency in ms and whether the connection is healthy.
 */
export async function checkHorizonHealth(): Promise<{
  healthy: boolean;
  latencyMs: number;
  horizonUrl: string;
}> {
  const server = getPooledHorizonServer();
  const start = Date.now();
  try {
    await server.root();
    return {
      healthy: true,
      latencyMs: Date.now() - start,
      horizonUrl: server.serverURL.toString(),
    };
  } catch {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      horizonUrl: server.serverURL.toString(),
    };
  }
}
