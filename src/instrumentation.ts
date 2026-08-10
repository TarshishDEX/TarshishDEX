/**
 * Next.js instrumentation hook — runs at server startup before any requests.
 * Validates environment variables so misconfigured deployments fail fast.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    const { valid, missing } = validateEnv();
    if (!valid) {
      console.error(
        `[tarshishdex] FATAL: Missing required environment variables: ${missing.join(", ")}`
      );
      // Don't throw — a missing env var on the server shouldn't crash the
      // dev server, but the warning is loud enough to be noticed.
    }
  }
}
