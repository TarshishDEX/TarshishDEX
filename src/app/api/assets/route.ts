import { NextResponse } from "next/server";
import { fetchAssetCatalog } from "@/lib/stellar/catalog";
import { parseLimit } from "@/lib/api/params";
import { logger } from "@/lib/server/logger";
import { checkRateLimit, getClientId } from "@/lib/server/rate-limit";
import { apiHandler } from "@/lib/server/api-handler";
import { buildErrorResponse, ErrorCode } from "@/lib/server/api-error";

export const dynamic = "force-dynamic";

/**
 * GET /api/assets?limit=24&code=USDC&issuer=G...
 * Discover Stellar assets with issuer details, supply, and trustline stats.
 */
export const GET = apiHandler(async (request) => {
  const ip = getClientId(request);
  const rateLimit = checkRateLimit(ip, { maxRequests: 100, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(buildErrorResponse(ErrorCode.RATE_LIMITED, 429, "Too many requests"), {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) },
    });
  }

  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"), 24, 100);
  const code = url.searchParams.get("code") ?? undefined;
  const issuer = url.searchParams.get("issuer") ?? undefined;

  try {
    const assets = await fetchAssetCatalog(limit, code, issuer);
    logger.info("asset catalog served", { count: assets.length });
    return NextResponse.json({ count: assets.length, assets });
  } catch (error) {
    logger.error("asset catalog fetch failed", { error: String(error) });
    return NextResponse.json(
      buildErrorResponse(ErrorCode.ASSET_FETCH_FAILED, 502, "Failed to fetch assets"),
      { status: 502 }
    );
  }
});

export { OPTIONS } from "@/lib/api/cors";
