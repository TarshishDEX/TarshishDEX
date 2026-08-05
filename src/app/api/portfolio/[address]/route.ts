import { NextResponse } from "next/server";
import { fetchPortfolioSummary } from "@/lib/stellar/account";
import { parseAddress } from "@/lib/api/params";
import { logger } from "@/lib/server/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/portfolio/:address
 * Portfolio summary (valuation, allocation, balances) for a Stellar account.
 */
export async function GET(request: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const validAddress = parseAddress(address);
  if (!validAddress) {
    return NextResponse.json({ error: "Invalid Stellar public key" }, { status: 400 });
  }

  try {
    const summary = await fetchPortfolioSummary(validAddress);
    logger.info("portfolio served", { address: validAddress });
    return NextResponse.json(summary);
  } catch (error) {
    logger.error("portfolio fetch failed", { address: validAddress, error: String(error) });
    return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 502 });
  }
}

export { OPTIONS } from "@/lib/api/cors";
