import { useEffect, useMemo, useState } from 'react';
import { getNextBook } from '@/lib/bibleData';
import { fetchChapter, fetchChapterSync, resolveSubscript, resolveEndMarker } from '@/lib/bibleApi';

// Read only as far ahead as the measured spread needs, using the offline Bible.
export default function useBookContinuations(book, chapter, enabled, count) {
  const [loaded, setLoaded] = useState({});
  const positions = useMemo(() => {
    const result = [];
    let nextBook = book, nextChapter = chapter;
    for (let index = 0; enabled && index < count; index += 1) {
      if (nextChapter < nextBook.chapters) nextChapter += 1;
      else {
        const title = nextBook.abbr === 'MAL';
        nextBook = getNextBook(nextBook.abbr);
        if (!nextBook) break;
        nextChapter = title ? 0 : 1;
      }
      result.push({ book: nextBook, chapter: nextChapter, key: `${nextBook.abbr}:${nextChapter}` });
      if (nextChapter === 0) break;
    }
    return result;
  }, [book, chapter, enabled, count]);
  const passages = positions.map((position) => ({ ...position,
    data: position.chapter === 0 ? { verses: [] } : fetchChapterSync(position.book.apiName, position.chapter) || loaded[position.key],
  }));
  const missing = passages.filter((passage) => !passage.data);
  const missingKey = missing.map((passage) => passage.key).join('|');
  useEffect(() => {
    if (!missingKey) return undefined;
    let alive = true;
    Promise.all(missing.map(async (passage) => [passage.key, await fetchChapter(passage.book.apiName, passage.chapter)]))
      .then((entries) => { if (alive) setLoaded((previous) => ({ ...previous, ...Object.fromEntries(entries) })); });
    return () => { alive = false; };
    // Only request chapters that are not already available locally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingKey]);
  const firstMissing = passages.findIndex((passage) => !passage.data);
  return (firstMissing < 0 ? passages : passages.slice(0, firstMissing)).map(({ data, ...passage }) => ({ ...passage,
    verses: data.verses, colophon: data.colophon,
    subscript: resolveSubscript(passage.book.apiName, passage.chapter),
    endMarker: resolveEndMarker(passage.book.apiName, passage.chapter),
  }));
}