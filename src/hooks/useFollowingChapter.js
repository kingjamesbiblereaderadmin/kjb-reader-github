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
    if (!enabled || !nextBook || nextChapter === 0 || cached || loaded?.key === key) return;
    let alive = true;
    fetchChapter(nextBook.apiName, nextChapter).then((data) => { if (alive) setLoaded({ key, data }); });
    return () => { alive = false; };
  }, [enabled, key, !!cached]); // Chapter data already lives in the reader's offline Bible cache.
  if (!enabled || !nextBook) return null;
  const data = cached || (loaded?.key === key ? loaded.data : null);
  if (nextChapter > 0 && !data) return null;
  return { book: nextBook, chapter: nextChapter, verses: data?.verses || [], colophon: data?.colophon, subscript: resolveSubscript(nextBook.apiName, nextChapter) };
}