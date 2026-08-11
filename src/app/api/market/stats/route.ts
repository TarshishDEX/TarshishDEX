import { NextResponse } from "next/server";
import { fetchTopAssets, getMarketStatsForTokens } from "@/lib/stellar/prices";
import { parseLimit } from "@/lib/api/params";
import { logger } from "@/lib/server/logger";
import { checkRateLimit, getClientId } from "@/lib/server/rate-limit";
import { apiHandler } from "@/lib/server/api-handler";
import { buildErrorResponse, ErrorCode } from "@/lib/server/api-error";

export const dynamic = "force-dynamic";

/**
 * GET /api/market/stats?limit=10
 * Market stats for the most traded assets, quoted against XLM.
 */
export const GET = apiHandler(async (request) => {
  const ip = getClientId(request);
  const rateLimit = checkRateLimit(ip, {
    maxRequests: 100,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      buildErrorResponse(ErrorCode.RATE_LIMITED, 429, "Too many requests"),
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      },
    );
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
    return NextResponse.json(
      buildErrorResponse(ErrorCode.STATS_FETCH_FAILED, 502, "Failed to fetch market stats"),
      { status: 502 },
    );
  }
});

export { OPTIONS } from "@/lib/api/cors";
