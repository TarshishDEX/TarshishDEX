import { NextResponse } from "next/server";
import { fetchLiquidityPools, buildPoolSummary } from "@/lib/stellar/pool-queries";
import { parseAssetParam } from "@/lib/api/params";
import { logger } from "@/lib/server/logger";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/** GET /api/market/pools?base=XLM&counter=USDC:ISSUER */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip, "/api/market/pools");
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
  }

  const url = new URL(request.url);
  const base = parseAssetParam(url.searchParams.get("base"));
  const counter = parseAssetParam(url.searchParams.get("counter"));
  if (!base || !counter) {
    return NextResponse.json({ error: "Missing base/counter params" }, { status: 400 });
  }
  try {
    const pools = await fetchLiquidityPools(base, counter);
    const summaries = pools.map(buildPoolSummary).filter(Boolean);
    logger.info("pools served", { base: base.code, counter: counter.code, count: summaries.length });
    return NextResponse.json({ count: summaries.length, pools: summaries });
  } catch (error) {
    logger.error("pools fetch failed", { error: String(error) });
    return NextResponse.json({ error: "Failed to fetch pools" }, { status: 502 });
  }
}

export { OPTIONS } from "@/lib/api/cors";
