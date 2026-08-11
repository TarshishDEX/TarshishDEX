import { NextResponse } from "next/server";
import { fetchOrderbook } from "@/lib/stellar/orderbook";
import { parseAssetParam, parseLimit } from "@/lib/api/params";
import { logger } from "@/lib/server/logger";
import { checkRateLimit, getClientId } from "@/lib/server/rate-limit";
import { apiHandler } from "@/lib/server/api-handler";
import { buildErrorResponse, ErrorCode } from "@/lib/server/api-error";

export const dynamic = "force-dynamic";

/**
 * GET /api/market/orderbook?selling=XLM&buying=USDC:ISSUER&limit=20
 * Orderbook depth for a base/counter pair on Stellar's native DEX.
 */
export const GET = apiHandler(async (request) => {
  const ip = getClientId(request);
  const rateLimit = checkRateLimit(ip, { maxRequests: 100, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      buildErrorResponse(ErrorCode.RATE_LIMITED, 429, "Too many requests"),
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  const url = new URL(request.url);
  const selling = parseAssetParam(url.searchParams.get("selling"));
  const buying = parseAssetParam(url.searchParams.get("buying"));
  const limit = parseLimit(url.searchParams.get("limit"), 20, 100);

  if (!selling || !buying) {
    return NextResponse.json(
      buildErrorResponse(
        ErrorCode.BAD_REQUEST,
        400,
        "Missing or invalid 'selling'/'buying' assets (CODE:ISSUER)",
      ),
      { status: 400 },
    );
  }

  try {
    const orderbook = await fetchOrderbook(selling, buying, limit);
    logger.info("orderbook served", {
      base: orderbook.base.code,
      counter: orderbook.counter.code,
    });
    return NextResponse.json(orderbook);
  } catch (error) {
    logger.error("orderbook fetch failed", { error: String(error) });
    return NextResponse.json(
      buildErrorResponse(ErrorCode.ORDERBOOK_FETCH_FAILED, 502, "Failed to fetch orderbook"),
      { status: 502 },
    );
  }
});

export { OPTIONS } from "@/lib/api/cors";
