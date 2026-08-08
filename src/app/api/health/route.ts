import { NextResponse } from "next/server";

/**
 * Health check endpoint for load balancers and monitoring.
 * Returns 200 OK with build info when the app is healthy.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "tarshishdex",
      timestamp: Date.now(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version ?? "0.1.0",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}
