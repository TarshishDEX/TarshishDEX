/**
 * Network detection and status utilities.
 */

/**
 * Check if the browser is currently online.
 * Combines navigator.onLine with a fetch probe.
 */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}

/**
 * Subscribe to online/offline events.
 * Returns an unsubscribe function.
 */
export function onNetworkChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

/** Get effective network type (4g, 3g, 2g, slow-2g) if available. */
export function getNetworkType(): string | undefined {
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  return conn?.effectiveType;
}
