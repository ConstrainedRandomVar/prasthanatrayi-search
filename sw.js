// Two caches (2026-10-10, Harsha: a page-only deploy re-downloaded the whole ~12 MB-gzipped index):
//  • DATA_CACHE (persistent, never renamed) — CONTENT-HASHED files (index_data.<hash>.js, svadhyaya-refidx.<hash>.js).
//    A hashed name can never be stale (new content ⇒ new name), so they are cache-first and SURVIVE deploys; on
//    activate only names no longer in HASHED_KEEP are pruned. A deploy that doesn't change the index costs ~40 KB.
//  • CACHE_NAME (bumped on every deploy by searchtool/sync_search.js) — the small shell (index.html, viewer, lib,
//    font) + scan-PDF shards, cache-first; `activate` deletes the old one and index.html's controllerchange
//    handler reloads the page once, so a deploy still lands automatically.
// sync_search.js rewrites CACHE_NAME and HASHED_KEEP — keep both on one line each.
const CACHE_NAME = 'sanskrit-search-v54';
const DATA_CACHE = 'sanskrit-search-data';
const HASHED_KEEP = ["index_data.4836315057.js","svadhyaya-refidx.3d5874e435.js"];
const ASSETS = ['./', './index.html', './viewer.html', './lib/sanskrit-search.js', './fonts/NotoSerifDevanagari-Regular.woff2'];
const HASHED = /\.[0-9a-f]{10}\.js$/;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME && k !== DATA_CACHE).map(k => caches.delete(k)));
    const data = await caches.open(DATA_CACHE), keep = new Set(HASHED_KEEP);
    for (const req of await data.keys()) if (!keep.has(new URL(req.url).pathname.split('/').pop())) await data.delete(req);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const base = new URL(event.request.url).pathname.split('/').pop();
  const store = HASHED.test(base) ? DATA_CACHE : CACHE_NAME;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(store).then(cache => cache.put(event.request, copy)).catch(() => {}); }
      return res;
    }).catch(() => cached))
  );
});
