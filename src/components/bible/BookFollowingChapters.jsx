import React from 'react';
import BookChapterBlocks from '@/components/bible/BookChapterBlocks';

export default function BookFollowingChapters({ passages, paragraphs, currentBook }) {
  return passages.filter((passage) => passage.chapter > 0).map((passage) => (
    <div key={`${passage.book.abbr}:${passage.chapter}`} className="kjb-fb-continues" data-fb-next={`${passage.book.abbr}:${passage.chapter}`}>
      <BookChapterBlocks {...passage} bookName={passage.book.name} showBookTitle={passage.book.abbr !== currentBook && passage.chapter === 1} paragraphs={paragraphs} />
      {passage.endMarker && <p className="kjb-fb-endmark">{passage.endMarker}</p>}
    </div>
  ));
}