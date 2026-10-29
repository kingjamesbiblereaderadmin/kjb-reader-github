# KJB Reader — PCE pronunciation audit

## Scope and status

Full-source text and vocabulary audit of the PCE Bible bundled in Android assets. The NVIDIA TTS endpoint was successfully smoke-tested and a short sample using the app pronunciation hints is bundled at `public/audio/audit/pronunciation-candidates.wav`. The sample is a synthesis check, not a human listening sign-off. Candidate words are not confirmed errors.

## Integrity checks

- Source size: 4.14 MiB
- Source lines: 33863
- Canonical books represented: 66/66
- Chapter headings: 1189 / expected 1189
- Reconstructed verses: 31102 / expected 31102
- Starts at Genesis 1: true
- Ends at Revelation 22: true
- Structural integrity check: true

## Vocabulary findings

- Unique word forms: 12577
- Total word occurrences: 792818
- Hyphenated forms: 266
- Long forms (12+ alphabetic letters): 428
- Rare forms (3 or fewer occurrences, 6+ letters): 5430
- Combined heuristic review candidates: 8767

## Priority pronunciation candidates

| Word | Occurrences | Sample references |
|---|---:|---|
| nebuchadnezzar | 60 | 2 Kings 24:1; 2 Kings 24:10; 2 Kings 24:11 |
| beer-sheba | 34 | Genesis 21:14; Genesis 21:31; Genesis 21:32 |
| ahasuerus | 31 | Ezra 4:6; Esther 1:1; Esther 1:2 |
| mizpah | 23 | Genesis 31:49; 1 Kings 15:22; 2 Kings 25:23 |
| mizpeh | 23 | Joshua 11:3; Joshua 11:8; Joshua 15:38 |
| zerubbabel | 22 | 1 Chronicles 3:19; Ezra 2:2; Ezra 3:2 |
| capernaum | 16 | Matthew 4:13; Matthew 8:5; Matthew 11:23 |
| artaxerxes | 15 | Ezra 4:7; Ezra 4:8; Ezra 4:11 |
| mephibosheth | 15 | 2 Samuel 4:4; 2 Samuel 9:6; 2 Samuel 9:10 |
| sennacherib | 13 | 2 Kings 18:13; 2 Kings 19:16; 2 Kings 19:20 |
| jehoiachin | 11 | 2 Kings 24:6; 2 Kings 24:8; 2 Kings 24:12 |
| melchisedec | 9 | Hebrews 5:6; Hebrews 5:10; Hebrews 6:20 |
| chedorlaomer | 5 | Genesis 14:1; Genesis 14:4; Genesis 14:5 |
| melchizedek | 2 | Genesis 14:18; Psalms 110:4 |
| shalmaneser | 2 | 2 Kings 17:3; 2 Kings 18:9 |
| tirhakah | 2 | 2 Kings 19:9; Isaiah 37:9 |
| kirjath | 1 | Joshua 18:28 |
| nebushasban | 1 | Jeremiah 39:13 |
| shibboleth | 1 | Judges 12:6 |
| zaphnath-paaneah | 1 | Genesis 41:45 |

## Report files

- unique-words.csv/json/txt: full vocabulary inventory
- pronunciation-review-candidates.json: combined review queue
- hyphenated-words.json, long-words.json, rare-words.json: focused candidate sets
- known-name-review.csv/json: priority biblical-name shortlist

## Audio smoke test

- TTS request succeeded for a six-second pronunciation sample using the app’s speech-only respelling rules.
- WAV format: 22,050 Hz, mono, 16-bit PCM.
- Sample path: `public/audio/audit/pronunciation-candidates.wav`; copied into web build, Android assets, and iOS assets by Capacitor sync.
- Test words: Nebuchadnezzar, Mephibosheth, Chedorlaomer, Zaphnath-paaneah, and Beer-sheba.

## Remaining limitation

The sample has not been independently listened to by a human reviewer, so pronunciation is not marked verified. The complete Bible narration has not been generated. Full pre-bundling as WAV would create a multi-gigabyte app; the current reader synthesizes chunks and caches played audio locally for subsequent offline listening where device storage allows.
