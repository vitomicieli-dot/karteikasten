/* Service Worker für den Karteikasten.
   Zweck: Die App startet auch ohne Internet. Es werden ausschließlich die
   Programmdateien und die Bilder zwischengespeichert — Karten und Lernstand
   liegen im localStorage und werden hier nicht angefasst. */

const CACHE = 'karteikasten-v18';

/* Ohne diese Dateien läuft die App nicht. Schlägt eine fehl, scheitert die
   Installation — das ist gewollt, ein halber Cache wäre schlimmer. */
const KERN = ['./', './index.html', './sw.js'];

/* Bilder sind Beiwerk. Sie werden mit vorgeladen, damit sie auch offline da
   sind, dürfen die Installation aber nicht zum Scheitern bringen — sonst
   legt ein einziger Tippfehler im Dateinamen die ganze App lahm. */
const BILDER = [
  './bilder/schneidkeil.png',
  './bilder/spanarten.png',
  './bilder/spanentstehung.png',
  './bilder/verschleiss.png',
  './bilder/break-even.png',
  './bilder/regelkreis.jpg',
  './bilder/heizkreis.jpg',
  './bilder/bearbeitungszentrum.jpg',
  './bilder/portfolio-matrix.jpg',
  './bilder/portfolio-beispiel.jpg',
  './bilder/swot-profil.jpg',
  './bilder/eu-institutionen.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(KERN);
    await Promise.all(BILDER.map(u => c.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
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
