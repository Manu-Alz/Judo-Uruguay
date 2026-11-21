/* Service worker: la app funciona sin senal en el dojo. Subir VERSION al publicar cambios grandes. */
const VERSION = "judouy-v8";
const SHELL = ["./", "index.html", "css/styles.css", "js/data.js", "js/extra.js", "js/vocab.js", "js/videos.js", "js/config.js", "js/auth.js", "js/app.js", "icon.svg", "manifest.webmanifest"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))));
  self.clients.claim();
});
/* Red primero (asi se ven los cambios), cache si no hay senal */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const c = r.clone(); caches.open(VERSION).then((x) => x.put(e.request, c)); } return r; }).catch(() => caches.match(e.request)));
});
