import { useEffect, useState } from 'react';
import { getNextBook } from '@/lib/bibleData';
import { fetchChapter, fetchChapterSync, resolveSubscript } from '@/lib/bibleApi';

export default function useFollowingChapter(book, chapter, enabled) {
  const [loaded, setLoaded] = useState(null);
  let nextBook = book;
  let nextChapter = chapter + 1;
  if (chapter >= book.chapters) {
    nextBook = getNextBook(book.abbr);
    nextChapter = book.abbr === 'MAL' ? 0 : 1;
  }
  const key = nextBook ? `${nextBook.abbr}:${nextChapter}` : '';
  const cached = enabled && nextBook && nextChapter > 0 ? fetchChapterSync(nextBook.apiName, nextChapter) : null;
  useEffect(() => {
    if (!enabled || !nextBook || nextChapter === 0 || cached || loaded?.key === key) return undefined;
    let alive = true;
    let attempt = 0;
    let timer = 0;
    // The next chapter is printed on the facing page, so a single failed load
    // left that page blank for the rest of the session. Ask again shortly
    // instead of giving up on the first failure.
    const load = () => {
      fetchChapter(nextBook.apiName, nextChapter)
        .then((data) => { if (alive) setLoaded({ key, data }); })
        .catch(() => {
          if (!alive || attempt >= 3) return;
          attempt += 1;
          timer = setTimeout(load, 700 * attempt);
        });
    };
    load();
    return () => { alive = false; clearTimeout(timer); };
  }, [enabled, key, !!cached]); // Chapter data already lives in the reader's offline Bible cache.
  if (!enabled || !nextBook) return null;
  const data = cached || (loaded?.key === key ? loaded.data : null);
  if (nextChapter > 0 && !data) return null;
  return { book: nextBook, chapter: nextChapter, verses: data?.verses || [], colophon: data?.colophon, subscript: resolveSubscript(nextBook.apiName, nextChapter) };
}