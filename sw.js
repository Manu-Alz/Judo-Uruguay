/* Service worker: funciona sin seÃ±al en el dojo. Sube VERSION cuando publiques cambios. */
const VERSION = "judouy-v2";
const SHELL = ["./", "index.html", "css/styles.css", "js/data.js", "js/extra.js", "js/app.js", "icon.svg", "manifest.webmanifest"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))));
  self.clients.claim();
});
/* Red primero (asÃ­ ves los cambios), cachÃ© si no hay seÃ±al */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(VERSION).then((x) => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
