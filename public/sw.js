const CACHE_NAME = "sh103-static-v1";
const OFFLINE_URL = "/offline";

const STATIC_ASSETS = [
  "/offline",
  "/manifest.json",
  "/favicon.ico",
];

// Patterns that MUST NEVER be cached by service worker
const BYPASS_PATTERNS = [
  /\/auth\//,
  /\/rest\//,
  /\/rpc\//,
  /\/api\//,
  /\/admin\//,
  /\/reports\//,
  /\/supabase\//,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Explicit bypass check: do NOT cache or intercept auth, rest, rpc, business APIs, reports, or admin mutations
  const shouldBypass = BYPASS_PATTERNS.some((pattern) => pattern.test(url.pathname));

  if (shouldBypass || event.request.method !== "GET") {
    return;
  }

  // Network-first or Cache fallback for app shell / static assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache static JS/CSS assets
        if (
          response.status === 200 &&
          (url.pathname.startsWith("/_next/static/") ||
            url.pathname.startsWith("/icons/") ||
            url.pathname.endsWith(".css") ||
            url.pathname.endsWith(".js"))
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        if (event.request.mode === "navigate") {
          return cache.match(OFFLINE_URL);
        }

        return new Response("Mất kết nối mạng", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      })
  );
});
