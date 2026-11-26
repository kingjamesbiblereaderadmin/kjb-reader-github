import React from 'react';
import { BIBLE_BOOKS } from '@/lib/bibleData';

// The books as the old table names them — the app's short names are modern
// ("1 Samuel", "Romans"), where the printed table reads "I. Samuel" and "The
// Epistle to the Romans".
const TABLE_NAMES = {
  '1SA': 'I. Samuel', '2SA': 'II. Samuel', '1KI': 'I. Kings', '2KI': 'II. Kings',
  '1CH': 'I. Chronicles', '2CH': 'II. Chronicles', 'SNG': 'The Song of Solomon',
  'LAM': 'The Lamentations of Jeremiah', 'ACT': 'The Acts',
  'ROM': 'The Epistle to the Romans', '1CO': 'I. Corinthians', '2CO': 'II. Corinthians',
  '1TH': 'I. Thessalonians', '2TH': 'II. Thessalonians', '1TI': 'I. Timothy',
  '2TI': 'II. Timothy', 'HEB': 'To the Hebrews', 'JAS': 'The Epistle of James',
  '1PE': 'I. Peter', '2PE': 'II. Peter', '1JN': 'I. John', '2JN': 'II. John',
  '3JN': 'III. John',
};

const booksOf = (testament) => BIBLE_BOOKS
  .filter((b) => b.testament === testament)
  .map((b) => ({ ...b, table: TABLE_NAMES[b.abbr] || b.shortName }));

function BookList({ books, onSelectBook, dropCap }) {
  return (
    <ul className="kjb-contents-list">
      {books.map((b, i) => (
        <li key={b.abbr}>
          <button
            type="button"
            className={`kjb-contents-entry${dropCap && i === 0 ? ' kjb-contents-first' : ''}`}
            onClick={(e) => { e.stopPropagation(); onSelectBook?.(b.abbr); }}
          >
            {b.table} hath Chapters {b.chapters}
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * The KJB's front-matter table — "The Names and Order of all the Books of the
 * Old and New Testament, with the Number of their Chapters" — as it is printed
 * before Genesis. Every book of this edition is a link into its first chapter.
 */
export default function ContentsPage({ onSelectBook }) {
  return (
    <div className="notranslate kjb-contents">
      <h2 className="kjb-contents-title">
        The Names and Order of all the Books<br />
        of the Old and New Testament,<br />
        with the Number of their Chapters.
      </h2>

      <h3 className="kjb-contents-sub">The Books of the Old Testament.</h3>
      <BookList books={booksOf('old')} onSelectBook={onSelectBook} dropCap />

      <h3 className="kjb-contents-sub">The Books of the New Testament.</h3>
      <BookList books={booksOf('new')} onSelectBook={onSelectBook} dropCap />
    </div>
  );
}