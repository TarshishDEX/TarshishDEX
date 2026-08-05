import { NextResponse } from "next/server";
import { fetchTradeHistory } from "@/lib/stellar/history";
import { parseAddress, parseLimit } from "@/lib/api/params";
import { logger } from "@/lib/server/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/trades/:address?limit=40
 * Recent trade history for a Stellar account.
 */
export async function GET(request: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const validAddress = parseAddress(address);
  if (!validAddress) {
    return NextResponse.json({ error: "Invalid Stellar public key" }, { status: 400 });
  }

  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"), 40, 100);

  try {
    const entries = await fetchTradeHistory(validAddress, limit);
    logger.info("trade history served", { address: validAddress, count: entries.length });
    return NextResponse.json({ count: entries.length, entries });
  } catch (error) {
    logger.error("trade history fetch failed", { address: validAddress, error: String(error) });
    return NextResponse.json({ error: "Failed to fetch trade history" }, { status: 502 });
  }
}

export { OPTIONS } from "@/lib/api/cors";
