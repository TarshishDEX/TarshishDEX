import { NextResponse } from "next/server";
import { fetchCandles } from "@/lib/stellar/prices";
import { toToken } from "@/lib/stellar/tokens";
import { parseAssetParam, parseDurationMs } from "@/lib/api/params";
import { logger } from "@/lib/server/logger";
import { checkRateLimit, getClientId } from "@/lib/server/rate-limit";
import { apiHandler } from "@/lib/server/api-handler";
import { buildErrorResponse, ErrorCode } from "@/lib/server/api-error";

export const dynamic = "force-dynamic";

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/**
 * GET /api/market/candles?base=XLM&counter=USDC:ISSUER&resolution=3600000&range=86400000
 * OHLCV candles for a pair from Horizon trade aggregations.
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
  const baseParam = parseAssetParam(url.searchParams.get("base"));
  const counterParam = parseAssetParam(url.searchParams.get("counter"));
  const resolutionMs = parseDurationMs(url.searchParams.get("resolution"), HOUR_MS, DAY_MS);
  const rangeMs = parseDurationMs(url.searchParams.get("range"), DAY_MS, 90 * DAY_MS);

  if (!baseParam || !counterParam) {
    return NextResponse.json(
      buildErrorResponse(
        ErrorCode.BAD_REQUEST,
        400,
        "Missing or invalid 'base'/'counter' assets (CODE:ISSUER)"
      ),
      { status: 400 }
    );
  }

  try {
    const base = toToken(baseParam.code, baseParam.issuer);
    const counter = toToken(counterParam.code, counterParam.issuer);
    const candles = await fetchCandles(
      base,
      counter,
      Date.now() - rangeMs,
      Date.now(),
      resolutionMs
    );
    logger.info("candles served", {
      base: base.code,
      counter: counter.code,
      count: candles.length,
    });
    return NextResponse.json({ count: candles.length, candles });
  } catch (error) {
    logger.error("candles fetch failed", { error: String(error) });
    return NextResponse.json(
      buildErrorResponse(ErrorCode.CANDLES_FETCH_FAILED, 502, "Failed to fetch candles"),
      { status: 502 }
    );
  }
});

export { OPTIONS } from "@/lib/api/cors";
