/**
 * Minimal PWA service worker — caches the app shell for offline resilience.
 * Registered by the client if supported and enabled.
 *
 * Registered in src/app/layout.tsx via useEffect.
 */
const CACHE_NAME = "tarshishdex-v0.1.0";
const SHELL_URLS = ["/", "/swap", "/markets", "/portfolio", "/assets", "/analytics"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Only cache navigation requests (HTML pages); let API calls pass through.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(request) ?? caches.match("/"))
    );
  }
});
