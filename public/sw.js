/**
 * TarshishDEX service worker — network-first with cache fallback.
 *
 * Strategy:
 *  - Navigation requests (HTML pages): network-first, fall back to cache,
 *    then fall back to the shell. This keeps the app usable offline.
 *  - Static assets (JS/CSS/fonts/images): cache-first after initial load.
 *    These change only on deployment (hashed filenames), so cache-first
 *    is safe and fast.
 *  - API requests: network-only — never cache blockchain data.
 *
 * Registered by src/components/ui/sw-registrar.tsx if supported.
 */
const CACHE_VERSION = "v0.2.0";
const STATIC_CACHE = `tarshishdex-static-${CACHE_VERSION}`;
const PAGE_CACHE = `tarshishdex-pages-${CACHE_VERSION}`;

// ── Install: preload the app shell ───────────────────────────────────
self.addEventListener("install", (event) => {
  const shellUrls = ["/", "/swap", "/markets", "/portfolio", "/assets", "/analytics"];
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.addAll(shellUrls))
  );
  self.skipWaiting();
});

// ── Activate: clean old cache versions ───────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (k) =>
              k !== STATIC_CACHE && k !== PAGE_CACHE
          )
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for nav, cache-first for static, skip API ──
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: network only
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigation (HTML) requests: network first, cache fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the fresh page
          const cloned = response.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached ?? caches.match("/"))
        )
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images): cache-first
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "image"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetched = fetch(request).then((response) => {
          const cloned = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, cloned));
          return response;
        });
        return cached ?? fetched;
      })
    );
  }
});
