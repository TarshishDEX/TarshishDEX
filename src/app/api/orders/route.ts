import { NextResponse } from "next/server";
import { logger } from "@/lib/server/logger";
import { parseAddress } from "@/lib/api/params";
import { queryUserOrders, queryOrderCount } from "@/lib/soroban/limit-order";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

function withRateLimit(request: Request): NextResponse | null {
  const ip = getClientIp(request);
  const result = checkRateLimit(ip, "/api/orders");
  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(result.retryAfter) } }
    );
  }
  return null;
}

/**
 * GET /api/orders?user=G...&limit=20&cursor=0
 *
 * Query limit orders for a user from the Soroban limit-order contract.
 * When no user is provided, returns the global order count.
 */
export async function GET(request: Request) {
  const rateLimit = withRateLimit(request);
  if (rateLimit) return rateLimit;

  const url = new URL(request.url);
  const user = parseAddress(url.searchParams.get("user") ?? "");

  try {
    if (user) {
      logger.info("limit orders queried", { user });
      const orders = await queryUserOrders(user);
      return NextResponse.json({ user, orders, count: orders.length });
    }

    const count = await queryOrderCount();
    logger.info("limit orders count served", { count });
    return NextResponse.json({
      count,
      note: "Pass ?user=G... to fetch specific user orders.",
    });
  } catch (error) {
    logger.error("limit orders query failed", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to query limit orders — contract may not be deployed" },
      { status: 502 }
    );
  }
}

/**
 * POST /api/orders
 * Build a place_order Soroban transaction and return the XDR for wallet signing.
 */
export async function POST(request: Request) {
  const rateLimit = withRateLimit(request);
  if (rateLimit) return rateLimit;

  try {
    const body = await request.json();
    const { userAddress, base, counter, price, amount, expiryLedger, side } = body;

    if (!userAddress || !base || !counter || !price || !amount || !side) {
      return NextResponse.json(
        { error: "Missing required fields: userAddress, base, counter, price, amount, side" },
        { status: 400 }
      );
    }

    const { buildPlaceOrderTx } = await import("@/lib/soroban/limit-order");
    const xdr = await buildPlaceOrderTx(
      userAddress,
      base,
      counter,
      Number(price),
      Number(amount),
      Number(expiryLedger ?? 0),
      side
    );

    if (!xdr) {
      return NextResponse.json(
        { error: "Failed to build transaction — contract may not be deployed" },
        { status: 502 }
      );
    }

    logger.info("place order tx built", { user: userAddress, base, counter });
    return NextResponse.json({ xdr, method: "place_order" });
  } catch (error) {
    logger.error("place order build failed", { error: String(error) });
    return NextResponse.json({ error: "Failed to build place order transaction" }, { status: 502 });
  }
}

/**
 * DELETE /api/orders
 * Build a cancel_order or mark_executed transaction XDR for wallet signing.
 * Body: { id, userAddress, txHash? }
 */
export async function DELETE(request: Request) {
  const rateLimit = withRateLimit(request);
  if (rateLimit) return rateLimit;

  try {
    const body = await request.json();
    const { id, userAddress, txHash } = body;

    if (!id || !userAddress) {
      return NextResponse.json(
        { error: "Missing required fields: id, userAddress" },
        { status: 400 }
      );
    }

    const { buildCancelOrExecuteTx } = await import("@/lib/soroban/limit-order");
    const xdr = await buildCancelOrExecuteTx(userAddress, Number(id), txHash);

    if (!xdr) {
      return NextResponse.json(
        { error: "Failed to build transaction — contract may not be deployed" },
        { status: 502 }
      );
    }

    logger.info("cancel/execute tx built", {
      orderId: id,
      user: userAddress,
      action: txHash ? "mark_executed" : "cancel_order",
    });
    return NextResponse.json({ xdr, method: txHash ? "mark_executed" : "cancel_order" });
  } catch (error) {
    logger.error("cancel/execute build failed", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to build cancel/execute transaction" },
      { status: 502 }
    );
  }
}

export { OPTIONS } from "@/lib/api/cors";
