/**
 * Graceful shutdown handler.
 * Listens for SIGTERM/SIGINT and closes connections cleanly before
 * the process exits. Prevents dropped requests during deployments.
 */

interface ShutdownOptions {
  /** Maximum time to wait for connections to close (ms). */
  timeoutMs?: number;
  /** Called before shutdown to clean up resources. */
  onShutdown?: () => Promise<void>;
}

/**
 * Register graceful shutdown handlers.
 * On SIGTERM/SIGINT, calls onShutdown and exits after timeoutMs.
 */
export function registerGracefulShutdown(options: ShutdownOptions = {}): void {
  const { timeoutMs = 10_000, onShutdown } = options;

  async function handleShutdown(signal: string): Promise<void> {
    console.log(`[shutdown] Received ${signal}, shutting down gracefully...`);

    try {
      if (onShutdown) {
        await Promise.race([
          onShutdown(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Shutdown timed out")), timeoutMs)
          ),
        ]);
      }
    } catch (err) {
      console.error("[shutdown] Error during shutdown:", err);
    }

    console.log("[shutdown] Goodbye.");
    process.exit(0);
  }

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}
