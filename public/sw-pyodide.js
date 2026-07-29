// Service Worker — cache Pyodide (Cache-First, permanent)
const CACHE_NAME = "pyodide-v0.27";
const PYODIDE_ORIGIN = "https://cdn.jsdelivr.net";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Only intercept Pyodide CDN requests
  if (url.origin !== PYODIDE_ORIGIN || !url.pathname.includes("pyodide")) return;

  e.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(e.request);
      if (cached) return cached;
      const response = await fetch(e.request);
      if (response.ok) cache.put(e.request, response.clone());
      return response;
    })
  );
});
