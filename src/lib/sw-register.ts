/**
 * Registers the PWA service worker for offline shell caching.
 * Safe to call on every page load — the browser handles deduplication.
 *
 * Import and call once in the root layout:
 *   import { registerSW } from "@/lib/sw-register";
 *   // in a useEffect or layout body
 */
export function registerSW() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Log registration in dev only
        if (process.env.NODE_ENV === "development") {
          console.debug("[sw] registered", reg.scope);
        }
      })
      .catch((err) => {
        // SW registration failure is non-fatal — the app works fine without it.
        if (process.env.NODE_ENV === "development") {
          console.debug("[sw] registration failed", err);
        }
      });
  });
}
