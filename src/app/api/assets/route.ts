import { NextResponse } from "next/server";
import { fetchAssetCatalog } from "@/lib/stellar/catalog";
import { parseLimit } from "@/lib/api/params";
import { logger } from "@/lib/server/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/assets?limit=24&code=USDC&issuer=G...
 * Discover Stellar assets with issuer details, supply, and trustline stats.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"), 24, 100);
  const code = url.searchParams.get("code") ?? undefined;
  const issuer = url.searchParams.get("issuer") ?? undefined;

  try {
    const assets = await fetchAssetCatalog(limit, code, issuer);
    logger.info("asset catalog served", { count: assets.length });
    return NextResponse.json({ count: assets.length, assets });
  } catch (error) {
    logger.error("asset catalog fetch failed", { error: String(error) });
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 502 });
  }
}

export { OPTIONS } from "@/lib/api/cors";
