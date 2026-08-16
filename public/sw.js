/* Koveline service worker — full offline for a fully static site.
   Bump VERSION to invalidate old caches on deploy. */
const VERSION = "koveline-v6.0.0";
const CORE = ["/", "/islam/grade-9/mixed", "/islam/grade-10/mixed", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // hashed build assets + fonts: cache-first (immutable)
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/fonts/")) {
    e.respondWith(
      caches.open(VERSION).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // pages: network-first, fall back to cache when offline
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(async () => (await caches.match(req)) ?? (await caches.match("/"))),
    );
    return;
  }

  // everything else: stale-while-revalidate
  e.respondWith(
    caches.open(VERSION).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req)
        .then((res) => {
          if (res.ok) c.put(req, res.clone());
          return res;
        })
        .catch(() => hit);
      return hit ?? net;
    }),
  );
});
