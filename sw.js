// Cache-first service worker for the Sanskrit Search site — makes repeat visits instant + offline.
// Precaches only the tiny shell; the big index_data.js, the library, and any scan-PDF shards a
// visitor opens are cached REACTIVELY on first fetch (so the first visit isn't doubled by a huge
// precache). Bump CACHE_NAME whenever a shipped file changes — especially index_data.js after any
// text is added/updated — so clients drop the stale cache and pick up the new data.
const CACHE_NAME = 'sanskrit-search-v18';
const ASSETS = ['./', './index.html', './viewer.html', './lib/sanskrit-search.js', './fonts/NotoSerifDevanagari-Regular.woff2'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return res;
    }).catch(() => cached))
  );
});
