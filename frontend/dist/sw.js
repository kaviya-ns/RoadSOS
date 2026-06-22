const CACHE = "roadsos-v2";
const PRECACHE = ["/", "/index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  // never cache API calls or external requests - always network
  if (e.request.url.includes("/api/") || 
      e.request.url.includes("192.168.1.39") ||
      e.request.url.includes("ngrok")) {
    e.respondWith(fetch(e.request));
    return;
  }
  // cache first for static assets only
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
