// Service Worker — CodeKids
//
// Trois caches, trois raisons :
//
//   Pyodide    ~10 Mo venus du CDN, immuables. Cache-First permanent : une fois
//              téléchargés, l'éditeur Python tourne sans réseau.
//   /_next/static  les fichiers de l'application. Ils portent un hash de contenu,
//              donc ils ne changent jamais sous le même nom — Cache-First sans
//              risque. Ils étaient laissés au cache HTTP du navigateur, qui ne
//              garde que ce qu'il a déjà vu et l'évince quand il veut : une page
//              jamais ouverte en ligne n'avait pas son code, et ne s'ouvrait pas.
//   Pages élève  Network-First avec repli sur le cache. L'enfant retrouve hors
//              ligne tout ce qu'il a déjà ouvert : sa quête, ses entraînements,
//              sa salle de jeu, son accueil.
//
// Le cache des pages est volontairement borné : au-delà, un enfant qui a tout
// parcouru remplirait le stockage du téléphone familial.

const PYODIDE_CACHE = "pyodide-v0.27";
const APP_CACHE     = "codekids-app-v1";
const LESSON_CACHE  = "codekids-lessons-v4";

const PYODIDE_ORIGIN = "https://cdn.jsdelivr.net";
const MAX_PAGES = 60;

const ALLOWED_CACHES = new Set([PYODIDE_CACHE, APP_CACHE, LESSON_CACHE]);

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !ALLOWED_CACHES.has(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  // Seules les lectures se mettent en cache. Une action serveur est un POST :
  // l'intercepter casserait l'envoi, et `cache.put` refuse de toute façon.
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // Pyodide — Cache-First permanent
  if (url.origin === PYODIDE_ORIGIN && url.pathname.includes("pyodide")) {
    e.respondWith(cacheFirst(e.request, PYODIDE_CACHE));
    return;
  }

  // Rien d'autre venu d'ailleurs : on ne met pas en cache le monde entier.
  if (url.origin !== self.location.origin) return;

  // Les fichiers de l'application — hashés, donc immuables sous ce nom.
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(cacheFirst(e.request, APP_CACHE));
    return;
  }

  // Les pages de l'espace élève — et seulement elles. Le backoffice n'a aucune
  // raison de fonctionner hors ligne, et son contenu change tout le temps.
  if (/\/eleve(\/|$)/.test(url.pathname)) {
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
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    // Hors ligne et jamais vu : on rend une réponse plutôt que de laisser
    // l'exception remonter, ce qui afficherait l'écran d'erreur du navigateur.
    return new Response("", { status: 504, statusText: "Hors-ligne" });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      limiter(cache, MAX_PAGES);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(
      "<!doctype html><meta charset=utf-8><title>Hors-ligne</title>" +
      "<div style=\"font-family:system-ui;text-align:center;padding:3rem;color:#334155\">" +
      "<div style=\"font-size:3rem\">📡</div>" +
      "<h1 style=\"font-size:1.1rem\">Cette page n'est pas encore disponible hors ligne</h1>" +
      "<p style=\"font-size:.9rem\">Ouvre-la une fois avec du réseau, et elle restera accessible ensuite.</p></div>",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

/** Garde le cache des pages borné : on jette les plus anciennes entrées. */
async function limiter(cache, max) {
  const keys = await cache.keys();
  if (keys.length <= max) return;
  for (const k of keys.slice(0, keys.length - max)) await cache.delete(k);
}
