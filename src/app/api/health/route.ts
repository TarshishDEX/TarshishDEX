import { NextResponse } from "next/server";
import { getActiveNetwork } from "@/lib/stellar/config";
import { logger } from "@/lib/server/logger";

export const dynamic = "force-dynamic";

/** GET /api/health — service health, active network, and uptime probe. */
export async function GET() {
  const network = getActiveNetwork();
  logger.debug("health check", { network: network.name });
  return NextResponse.json({
    status: "ok",
    service: "tarshishdex",
    network: network.name,
    horizonUrl: network.horizonUrl,
    timestamp: new Date().toISOString(),
  });
}
