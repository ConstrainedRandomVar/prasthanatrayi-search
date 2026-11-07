// Two caches (2026-10-10, Harsha: a page-only deploy re-downloaded the whole ~12 MB-gzipped index):
//  • DATA_CACHE (persistent, never renamed) — CONTENT-HASHED files (index_manifest.<hash>.js, svadhyaya-refidx.<hash>.js, and
//    the per-text index shards shards/<id>.<hash>.json — a deploy re-fetches only the shards whose text changed).
//    A hashed name can never be stale (new content ⇒ new name), so they are cache-first and SURVIVE deploys; on
//    activate only names no longer in HASHED_KEEP are pruned. A deploy that doesn't change the index costs ~40 KB.
//  • CACHE_NAME (bumped on every deploy by searchtool/sync_search.js) — the small shell (index.html, viewer, lib,
//    font) + scan-PDF shards, cache-first; `activate` deletes the old one and index.html's controllerchange
//    handler reloads the page once, so a deploy still lands automatically.
// sync_search.js rewrites CACHE_NAME and HASHED_KEEP — keep both on one line each.
const CACHE_NAME = 'sanskrit-search-v100';
const DATA_CACHE = 'sanskrit-search-data';
const HASHED_KEEP = ["index_manifest.dd882f8f1d.js","svadhyaya-refidx.caa1fbe23b.js","abhinava-chandogya.0b9b113712.json","advaita-makaranda.752f9353c5.json","aitareya-bhashya.6fc53005a4.json","anandagiri-aitareya.2031d7bbad.json","anandagiri-brihad.8a72cb73a9.json","anandagiri-chandogya.065df016f0.json","anandagiri-gita.74f0be5d36.json","anandagiri-isha.66caebeea2.json","anandagiri-katha.8d2e1fd323.json","anandagiri-kena-pada.9cfc1c1f0e.json","anandagiri-kena-vakya.251936a9b6.json","anandagiri-mandukya.d1800fd1bf.json","anandagiri-mundaka.633be33aa8.json","anandagiri-prashna.997b9c7189.json","anandagiri-taittiriya.eb4c407253.json","anubhutiprakasha.fce7d5ed25.json","atmabodha.ec72e285c0.json","bg-bhashya.9c3bf15df1.json","brahmasutra-bhashya.73ab295488.json","brahmatattvaprakashika.26215d9171.json","brihad-bhashya.142a542901.json","brihad-vartika-tika.a1442f4614.json","brihad-vartika.37577f9653.json","brihadaranyaka-vartika-sara.c5d6fd4f8d.json","chandogya-bhashya.8a81933c83.json","dakshinamurti-stotra.824c9cfe52.json","dhanapati-gita.ed2d62443a.json","hastamalakiya-bhashya.d1222948c7.json","isha-bhashya.df50f3133a.json","katha-bhashya.418a626806.json","kena-pada-bhashya.3488c83c3d.json","kena-vakya-bhashya.f1930976fb.json","madhusudani-gita.ea24b43fcc.json","mandukya-bhashya.1236a11c6b.json","maniprabha-aitareya.a0db0effe1.json","maniprabha-isha.8d83f561d9.json","maniprabha-katha.39f4a200db.json","maniprabha-kena.bfc5e266b4.json","maniprabha-mandukya.33f4be5c83.json","maniprabha-mundaka.5ca5071e61.json","maniprabha-prashna.f19c6f80a8.json","maniprabha-taittiriya.7a0ab1fe57.json","mitakshara-brihad.cee7cd32be.json","mitakshara-chandogya.76c43a6948.json","mundaka-bhashya.ae7ed04071.json","naishkarmyasiddhi.800c1fa2ad.json","nilakanthi-gita.d2799750a3.json","nyayanirnaya.44f252fc6e.json","panchadashi-modak-tika.510b220665.json","panchadashi-ramkrishna.bd0ff16ebd.json","prashna-bhashya.ac19dd4e95.json","purnanandi.36127ff2dd.json","ratnaprabha.8f6e51af75.json","saddarshanam.02ba7b6256.json","sarvavedantasiddhantasarasangraha.1fc34d7eeb.json","shankaranandi-gita.06a7ceff78.json","shatashloki.a2e3b06c0e.json","siddhantabindu.bd0ae943bd.json","sridhari-gita.1b808c7bd3.json","taittiriya-bhashya.aec1db501e.json","taittiriya-vartika.1656e2705b.json","upadesha-saram.6c67bece4d.json","upadeshasahasri.3e1fcae6f2.json","vaiyasika-nyayamala.52bc82760b.json","vanamala-taittiriya.6d51adf599.json","vedantasara.eca9731f34.json","vicharasagara.607dcea2cc.json","vivekacudamani.d5b1738d09.json","vrk-gita-upanishads.da4f10923c.json"];
const ASSETS = ['./', './index.html', './viewer.html', './lib/sanskrit-search.js', './lib/sv-links.js', './fonts/NotoSerifDevanagari-Regular.woff2'];
const HASHED = /\.[0-9a-f]{10}\.(js|json)$/;   // index_manifest/refidx .js + the per-text index shards (shards/*.json, 2026-10-12)

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
