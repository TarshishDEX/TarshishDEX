import { logger } from "@/lib/server/logger";

type CleanupFn = () => Promise<void> | void;

/**
 * Register shutdown handlers for SIGTERM and SIGINT.
 * Runs all registered cleanup functions in reverse order before exiting.
 * Only active in Node.js runtime (not Edge).
 */
export function setupGracefulShutdown(cleanupFns: CleanupFn[] = []): () => void {
  let shuttingDown = false;

  async function handleShutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info(`Received ${signal} — starting graceful shutdown`, {
      cleanupCount: cleanupFns.length,
    });

    // Run cleanups in reverse order (LIFO)
    for (let i = cleanupFns.length - 1; i >= 0; i--) {
      try {
        await cleanupFns[i]();
      } catch (error) {
        logger.error("Cleanup function failed during shutdown", {
          index: i,
          error: String(error),
        });
      }
    }

    logger.info("Graceful shutdown complete");
    process.exit(0);
  }

  const onSigterm = () => handleShutdown("SIGTERM");
  const onSigint = () => handleShutdown("SIGINT");

  process.on("SIGTERM", onSigterm);
  process.on("SIGINT", onSigint);

  // Return a function to remove the listeners (for testing)
  return () => {
    process.off("SIGTERM", onSigterm);
    process.off("SIGINT", onSigint);
  };
}
