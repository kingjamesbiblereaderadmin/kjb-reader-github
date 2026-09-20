// Pure share/copy text builders for the reader — extracted from BibleReader
// so the page component stays lean. Each takes the reader's current context
// (verses, selection, book/position, search term, etc.) and returns the text
// that lands on the clipboard / the native share sheet.
import { formatVerseShare, buildVerseUrl, cleanVerseText, centerLine } from '@/lib/formatDailyVerse';
import { resolveSubscript } from '@/lib/bibleApi';
import { formatVerseRange } from '@/lib/readerHelpers';

// Text for the verses currently tapped in normal reading mode (VerseTapBar).
export function buildTapShareText({ tappedVerseNums, tappedVerseObjs, chapterSubscript, colophon, book, pos }) {
  if (!tappedVerseNums || tappedVerseNums.length === 0) return '';
  const first = tappedVerseNums[0], last = tappedVerseNums[tappedVerseNums.length - 1];
  const isFirst = first === 1;
  const isLast = tappedVerseObjs.length > 0 && last === parseInt(tappedVerseObjs[tappedVerseObjs.length - 1].verse, 10);
  const range = formatVerseRange(tappedVerseNums);
  // tappedVerseObjs[0].heading covers Psalm 119's per-verse acrostic headings
  // (ALEPH, BETH, ...), which chapterSubscript doesn't carry (it's null for
  // Ps119) — falls back to it so tapping e.g. v9 alone still shows "BETH".
  return formatVerseShare({
    text: tappedVerseObjs.map(v => v.text).join(' '),
    subscript: isFirst ? (chapterSubscript || null) : null,
    heading: tappedVerseObjs[0]?.heading || null,
    colophon: isLast ? (colophon || null) : null,
    ref: `${book.shortName} ${pos.chapter}:${range}`,
    url: buildVerseUrl({ abbr: pos.abbr, chapter: pos.chapter, verse: first, verseEnd: last > first ? last : undefined }),
  });
}

// Passage-style share text: selected verses grouped into consecutive ranges,
// joined with a divider line.
export function buildShareText({ verses, selectedVerses, selectedSections, book, pos, searchTerm, colophon }) {
  // Coerce verse numbers to ints — selectedVerses holds ints (from
  // toggleVerseSelect) while cached v.verse can be a string, so a plain
  // toUse.has(v.verse) match silently produced an empty selection and an
  // empty clipboard (copy "didn't work").
  const toUse = selectedVerses.size > 0 ? selectedVerses : new Set(verses.map(v => parseInt(v.verse, 10)));
  const verseInSel = (v) => toUse.has(parseInt(v.verse, 10));
  const selectedVersesList = verses.filter(verseInSel).sort((a, b) => parseInt(a.verse, 10) - parseInt(b.verse, 10));

  const groups = [];
  let group = [];
  selectedVersesList.forEach((v) => {
    const vn = parseInt(v.verse, 10);
    if (group.length === 0 || vn === parseInt(group[group.length - 1].verse, 10) + 1) {
      group.push(v);
    } else {
      groups.push(group);
      group = [v];
    }
  });
  if (group.length) groups.push(group);

  const chapterSubscript = resolveSubscript(book.apiName, pos.chapter) || null;
  const lastVerseNum = verses.length ? parseInt(verses[verses.length - 1].verse, 10) : null;
  // Subscript/colophon are included when explicitly selected (Select-mode tap)
  // or, when no section has been explicitly toggled, when their anchor verse
  // (1 / last) is in the selection — preserving the pre-tap behaviour.
  const anySectionToggled = selectedSections.size > 0;
  const wantSub = !!chapterSubscript && (selectedSections.has('subscript') || (!anySectionToggled && groups.some(g => g.some(v => parseInt(v.verse, 10) === 1))));
  const wantCol = !!colophon && (selectedSections.has('colophon') || (!anySectionToggled && groups.some(g => g.some(v => parseInt(v.verse, 10) === lastVerseNum))));
  const blocks = groups.map((g, gi) => {
    const nums = g.map(v => parseInt(v.verse, 10));
    const range = formatVerseRange(nums);
    const first = nums[0], last = nums[nums.length - 1];
    // g[0].heading covers Psalm 119's per-verse acrostic headings (ALEPH,
    // BETH, ...) — chapterSubscript is null for Ps119, and unlike it a
    // heading can start ANY group (not just the first), so check every
    // group's own first verse rather than gating on gi === 0.
    return formatVerseShare({
      text: g.map(v => cleanVerseText(v.text)).join(' '),
      subscript: gi === 0 && wantSub ? chapterSubscript : null,
      heading: g[0]?.heading || null,
      colophon: gi === groups.length - 1 && wantCol ? colophon : null,
      ref: `${book.shortName} ${pos.chapter}:${range}`,
      url: buildVerseUrl({ abbr: pos.abbr, chapter: pos.chapter, verse: first, verseEnd: last > first ? last : undefined, from: searchTerm ? 'search' : undefined }),
    });
  });
  return blocks.join('\n\n———\n\n');
}

// Per-verse copy: each selected verse's text on its own line, followed by a
// single combined reference at the end (not a ref per verse).
export function buildPerVerseText({ verses, selectedVerses, selectedSections, book, pos, searchTerm, colophon }) {
  // Coerce verse numbers to ints (see buildShareText) — cached v.verse can
  // be a string while selectedVerses holds ints, which broke the filter.
  const toUse = selectedVerses.size > 0 ? selectedVerses : new Set(verses.map(v => parseInt(v.verse, 10)));
  const verseInSel = (v) => toUse.has(parseInt(v.verse, 10));
  const selectedVersesList = verses.filter(verseInSel).sort((a, b) => parseInt(a.verse, 10) - parseInt(b.verse, 10));

  const verseLines = selectedVersesList.map(v => {
    const line = `${parseInt(v.verse, 10)} ${cleanVerseText(v.text).replace(/^¶\s*/, '')}`;
    // Psalm 119's acrostic heading (ALEPH, BETH, ...) lives on the verse
    // itself and can precede ANY verse in the list, not just the first —
    // insert it right above the verse it belongs to. chapterSub (below)
    // only ever covers a chapter-wide title attached to verse 1, which
    // doesn't apply to Ps119 (chapterSub is null there).
    return v.heading ? `${v.heading}\n${line}` : line;
  });
  const nums = selectedVersesList.map(v => parseInt(v.verse, 10));
  const range = formatVerseRange(nums);
  const ref = `${book.shortName} ${pos.chapter}:${range}`;
  const first = nums[0], last = nums[nums.length - 1];
  const url = buildVerseUrl({ abbr: pos.abbr, chapter: pos.chapter, verse: first, verseEnd: last > first ? last : undefined, from: searchTerm ? 'search' : undefined });

  // Include the Psalm superscription (subscript) and epistle colophon when
  // explicitly selected (Select-mode tap) or — when no section has been
  // toggled — when their anchor verse (1 / last) is in the selection.
  const parts = [];
  const includesV1 = selectedVersesList.some(v => parseInt(v.verse, 10) === 1);
  const chapterSub = resolveSubscript(book.apiName, pos.chapter) || null;
  const lastVerseNum = verses.length ? parseInt(verses[verses.length - 1].verse, 10) : null;
  const includesLast = lastVerseNum != null && selectedVersesList.some(v => parseInt(v.verse, 10) === lastVerseNum);
  const anySectionToggled = selectedSections.size > 0;
  // Copying more than one verse keeps the reference at the top (no dash);
  // a single verse moves it to the end with a dash, matching the
  // paragraph-copy citation style.
  const isMultiVerse = selectedVersesList.length > 1;
  if (isMultiVerse) parts.push(centerLine(book.name) + '\n' + centerLine(`Chapter ${pos.chapter}`));
  if (chapterSub && (selectedSections.has('subscript') || (!anySectionToggled && includesV1))) {
    parts.push(`¶ ${cleanVerseText(chapterSub).replace(/^[\u00B6\uFFFD¶]\s*/, '')}`);
  }
  parts.push(verseLines.join('\n\n'));
  if (colophon && (selectedSections.has('colophon') || (!anySectionToggled && includesLast))) {
    parts.push(`¶ ${cleanVerseText(colophon).replace(/^[\u00B6\uFFFD¶]\s*/, '')}`);
  }
  if (!isMultiVerse) parts.push(`— ${ref}`);
  parts.push(`Read more: <${url}>`);
  return parts.join('\n\n');
}