// Two caches (2026-10-10, Harsha: a page-only deploy re-downloaded the whole ~12 MB-gzipped index):
//  • DATA_CACHE (persistent, never renamed) — CONTENT-HASHED files (index_manifest.<hash>.js, svadhyaya-refidx.<hash>.js, and
//    the per-text index shards shards/<id>.<hash>.json — a deploy re-fetches only the shards whose text changed).
//    A hashed name can never be stale (new content ⇒ new name), so they are cache-first and SURVIVE deploys; on
//    activate only names no longer in HASHED_KEEP are pruned. A deploy that doesn't change the index costs ~40 KB.
//  • CACHE_NAME (bumped on every deploy by searchtool/sync_search.js) — the small shell (index.html, viewer, lib,
//    font) + scan-PDF shards, cache-first; `activate` deletes the old one and index.html's controllerchange
//    handler reloads the page once, so a deploy still lands automatically.
// sync_search.js rewrites CACHE_NAME and HASHED_KEEP — keep both on one line each.
const CACHE_NAME = 'sanskrit-search-v83';
const DATA_CACHE = 'sanskrit-search-data';
const HASHED_KEEP = ["index_manifest.c3754e20db.js","svadhyaya-refidx.3d5874e435.js","advaita-makaranda.752f9353c5.json","aitareya-bhashya.3ddd34c7e3.json","anandagiri-aitareya.2031d7bbad.json","anandagiri-brihad.8a72cb73a9.json","anandagiri-chandogya.065df016f0.json","anandagiri-gita.74f0be5d36.json","anandagiri-isha.66caebeea2.json","anandagiri-katha.acbcbeeeac.json","anandagiri-kena-pada.8904f4728f.json","anandagiri-kena-vakya.251936a9b6.json","anandagiri-mandukya.d1800fd1bf.json","anandagiri-mundaka.633be33aa8.json","anandagiri-prashna.997b9c7189.json","anandagiri-taittiriya.397297326a.json","anubhutiprakasha.fce7d5ed25.json","atmabodha.ec72e285c0.json","bg-bhashya.d105836438.json","brahmasutra-bhashya.b1d0e32c0d.json","brahmatattvaprakashika.26215d9171.json","brihad-bhashya.e8317fef90.json","brihad-vartika-tika.a1442f4614.json","brihad-vartika.37577f9653.json","brihadaranyaka-vartika-sara.c5d6fd4f8d.json","chandogya-bhashya.c22dc5c14b.json","dakshinamurti-stotra.824c9cfe52.json","dhanapati-gita.ed2d62443a.json","hastamalakiya-bhashya.d1222948c7.json","isha-bhashya.df50f3133a.json","katha-bhashya.cb7b0ad153.json","kena-pada-bhashya.a943ac108b.json","kena-vakya-bhashya.f1930976fb.json","madhusudani-gita.ea24b43fcc.json","mandukya-bhashya.967ece19fd.json","mundaka-bhashya.598a2767bc.json","naishkarmyasiddhi.800c1fa2ad.json","nilakanthi-gita.d2799750a3.json","nyayanirnaya.44f252fc6e.json","panchadashi-modak-tika.510b220665.json","panchadashi-ramkrishna.bd0ff16ebd.json","prashna-bhashya.983ce99e16.json","purnanandi.36127ff2dd.json","ratnaprabha.8f6e51af75.json","saddarshanam.02ba7b6256.json","sarvavedantasiddhantasarasangraha.1fc34d7eeb.json","shankaranandi-gita.06a7ceff78.json","shatashloki.a2e3b06c0e.json","siddhantabindu.bd0ae943bd.json","sridhari-gita.1b808c7bd3.json","taittiriya-bhashya.379d11ae3c.json","taittiriya-vartika.1656e2705b.json","upadesha-saram.6c67bece4d.json","upadeshasahasri.3e1fcae6f2.json","vaiyasika-nyayamala.52bc82760b.json","vanamala-taittiriya.6d51adf599.json","vedantasara.eca9731f34.json","vicharasagara.607dcea2cc.json","vivekacudamani.d5b1738d09.json","vrk-gita-upanishads.da4f10923c.json"];
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
