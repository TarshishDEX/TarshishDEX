import { NextResponse } from "next/server";
import { streamTradesRecords } from "@/lib/stellar/live";
import { parseAssetParam } from "@/lib/api/params";
import { logger } from "@/lib/server/logger";
import type { StellarAsset } from "@/lib/stellar/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const XLM: StellarAsset = { code: "XLM", isNative: true };
const HEARTBEAT_MS = 15_000;

/**
 * GET /api/events?base=XLM&counter=USDC:ISSUER
 *
 * Server-Sent Events stream of live trades for an asset pair on the native
 * DEX. Emits `trade` events (Horizon trade records) plus `: ping` heartbeats.
 * Consumers should reconnect with `Last-Event-ID` / cursor support as needed.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const base = parseAssetParam(url.searchParams.get("base")) ?? XLM;
  const counter = parseAssetParam(url.searchParams.get("counter"));

  if (!counter) {
    return NextResponse.json(
      { error: "Missing or invalid 'counter' asset (CODE:ISSUER)" },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          // Client is gone — teardown below.
        }
      }, HEARTBEAT_MS);

      cleanup = streamTradesRecords(base, counter, (record) => {
        try {
          controller.enqueue(encoder.encode(`event: trade\ndata: ${JSON.stringify(record)}\n\n`));
        } catch {
          // Client disconnected.
        }
      });

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        cleanup?.();
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      });
    },
    cancel() {
      cleanup?.();
    },
  });

  logger.info("event stream opened", { base: base.code, counter: counter.code });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export { OPTIONS } from "@/lib/api/cors";
