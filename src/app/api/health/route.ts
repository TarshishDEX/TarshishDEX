import { NextResponse } from "next/server";
import { getActiveNetwork } from "@/lib/stellar/config";
import { checkHorizonHealth } from "@/lib/server/horizon-pool";
import { buildServerTiming, createTimings, measureTiming } from "@/lib/server/server-timing";
import { buildCacheControl, HEALTH_CACHE } from "@/lib/server/cache-headers";
import { logger } from "@/lib/server/logger";

export const dynamic = "force-dynamic";

/** GET /api/health — service health, Horizon connectivity probe, and performance timing. */
export async function GET() {
  const timings = createTimings();
  const network = getActiveNetwork();

  const horizonHealth = await measureTiming("horizon_health", checkHorizonHealth, timings);

  const status = horizonHealth.healthy ? "ok" : "degraded";
  logger.info("health check", {
    status,
    network: network.name,
    horizonLatencyMs: horizonHealth.latencyMs,
  });

  return NextResponse.json(
    {
      status,
      service: "tarshishdex",
      version: "0.1.0",
      network: network.name,
      horizon: {
        url: horizonHealth.horizonUrl,
        healthy: horizonHealth.healthy,
        latencyMs: horizonHealth.latencyMs,
      },
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": buildCacheControl(HEALTH_CACHE),
        "Server-Timing": buildServerTiming(timings),
      },
    }
  );
}

export { OPTIONS } from "@/lib/api/cors";
