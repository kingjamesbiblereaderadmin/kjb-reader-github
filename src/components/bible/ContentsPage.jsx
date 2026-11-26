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

/** Every book of this edition, in the old table's order and naming. */
export const CONTENTS_BOOKS = BIBLE_BOOKS.map((b) => ({
  abbr: b.abbr,
  testament: b.testament,
  chapters: b.chapters,
  table: TABLE_NAMES[b.abbr] || b.shortName,
}));

/** One continuous table. The book view supplies the natural page boundaries. */
export default function ContentsPage({ onSelectBook }) {
  return (
    <div className="notranslate kjb-contents" translate="no" lang="en">
      <h2 className="kjb-contents-title" data-contents-row="">
        <span className="kjb-contents-eyebrow">The Names and Order</span>
        <span className="kjb-contents-heading">of all the Books of the<br />Old and New Testament,</span>
        <span className="kjb-contents-caption">with the Number of their Chapters.</span>
      </h2>
      {['old', 'new'].map((testament) => (
        <section key={testament} className="kjb-contents-testament">
          <h3 className="kjb-contents-sub" data-contents-row="">
            <span>{testament === 'old' ? 'Old Testament' : 'New Testament'}</span>
            <span className="kjb-contents-label"><em>hath</em> Chapters</span>
          </h3>
          <ul className="kjb-contents-list">
            {CONTENTS_BOOKS.filter((b) => b.testament === testament).map((b) => (
              <li key={b.abbr} data-contents-row="">
                <button type="button" className="kjb-contents-entry"
                  aria-label={`${b.table}, ${b.chapters} ${b.chapters === 1 ? 'chapter' : 'chapters'}`}
                  onClick={(e) => { e.stopPropagation(); onSelectBook?.(b.abbr); }}>
                  <span className="kjb-contents-name">{b.table}</span>
                  <span className="kjb-contents-leader" aria-hidden="true" />
                  <span className="kjb-contents-number">{b.chapters}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}