import { NextResponse } from "next/server";
import { logger } from "@/lib/server/logger";
import { parseAddress, parseLimit } from "@/lib/api/params";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders?user=G...&limit=20&cursor=0
 *
 * Query limit orders for a user or paginated global list.
 * In production, this queries the Soroban limit-order contract via RPC.
 * For now, returns a placeholder structure showing the contract interface.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const user = parseAddress(url.searchParams.get("user") ?? "");
  const limit = parseLimit(url.searchParams.get("limit"), 20, 50);
  const cursor = parseInt(url.searchParams.get("cursor") ?? "0", 10);

  try {
    if (user) {
      logger.info("limit orders queried", { user });
      return NextResponse.json({
        user,
        orders: [],
        nextCursor: null,
        note: "Limit orders are placed via on-chain contract. Query the Soroban RPC for live data.",
      });
    }

    logger.info("limit orders queried (global)", { limit, cursor });
    return NextResponse.json({
      orders: [],
      nextCursor: null,
      total: 0,
      note: "Global order listing available via Soroban contract paginated_orders().",
    });
  } catch (error) {
    logger.error("limit orders query failed", { error: String(error) });
    return NextResponse.json({ error: "Failed to query limit orders" }, { status: 502 });
  }
}

export { OPTIONS } from "@/lib/api/cors";
