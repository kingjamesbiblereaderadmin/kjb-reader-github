import React from 'react';
import { BIBLE_BOOKS } from '@/lib/bibleData';

/**
 * The KJB's front-matter table — "The Names and Order of all the Books of the
 * Old and New Testament, with their proper Numbers" — as it is printed before
 * Genesis, in the old "Genesis hath Chapters 50" form. Every book is a link
 * into its first chapter.
 */
export default function ContentsPage({ onSelectBook }) {
  return (
    <div className="notranslate kjb-contents">
      <h2 className="kjb-contents-title">
        The Names and Order of all the Books<br />
        of the Old and New Testament,<br />
        with their proper Numbers
      </h2>
      <ul className="kjb-contents-list">
        {BIBLE_BOOKS.map((b) => (
          <li key={b.abbr}>
            <button
              type="button"
              className="kjb-contents-entry"
              onClick={(e) => { e.stopPropagation(); onSelectBook?.(b.abbr); }}
            >
              {b.shortName} hath Chapters {b.chapters}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}