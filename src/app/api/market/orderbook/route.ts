import { NextResponse } from "next/server";
import { fetchOrderbook } from "@/lib/stellar/orderbook";
import { parseAssetParam, parseLimit } from "@/lib/api/params";
import { logger } from "@/lib/server/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/market/orderbook?selling=XLM&buying=USDC:ISSUER&limit=20
 * Orderbook depth for a base/counter pair on Stellar's native DEX.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const selling = parseAssetParam(url.searchParams.get("selling"));
  const buying = parseAssetParam(url.searchParams.get("buying"));
  const limit = parseLimit(url.searchParams.get("limit"), 20, 100);

  if (!selling || !buying) {
    return NextResponse.json(
      { error: "Missing or invalid 'selling'/'buying' assets (CODE:ISSUER)" },
      { status: 400 }
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
    return NextResponse.json({ error: "Failed to fetch orderbook" }, { status: 502 });
  }
}

export { OPTIONS } from "@/lib/api/cors";
