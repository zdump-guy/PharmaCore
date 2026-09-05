/**
 * PharmaCore Progressive Web App (PWA) Service Worker
 * Version: 1.0.0
 * Provides offline caching, app shell performance, and desktop/mobile installability.
 */

const CACHE_NAME = "pharmacore-v1";

const PRECACHE_ASSETS = [
  "/",
  "/site.webmanifest",
  "/favicon.ico",
  "/pharmacore-logo.svg",
  "/pharmacore-logo-dark.svg",
  "/pharmacore-mark.svg",
  "/pharmacore-mark-dark.svg",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/maskable-icon-512x512.png",
  "/apple-touch-icon.png"
];

// 1. Install: Precache app shell and skip waiting
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        // Precaching error - proceed
        console.warn("[SW] Precaching error:", err);
      })
  );
});

// 2. Activate: Clean up legacy caches and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Strategy:
// - API calls: Network-Only (never cache mutations or student data)
// - Navigation: Network-First with Cache fallback
// - Static assets (_next/static, images, fonts, icons): Stale-While-Revalidate
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept same-origin HTTP(S) GET requests
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Bypass API routes, uploadthing, and auth calls
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/image")) {
    return;
  }

  // Navigation requests (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const homeCached = await caches.match("/");
          if (homeCached) {
            return homeCached;
          }
          return new Response("Offline - Please check your internet connection", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain" }
          });
        })
    );
    return;
  }

  // Static Assets (_next/static, icons, svgs, images, fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
