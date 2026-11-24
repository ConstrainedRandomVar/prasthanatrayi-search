// Two caches (2026-10-10, Harsha: a page-only deploy re-downloaded the whole ~12 MB-gzipped index):
//  • DATA_CACHE (persistent, never renamed) — CONTENT-HASHED files (index_manifest.<hash>.js, svadhyaya-refidx.<hash>.js, and
//    the per-text index shards shards/<id>.<hash>.json — a deploy re-fetches only the shards whose text changed).
//    A hashed name can never be stale (new content ⇒ new name), so they are cache-first and SURVIVE deploys; on
//    activate only names no longer in HASHED_KEEP are pruned. A deploy that doesn't change the index costs ~40 KB.
//  • CACHE_NAME (bumped on every deploy by searchtool/sync_search.js) — the small shell (index.html, viewer, lib,
//    font) + scan-PDF shards, cache-first; `activate` deletes the old one and index.html's controllerchange
//    handler reloads the page once, so a deploy still lands automatically.
// sync_search.js rewrites CACHE_NAME and HASHED_KEEP — keep both on one line each.
const CACHE_NAME = 'sanskrit-search-v124';
const DATA_CACHE = 'sanskrit-search-data';
const HASHED_KEEP = ["index_manifest.ee8f7ad5a5.js","svadhyaya-refidx.3cf77890b1.js","abhinava-chandogya.0b9b113712.json","advaita-makaranda.752f9353c5.json","aitareya-bhashya.6fc53005a4.json","anandagiri-aitareya.2031d7bbad.json","anandagiri-brihad.8a72cb73a9.json","anandagiri-chandogya.065df016f0.json","anandagiri-gita.74f0be5d36.json","anandagiri-isha.66caebeea2.json","anandagiri-katha.8d2e1fd323.json","anandagiri-kena-pada.9cfc1c1f0e.json","anandagiri-kena-vakya.251936a9b6.json","anandagiri-mandukya.d1800fd1bf.json","anandagiri-mundaka.633be33aa8.json","anandagiri-prashna.997b9c7189.json","anandagiri-taittiriya.eb4c407253.json","anubhutiprakasha.fce7d5ed25.json","atmabodha.ec72e285c0.json","bg-bhashya.faadfa38b8.json","brahmasutra-bhashya.66b4e7db25.json","brahmatattvaprakashika.5ca342eebf.json","brihad-bhashya.c4cdbb39d8.json","brihad-vartika-tika.70fe71d3b3.json","brihad-vartika.9223dccfb4.json","brihadaranyaka-vartika-sara.b29f3caea4.json","chandogya-bhashya.577ed0692c.json","dakshinamurti-stotra.824c9cfe52.json","dhanapati-gita.f54efa613a.json","drigdrishyaviveka.0456992a99.json","hastamalakiya-bhashya.d1222948c7.json","isha-bhashya.df50f3133a.json","katha-bhashya.418a626806.json","kena-pada-bhashya.3488c83c3d.json","kena-vakya-bhashya.f1930976fb.json","madhusudani-gita.ea24b43fcc.json","mandukya-bhashya.d09e5ab167.json","maniprabha-aitareya.97abe10397.json","maniprabha-isha.3aa636a7f2.json","maniprabha-katha.b366232f54.json","maniprabha-kena.711e48d73e.json","maniprabha-mandukya.021129da1e.json","maniprabha-mundaka.35bfaf15f0.json","maniprabha-prashna.2b5e6d5010.json","maniprabha-taittiriya.82a13df052.json","mitakshara-brihad.77dffc37c5.json","mitakshara-chandogya.daf478152b.json","mundaka-bhashya.d07bd1a0d2.json","naishkarmyasiddhi.800c1fa2ad.json","nilakanthi-gita.a8bfc0ed79.json","nyayanirnaya.44f252fc6e.json","panchadashi-modak-tika.510b220665.json","panchadashi-ramkrishna.bd0ff16ebd.json","prashna-bhashya.ac19dd4e95.json","purnanandi.36127ff2dd.json","ramanagita.4e6343f2ec.json","ratnaprabha.8f6e51af75.json","saddarshanam.02ba7b6256.json","sarvavedantasiddhantasarasangraha.1fc34d7eeb.json","shankaranandi-gita.26d809c62a.json","shatashloki.a2e3b06c0e.json","shvetashvatara-bhashya.7c11f88642.json","siddhantabindu.bd0ae943bd.json","sridhari-gita.1b808c7bd3.json","taittiriya-bhashya.d3301d708e.json","taittiriya-vartika.1656e2705b.json","upadesha-saram.6c67bece4d.json","upadeshasahasri.3e1fcae6f2.json","vaiyasika-nyayamala.52bc82760b.json","vanamala-taittiriya.6d51adf599.json","vedantasara.eca9731f34.json","vicharasagara.607dcea2cc.json","vivekacudamani.d5b1738d09.json","vrk-gita-upanishads.da4f10923c.json"];
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
