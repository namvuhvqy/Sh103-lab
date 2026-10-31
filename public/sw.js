const CACHE_NAME = "sh103-static-v3";
const OFFLINE_URL = "/offline";

const STATIC_ASSETS = [
  "/offline",
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/images/logo103.png",
  "/images/equipment/biochemistry-analyzer.jpg",
  "/images/equipment/immunology-analyzer.jpg",
  "/images/equipment/bloodgas-analyzer.jpg",
  "/images/equipment/centrifuge-machine.jpg",
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

  const isImmutableNextStatic = url.pathname.startsWith("/_next/static/");
  const isStaticMediaOrManifest =
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/manifest.json";

  // 1. Cache-First for immutable Next.js hashed bundles (0ms latency on mobile)
  if (isImmutableNextStatic) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.status === 200) {
          cache.put(event.request, response.clone());
        }
        return response;
      })
    );
    return;
  }

  // 2. Stale-While-Revalidate for static icons, hospital logos, and equipment thumbnails
  if (isStaticMediaOrManifest) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        const networkPromise = fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => null);
        return cached || (await networkPromise) || new Response("", { status: 504 });
      })
    );
    return;
  }

  // 3. Network-first with Cache fallback for app shell / navigation
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (
          response.status === 200 &&
          (url.pathname.endsWith(".css") || url.pathname.endsWith(".js"))
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

// ==========================================
// Web Push Notifications (Android & iOS Safari 16.4+)
// ==========================================
self.addEventListener("push", (event) => {
  let payload = {
    title: "Khoa Sinh Hóa · Bệnh viện Quân y 103",
    body: "Bạn có thông báo mới từ ca trực xét nghiệm.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    data: { url: "/notifications" },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
      if (!payload.data) payload.data = { url: parsed.url || "/notifications" };
      if (parsed.message && !parsed.body) payload.body = parsed.message;
    } catch {
      payload.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: payload.body || "Thông báo nhắc việc ca trực Khoa Sinh Hóa BV103.",
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: payload.badge || "/icons/icon-192x192.png",
    vibrate: [200, 100, 200],
    data: payload.data || { url: payload.url || "/notifications" },
    tag: payload.tag || "sh103-notification",
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/notifications";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus and navigate existing tab if open
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

