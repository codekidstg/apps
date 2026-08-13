// Service Worker — CodeKids
// Pyodide: Cache-First permanent (gros assets ~10 Mo, offline Python)
// Next.js statics: délégué au cache HTTP natif (hash de contenu + headers immutable)
// Pages quête: Network-First with cache fallback (offline reading)

const PYODIDE_CACHE = "pyodide-v0.27";
const LESSON_CACHE  = "codekids-lessons-v3";

const PYODIDE_ORIGIN = "https://cdn.jsdelivr.net";

const ALLOWED_CACHES = new Set([PYODIDE_CACHE, LESSON_CACHE]);

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !ALLOWED_CACHES.has(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Pyodide CDN — Cache-First permanent
  if (url.origin === PYODIDE_ORIGIN && url.pathname.includes("pyodide")) {
    e.respondWith(cacheFirst(e.request, PYODIDE_CACHE));
    return;
  }

  // Next.js static assets — délégué au cache HTTP natif du navigateur
  // (les fichiers ont déjà des hash de contenu + headers immutable)
  if (url.pathname.startsWith("/_next/")) {
    return; // pas de SW cache, le navigateur gère
  }

  // Quête pages — Network-First with cache fallback (enables offline reading)
  if (url.pathname.includes("/quete/")) {
    e.respondWith(networkFirst(e.request, LESSON_CACHE));
    return;
  }
});

// ── Push Notifications ────────────────────────────────────────────

self.addEventListener("push", (e) => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title ?? "CodeKids", {
      body:    data.body  ?? "",
      icon:    data.icon  ?? "/icons/icon-192.png",
      badge:   "/icons/badge-72.png",
      tag:     data.tag   ?? "codekids",
      data:    { url: data.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus().then((c) => c.navigate(url));
      return clients.openWindow(url);
    })
  );
});

// ── Cache helpers ─────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response("Hors-ligne — contenu non disponible", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
