import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Heartbeat interval — keeps the connection alive through proxies. */
const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Maximum lifetime of a single SSE connection. Connections are closed
 * gracefully after this duration so clients reconnect on a fresh stream,
 * which prevents long-lived sockets/file descriptors from accumulating.
 */
const MAX_STREAM_DURATION_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Server-Sent Events endpoint for real-time updates.
 * Streams market data changes, swap confirmations, and price alerts
 * to connected clients.
 *
 * Resource lifecycle:
 * - A heartbeat interval keeps the connection alive.
 * - A max-duration timer force-closes the stream after 10 minutes so
 *   stale connections are recycled instead of leaking.
 * - Cleanup runs exactly once, triggered by BOTH the stream's `cancel()`
 *   and the request's `abort` signal, so no interval/timer survives a
 *   client disconnect (even an abrupt one).
 */
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let maxDuration: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  /** Idempotent cleanup — clears every timer exactly once. */
  const cleanup = () => {
    if (closed) return;
    closed = true;
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
    if (maxDuration) {
      clearTimeout(maxDuration);
      maxDuration = null;
    }
  };

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode("event: connected\ndata: {}\n\n"));

      // Keep connection alive with heartbeat every 30s
      heartbeat = setInterval(() => {
        if (!closed) {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        }
      }, HEARTBEAT_INTERVAL_MS);

      // Gracefully close the stream after the maximum duration so clients
      // reconnect on a fresh connection instead of holding sockets forever.
      maxDuration = setTimeout(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode("event: stream-end\ndata: {}\n\n"));
        } finally {
          cleanup();
          try {
            controller.close();
          } catch {
            // Stream may already be closed by the runtime — nothing to do.
          }
        }
      }, MAX_STREAM_DURATION_MS);
    },
    // Handle client disconnect — the runtime invokes this on reader.cancel().
    cancel() {
      cleanup();
    },
  });

  // Abrupt disconnects abort the request signal even when cancel() is not
  // surfaced to the stream — always clean up via the signal listener too.
  request.signal.addEventListener("abort", cleanup);

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
