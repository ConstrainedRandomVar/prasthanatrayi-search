// Cache-first + auto-reload — the DEFAULT good state for the search site (Harsha, 2026-08-18: it
// needn't be network-first). Fast repeat loads (the big index_data.js/pages.js/scan-PDF shards are
// served from cache), AND a new deploy still lands automatically: `activate` deletes the old
// CACHE_NAME cache and index.html's controllerchange handler reloads the page once, so the reload
// re-fetches everything fresh. So: always bump CACHE_NAME on every deploy (esp. after index_data.js
// changes). Shell precached; big files cache reactively on first fetch (first visit isn't doubled).
const CACHE_NAME = 'sanskrit-search-v21';
const ASSETS = ['./', './index.html', './viewer.html', './lib/sanskrit-search.js', './fonts/NotoSerifDevanagari-Regular.woff2'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {}));
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
    caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
