const CACHE = 'pwa-dashboard-v1';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  '/lib/react.min.js',
  '/lib/react-dom.min.js',
  '/lib/babel.min.js',
  '/lib/tailwind.js',
  './android-chrome-192x192.png',
  './android-chrome-512x512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('dashboard-') && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  const isDocument = request.mode === 'navigate' || /\.html$/.test(url.pathname);
  if (isDocument) {
    event.respondWith(
      caches.match(request).then(cached => {
        const network = fetch(request)
          .then(response => {
            if (response?.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
            return response;
          })
          .catch(() => null);
        return cached || network.then(response => response || caches.match('./index.html'));
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response?.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    }))
  );
});
