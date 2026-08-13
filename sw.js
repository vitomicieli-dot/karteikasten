/* Service Worker für den Karteikasten.
   Zweck: Die App startet auch ohne Internet. Es werden ausschließlich die
   Programmdateien zwischengespeichert — Karten und Lernstand liegen im
   localStorage und werden hier nicht angefasst. */

const CACHE = 'karteikasten-v2';
const DATEIEN = ['./', './index.html', './sw.js'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(DATEIEN))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Netzwerk zuerst, Cache als Rückfall: So bekommst du eine neue Fassung der
   App, sobald du online bist, kannst aber offline weiterlernen. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        /* Nur erfolgreiche Antworten merken. Sonst landet eine Fehlerseite des
           Servers im Cache und wird offline anstelle der App ausgeliefert. */
        if (res && res.ok && res.type !== 'opaque') {
          const kopie = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, kopie));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
