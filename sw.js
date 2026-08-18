// NETWORK-FIRST service worker (Harsha, 2026-08-18: "always force full reload during churn — never
// mind slowness FOR NOW"). Online always takes the freshest file; the cache is only an offline
// fallback. Paired with index.html's controllerchange auto-reload + updateViaCache:'none' so a new
// deploy is picked up automatically, no manual cache-clear. NOTE: revert to cache-first (fast repeat
// loads) once the churn settles — network-first re-fetches index_data.js (~6.6 MB gzip) etc. every
// online visit, which is heavy for public users. Bump CACHE_NAME on deploy.
const CACHE_NAME = 'sanskrit-search-v19';
const SHELL = ['./', './index.html'];   // minimal offline shell; everything else caches reactively

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(event.request))   // offline only
  );
});
