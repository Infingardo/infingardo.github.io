// Service worker della dashboard — PWA offline.
// Precache della shell (dashboard + librerie locali + icone); runtime-cache same-origin
// per le app: ogni app diventa disponibile offline dopo la prima apertura online.
const CACHE = 'dashboard-v1';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './lib/react.min.js',
  './lib/react-dom.min.js',
  './lib/babel.min.js',
  './lib/tailwind.js',
  './android-chrome-192x192.png',
  './android-chrome-512x512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // solo same-origin (la dashboard e tutte le app stanno qui)

  const isDoc = req.mode === 'navigate' || /\.html$/.test(url.pathname);
  if (isDoc) {
    // Network-first per i documenti: contenuto sempre aggiornato online, cache come fallback offline.
    e.respondWith(
      fetch(req)
        .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
        .catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
    );
  } else {
    // Cache-first per gli asset (js/css/png/woff2/json): disponibili offline dopo la prima visita.
    e.respondWith(
      caches.match(req).then(m => m || fetch(req).then(r => {
        if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
        return r;
      }))
    );
  }
});
