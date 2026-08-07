import { NextResponse } from "next/server";
import { fetchTopAssets, getMarketStatsForTokens } from "@/lib/stellar/prices";
import { parseLimit } from "@/lib/api/params";
import { logger } from "@/lib/server/logger";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/market/stats?limit=10
 * Market stats for the most traded assets, quoted against XLM.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(ip, "/api/market/stats");
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  }

  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"), 10, 25);

  try {
    const tokens = await fetchTopAssets(limit);
    const stats = await getMarketStatsForTokens(tokens);
    logger.info("market stats served", { count: stats.length });
    return NextResponse.json({ count: stats.length, stats });
  } catch (error) {
    logger.error("market stats failed", { error: String(error) });
    return NextResponse.json({ error: "Failed to fetch market stats" }, { status: 502 });
  }
}

export { OPTIONS } from "@/lib/api/cors";
