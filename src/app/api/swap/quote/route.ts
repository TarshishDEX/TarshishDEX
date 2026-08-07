import { NextResponse } from "next/server";
import { findBestRoute } from "@/lib/stellar/routing";
import { parseAmount, parseAssetParam, parseSlippage } from "@/lib/api/params";
import { logger } from "@/lib/server/logger";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/swap/quote?input=XLM&output=USDC:ISSUER&amount=100&slippage=1
 * Best-route quote with price impact, minimum received, and fee estimate.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(ip, "/api/swap/quote");
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  }

  const url = new URL(request.url);
  const input = parseAssetParam(url.searchParams.get("input"));
  const output = parseAssetParam(url.searchParams.get("output"));
  const amount = parseAmount(url.searchParams.get("amount"));
  const slippage = parseSlippage(url.searchParams.get("slippage"));

  if (!input || !output) {
    return NextResponse.json(
      { error: "Missing or invalid 'input'/'output' assets (CODE:ISSUER)" },
      { status: 400 }
    );
  }
  if (!amount) {
    return NextResponse.json({ error: "Missing or invalid 'amount'" }, { status: 400 });
  }

  try {
    const route = await findBestRoute(input, output, amount, slippage);
    if (!route) {
      return NextResponse.json({ error: "No viable route found for this pair" }, { status: 404 });
    }
    logger.info("swap quote served", {
      input: input.code,
      output: output.code,
      method: route.method,
    });
    return NextResponse.json(route);
  } catch (error) {
    logger.error("swap quote failed", { error: String(error) });
    return NextResponse.json({ error: "Failed to compute swap quote" }, { status: 502 });
  }
}

export { OPTIONS } from "@/lib/api/cors";
