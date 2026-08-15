import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";
import { getActiveNetwork } from "@/lib/stellar/config";
import { runHealthChecks } from "@/lib/server/health";

/** Never cache or statically optimize the health endpoint. */
export const dynamic = "force-dynamic";

/**
 * Health check endpoint for load balancers and monitoring.
 *
 * Probes the active network's Horizon and Soroban RPC endpoints plus the
 * limit-order contract (read-only get_version call) and reports the worst
 * of all checks in the `status` field:
 *
 *   - ok:       all probed dependencies responded
 *   - degraded: a dependency responded but is unhealthy (e.g. contract not
 *               configured for this environment, non-2xx Horizon response)
 *   - down:     a dependency is unreachable or errored
 *
 * The endpoint always returns HTTP 200 so load balancers that only check
 * reachability keep working; the `status` field carries the real health.
 */
export async function GET() {
  const { status, checks } = await runHealthChecks();
  return NextResponse.json(
    {
      status,
      service: "tarshishdex",
      network: getActiveNetwork().name,
      timestamp: Date.now(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: packageJson.version,
      checks,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}
