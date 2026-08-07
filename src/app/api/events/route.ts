import { NextResponse } from "next/server";

/**
 * Server-Sent Events endpoint for real-time updates.
 * Streams market data changes, swap confirmations, and price alerts
 * to connected clients.
 */
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode("event: connected\ndata: {}\n\n"));

      // Keep connection alive with heartbeat every 30s
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 30_000);

      // Clean up on close
      const cleanup = () => {
        clearInterval(heartbeat);
        controller.close();
      };

      // Handle client disconnect
      return cleanup;
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
