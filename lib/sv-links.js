/*!
 * sv-links — search text-id → ग्रन्थाः reading view: which reading view carries a text, the verse ref of an index block,
 * the reading-view file + #v-<ref> anchor it lands on, the commentary lane to open, and the layer label.
 * ONE copy, loaded by the full search tool (search.html) AND the in-text search on every reading page (vv-insearch.js),
 * so the two can never disagree about which hits belong to a text or where they land. (Extracted 2026-10-13.)
 * Any NEW ग्रन्थाः text must be added here + indexed (CLAUDE.md #7e). DOM-free; window.SVLinks (+ module.exports for Node).
 */
(function (root) {
  'use strict';
  // search text-id → the reading-view slug ("reading-<out>[-N].html")
  var SVADHYAYA = {'bg-bhashya':'gita','isha-bhashya':'isha','kena-pada-bhashya':'kena','kena-vakya-bhashya':'kena',
    'katha-bhashya':'kathaka','prashna-bhashya':'prashna','mundaka-bhashya':'mundaka','mandukya-bhashya':'mandukya',
    'taittiriya-bhashya':'taitiriya','aitareya-bhashya':'aitareya','chandogya-bhashya':'chandogya','brihad-bhashya':'brha',
    'brahmasutra-bhashya':'bs','vivekacudamani':'vc','panchadashi-ramkrishna':'pd','panchadashi-modak-tika':'pd',
    'vicharasagara':'vicharasagara','atmabodha':'ab','upadesha-saram':'ups','saddarshanam':'sad',
    'vrk-gita-upanishads':'vrk-gita-upanishads','vaiyasika-nyayamala':'bs','brihad-vartika':'brha','taittiriya-vartika':'taitiriya',
    'brihad-vartika-tika':'brha','brihadaranyaka-vartika-sara':'brha','nyayanirnaya':'bs',
    // Ānandagiri-ṭīkā: every upaniṣad/Gītā reading view carries it as the 'tika' lane (2026-10-10) — except the Kena
    // vākya-bhāṣya ṭīkā (the Kena view has only the pada-bhāṣya), so anandagiri-kena-vakya gets no link
    'anandagiri-isha':'isha','anandagiri-kena-pada':'kena','anandagiri-katha':'kathaka',
    'anandagiri-prashna':'prashna','anandagiri-mundaka':'mundaka','anandagiri-mandukya':'mandukya','anandagiri-taittiriya':'taitiriya',
    'anandagiri-aitareya':'aitareya','anandagiri-chandogya':'chandogya','anandagiri-brihad':'brha','anandagiri-gita':'gita',
    // Gītā commentaries on the VERSE — lanes of the Gītā view since 2026-10-21 (index blocks per verse, our refs)
    'sridhari-gita':'gita','madhusudani-gita':'gita','nilakanthi-gita':'gita','dhanapati-gita':'gita'};
  // commentary-lane texts: the reading view shows them only when that commentary is chosen → the link carries
  // ?side=<lane> (+ &vk=<fold-out id> for a vārttika-ṭīkā note) so the page's highlighter opens the lane first.
  var SV_SIDE = {'nyayanirnaya':'tika','vaiyasika-nyayamala':'vnm','brihad-vartika':'vartika','taittiriya-vartika':'vartika','brihad-vartika-tika':'vartika','brihadaranyaka-vartika-sara':'vsara',
    'sridhari-gita':'sridhara','madhusudani-gita':'madhusudana','nilakanthi-gita':'nilakantha','dhanapati-gita':'dhanapati'};
  for (var t in SVADHYAYA) if (t.indexOf('anandagiri-') === 0) SV_SIDE[t] = 'tika';
  // a lane that is one SECTION of a mixed index (bg-bhashya's Ānandagiri) — opened only for hits in that section
  var SV_SECTION_SIDE = {'bg-bhashya': {anandagiri: 'tika', bhashyarka: 'bhashyarka'}};
  // sections a reading view actually carries — a hit in any other section of the same index (the Gītā view has no
  // Anubhūtisvarūpa) gets NO link: it would land on a page without the matched text. Bhāṣyārka-prakāśa: a Gītā lane since
  // 2026-10-13; its index blocks are per VERSE (build_bg_index.py bhashyarka_by_verse — the PDF page's verse would be wrong).
  var SV_SECTIONS = {'bg-bhashya': {mula: 1, bhashya: 1, anandagiri: 1, bhashyarka: 1}};

  function outOf(b) { var o = SVADHYAYA[b.t]; if (!o) return null; if (SV_SECTIONS[b.t] && !SV_SECTIONS[b.t][b.c.section]) return null; return o; }
  // Reconstruct a block's verse ref from its int fields (adhyaya.valli.mantra / chapter.verse / verse) — this equals the
  // reading view's id="v-<ref>" anchor. `texts` = the index's texts table (field definitions).
  function svRef(b, texts) {
    // Ānandagiri refs are codes: BR_C02_S01_V20_B07 → 2.1.20, MK_C03_K15 → '3.15 · kārikā', *_I## (an intro) → chapter only
    if (b.t.indexOf('anandagiri-') === 0) {
      var m = String(b.c.ref || '').match(/_C(\d+)(?:_S(\d+))?(?:_([VvK])(\d+))?/); if (!m) return null;
      var p = [+m[1]]; if (m[2]) p.push(+m[2]); if (m[4]) p.push(+m[4]);
      return p.join('.') + (m[3] === 'K' ? ' · kārikā' : '');
    }
    if (b.c.sv) return b.c.sv;   // a precomputed reading-view anchor (AS vārttikas: AS numbering ≠ the lane's — build_vartika_index.py; vārtikasāra intro)
    var flds = ((texts || {})[b.t] || {}).fields || [], parts = [];
    for (var i = 0; i < flds.length; i++) { var f = flds[i];
      if (f.type === 'int' && f.k !== 'page' && b.c[f.k] != null) parts.push(b.c[f.k]);
      else if (f.type === 'vrange' && Array.isArray(b.c[f.k]) && b.c[f.k][0] != null) parts.push(b.c[f.k][0]);   // [45,47] → its first verse
    }
    return parts.length ? parts.join('.') : null;
  }
  // Resolve a ref to its reading-view file: exact anchor if present, else the file of the nearest ref sharing the longest
  // leading prefix (same chapter) — so a bhāṣya-span block still lands on the right chapter page.
  function svFile(idx, ref) {
    if (idx[ref]) return {file: idx[ref], exact: true};
    if (idx[ref + ' · kārikā']) return {file: idx[ref + ' · kārikā'], exact: true, ref: ref + ' · kārikā'};   // Māṇḍūkya prakaraṇa 2–4: only kārikās
    // ref shorter than the anchors (a chapter-level block: introductory bhāṣya / sambandha, ref "2" vs "2.1.1"; SD's "0" vs "0.1")
    // → that chapter's file; it lives in the page's #v-intro section (try first), else the first verse under it (near)
    for (var k in idx) if (k.indexOf(ref + '.') === 0) return {file: idx[k], exact: false, near: k, chap: true};
    var p = ref.split('.');
    for (var n = p.length - 1; n >= 1; n--) { var pre = p.slice(0, n).join('.') + '.'; for (var k2 in idx) if (k2.indexOf(pre) === 0) return {file: idx[k2], exact: false}; }
    return null;
  }
  function sideOf(b) { return SV_SIDE[b.t] || (SV_SECTION_SIDE[b.t] || {})[b.c.section] || null; }
  // where a block lands: {out, ref, file, exact, side} or null (no reading view / page-indexed / unresolvable)
  function locate(b, texts, refidxAll) {
    var o = outOf(b); if (!o) return null;
    var ref = svRef(b, texts); if (ref == null) return null;
    var hit = svFile((refidxAll || {})[o] || {}, String(ref)); if (!hit) return null;
    return {out: o, ref: hit.ref || String(ref), file: hit.file, exact: hit.exact, near: hit.near || null, chap: !!hit.chap, side: sideOf(b)};
  }
  // the layer a reader sees the hit as (in-text search chips)
  function layerOf(b) {
    var t = b.t, s = b.c.section;
    if (t === 'brihad-vartika' || t === 'taittiriya-vartika') return 'वार्त्तिकम्';
    if (t === 'brihad-vartika-tika') return 'शास्त्रप्रकाशिका';
    if (t === 'brihadaranyaka-vartika-sara') return s === 'tika' ? 'वार्तिकसार-टीका' : 'वार्तिकसारः';
    if (t === 'vaiyasika-nyayamala') return 'न्यायमाला';
    if (s === 'bhashyarka') return 'भाष्यार्कप्रकाशः';
    if (t === 'sridhari-gita') return 'श्रीधरी';
    if (t === 'madhusudani-gita') return 'मधुसूदनी';
    if (t === 'nilakanthi-gita') return 'नीलकण्ठी';
    if (t === 'dhanapati-gita') return 'भाष्योत्कर्षदीपिका';
    if (t === 'panchadashi-modak-tika') return 'टीका';
    if (t.indexOf('anandagiri-') === 0 || s === 'anandagiri') return 'टीका';
    if (s === 'mula') return 'मूलम्';
    if (s === 'bhashya' || s === 'intro') return 'भाष्यम्';
    if (s === 'bhasya') return t === 'atmabodha' ? 'टीका' : 'भाष्यम्';   // AB Padmapāda = ṭīkā; US Gaṇapati Muni / SD Kapālī Śāstrī = bhāṣya
    if (s === 'vyakhya' || s === 'tika') return 'टीका';
    return 'पाठः';
  }
  var LAYER_ORDER = ['मूलम्', 'भाष्यम्', 'टीका', 'भाष्यार्कप्रकाशः', 'भाष्योत्कर्षदीपिका', 'श्रीधरी', 'नीलकण्ठी', 'मधुसूदनी', 'वार्त्तिकम्', 'शास्त्रप्रकाशिका', 'वार्तिकसारः', 'वार्तिकसार-टीका', 'न्यायमाला', 'पाठः'];
  function idsFor(out) { return Object.keys(SVADHYAYA).filter(function (id) { return SVADHYAYA[id] === out; }); }

  var api = {SVADHYAYA: SVADHYAYA, SV_SIDE: SV_SIDE, SV_SECTION_SIDE: SV_SECTION_SIDE, SV_SECTIONS: SV_SECTIONS,
    outOf: outOf, svRef: svRef, svFile: svFile, sideOf: sideOf, locate: locate, layerOf: layerOf, LAYER_ORDER: LAYER_ORDER, idsFor: idsFor};
  root.SVLinks = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
