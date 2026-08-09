# Prasthānatrayī Sandhi-Tolerant Search

A free, static, offline-capable search tool over the Prasthānatrayī (Upaniṣads,
Bhagavad Gītā, Brahma-sūtra) with Śaṅkara's bhāṣya, Ānandagirī's ṭīkā, and Sureśvara's
vārtikas — 42,000+ searchable passages across 30 works.

**Live**: https://constrainedrandomvar.github.io/prasthanatrayi-search/

Type a query in ITRANS, IAST, or Devanāgarī — the search is space-, orthography-, and
**sandhi-tolerant**, so it finds a word regardless of how it's fused with its neighbors
in the running text (e.g. searching `devaH` also matches `devo'stu`, `devaśca`, etc.).
Every result links back to the original passage on
[advaitasharada.sringeri.net](https://advaitasharada.sringeri.net/) (Sringeri Śāradā
Pīṭham's own digital edition), scrolled and highlighted to the exact matched text where
the site supports it.

## What's indexed

- **Mūla + Śaṅkara-bhāṣya**: all 10 principal Upaniṣads (Aitareya, Bṛhadāraṇyaka,
  Chāndogya, Īśāvāsya, Kaṭha, Kena [pada and vākya portions], Māṇḍūkya with Gauḍapāda's
  kārikā, Muṇḍaka, Praśna, Taittirīya), Brahma-sūtra, and Bhagavad Gītā.
- **Ānandagirī's ṭīkā** on each of the above bhāṣyas (12 works).
- **Sureśvara's vārtikas** on Bṛhadāraṇyaka- and Taittirīya-bhāṣya.
- Three shorter prakaraṇa works: Vivekacūḍāmaṇi, Hastāmalakīya (with bhāṣya),
  Śatashlokī, Sarva-vedānta-siddhānta-sāra-saṅgraha.

## Sources and attribution

- The mūla verses and Śaṅkara's bhāṣya for the Upaniṣads, Brahma-sūtra, and Bhagavad
  Gītā are sourced from the **Prasthānatrayī digital reader** dataset — Tamal Maharaj,
  *A Word-Level Digital Reader of the Prasthānatrayī with Śaṅkara's Bhāṣya* (2026),
  licensed **CC-BY-4.0**.
- Ānandagirī's ṭīkā and Sureśvara's vārtikas are sourced directly from
  **[advaitasharada.sringeri.net](https://advaitasharada.sringeri.net/)**, the digital
  edition maintained by Sringeri Śāradā Pīṭham — reproduced here for offline sandhi-
  tolerant search only; every result links back to the original page on their site for
  full context, further reading, and the authoritative text.
- All underlying texts (mūla, bhāṣya, ṭīkā, vārtika) are ancient/pre-modern works in the
  **public domain**.
- The search engine itself (`lib/sanskrit-search.js`) is original code from the
  [devanagari-rescue](https://github.com/ConstrainedRandomVar/devanagari-rescue) project.

If any attribution here is missing, incomplete, or you'd like content removed, please
open an issue.

## Running locally

This is a fully static site — no build step, no server. Just open `index.html` in a
browser, or serve the directory with any static file server.
