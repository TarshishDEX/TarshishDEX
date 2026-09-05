import { NextResponse } from "next/server";
import { fetchPortfolioSummary } from "@/lib/stellar/account";
import { parseAddress } from "@/lib/api/params";
import { logger } from "@/lib/server/logger";
import { checkRateLimit, getClientId } from "@/lib/server/rate-limit";
import { apiHandler } from "@/lib/server/api-handler";
import { buildErrorResponse, ErrorCode } from "@/lib/server/api-error";
import { HorizonRateLimitError } from "@/lib/stellar/horizon-guard";

export const dynamic = "force-dynamic";

/**
 * GET /api/portfolio/:address
 * Portfolio summary (valuation, allocation, balances) for a Stellar account.
 */
export const GET = apiHandler(
  async (request, { params }: { params: Promise<{ address: string }> }) => {
    const ip = getClientId(request);
    const rateLimit = checkRateLimit(ip, { maxRequests: 100, windowMs: 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        buildErrorResponse(ErrorCode.RATE_LIMITED, 429, "Too many requests"),
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    const { address } = await params;
    const validAddress = parseAddress(address);
    if (!validAddress) {
      return NextResponse.json(
        buildErrorResponse(ErrorCode.INVALID_STELLAR_ADDRESS, 400, "Invalid Stellar public key"),
        { status: 400 }
      );
    }

    try {
      const summary = await fetchPortfolioSummary(validAddress);
      logger.info("portfolio served", { address: validAddress });
      return NextResponse.json(summary);
    } catch (error) {
      // Horizon rate limits are distinct from other failures: surface them as
      // 429 with a Retry-After header so clients back off and retry.
      if (error instanceof HorizonRateLimitError) {
        logger.warn("portfolio fetch rate-limited by Horizon", {
          address: validAddress,
          retryAfterSeconds: error.retryAfterSeconds,
        });
        return NextResponse.json(
          buildErrorResponse(
            ErrorCode.HORIZON_RATE_LIMITED,
            429,
            `Horizon rate limit - retrying in ${error.retryAfterSeconds} seconds`
          ),
          {
            status: 429,
            headers: { "Retry-After": String(error.retryAfterSeconds) },
          }
        );
      }
      logger.error("portfolio fetch failed", { address: validAddress, error: String(error) });
      return NextResponse.json(
        buildErrorResponse(ErrorCode.PORTFOLIO_FETCH_FAILED, 502, "Failed to fetch portfolio"),
        { status: 502 }
      );
    }
  }
);

export { OPTIONS } from "@/lib/api/cors";
