import React from 'react';
import BookChapterBlocks from '@/components/bible/BookChapterBlocks';
import FittedPage from '@/components/bible/FittedPage';
import TitlePage from '@/components/bible/TitlePage';

export default function BookContinuation({ passage, side, padLeft, padRight, padTop, footerHeight, textW, textH, contentsH, zoomLevel, fontFamilyValue, isCursive, flowProps, textStyle, paragraphs }) {
  const { book, chapter } = passage;
  // Only the Bible's own title pages stay; a chapter 1 shows its text, with no
  // book-title page standing between the books.
  const title = chapter === 0;
  const type = book.abbr === 'MAT' ? 'testament-new' : 'testament-old';
  return <div className={`kjb-fb-page kjb-fb-${side} notranslate`} translate="no" data-fb-next={`${book.abbr}:${chapter}`} style={{ padding: `${padTop}px ${padRight}px ${footerHeight}px ${padLeft}px` }}>
    {title ? <FittedPage width={textW} height={contentsH} zoom={zoomLevel / 100} fontFamilyValue={fontFamilyValue} isCursive={isCursive}>
      <TitlePage type={type} book={book} />
    </FittedPage> : <>
      {/* Same hairline as the facing page, so both pages' text starts level. */}
      <span aria-hidden="true" className="kjb-fb-toprule" style={{ left: padLeft, right: padRight, top: padTop - 14 }} />
      <div className="kjb-fb-window" style={{ width: textW, height: textH }}>
        <div className={`kjb-fb-flow notranslate ${flowProps.className}`} lang="en" style={{ ...textStyle, width: textW, height: textH, columnWidth: flowProps.columnWidth, columnGap: flowProps.gap }}>
          <BookChapterBlocks {...passage} bookName={book.name} paragraphs={paragraphs} />
        </div>
      </div>
    </>}
  </div>;
}