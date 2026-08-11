import { NextResponse } from "next/server";
import { findBestRoute } from "@/lib/stellar/routing";
import { swapQuoteParamsSchema } from "@/lib/api/schemas";
import { logger } from "@/lib/server/logger";
import { checkRateLimit, getClientId } from "@/lib/server/rate-limit";
import { apiHandler } from "@/lib/server/api-handler";
import { buildErrorResponse } from "@/lib/server/api-error";
import type { StellarAsset } from "@/lib/stellar/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/swap/quote?input=XLM&output=USDC:ISSUER&amount=100&slippage=1
 * Best-route quote with price impact, minimum received, and fee estimate.
 */
export const GET = apiHandler(async (request) => {
  const ip = getClientId(request);
  const rateLimit = checkRateLimit(ip, {
    maxRequests: 100,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
          ),
        },
      }
    );
  }

  const url = new URL(request.url);

  // Validate with Zod schema first (rich error messages)
  const parsed = swapQuoteParamsSchema.safeParse({
    input: url.searchParams.get("input"),
    output: url.searchParams.get("output"),
    amount: url.searchParams.get("amount"),
    slippage: url.searchParams.get("slippage"),
  });

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return NextResponse.json(buildErrorResponse(400, "Invalid parameters", details), {
      status: 400,
    });
  }

  const { input, output, amount, slippage } = parsed.data as {
    input: StellarAsset;
    output: StellarAsset;
    amount: string;
    slippage: number;
  };

  try {
    const route = await findBestRoute(input, output, amount, slippage);
    if (!route) {
      return NextResponse.json({ error: "No viable route found for this pair" }, { status: 404 });
    }
    logger.info("swap quote served", {
      input: (input as StellarAsset).code,
      output: (output as StellarAsset).code,
      method: route.method,
    });
    return NextResponse.json(route);
  } catch (error) {
    logger.error("swap quote failed", { error: String(error) });
    return NextResponse.json({ error: "Failed to compute swap quote" }, { status: 502 });
  }
});

export { OPTIONS } from "@/lib/api/cors";
