# KJB Reader — PCE pronunciation audit

## Scope and status

Full-source text and vocabulary audit of the PCE Bible bundled in Android assets. This is not a completed human listening audit; no synthesized samples were listened to during this run. Candidate words are not confirmed errors.

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

## Remaining limitation

Audio pronunciation cannot be marked verified until representative passages are synthesized through NVIDIA TTS and listened to by a reviewer. This report does not claim flagged names are mispronounced and does not include a complete Bible narration audio file.
