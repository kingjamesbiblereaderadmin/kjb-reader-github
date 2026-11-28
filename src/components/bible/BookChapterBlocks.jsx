import React from 'react';
import { renderVerseText } from '@/lib/bibleApi';
import { getShyMap, injectShyHtml } from '@/lib/softHyphens';

export default function BookChapterBlocks({ bookName, showBookTitle = true, chapter, verses = [], subscript, colophon, paragraphs, searchTerm, jumpVerse, jumpSection, filterMode, selectMode, selectedVerses }) {
  if (chapter === 0) return null;
  const markup = (text, term = null, dropCapNum = null) => {
    let html = renderVerseText(String(text).replace(/^<<[^>]*>>\s*/, ''), term);
    // Verse 1 is set with a drop cap, and its number sits beside the big letter
    // as every other verse's number sits at the head of its own line.
    if (dropCapNum != null) html = html.replace(/^((?:<[^>]+>|\s|¶)*)(\p{L})/u, `$1<span class="kjb-fb-dropcap-group"><span class="kjb-fb-dropcap-num">${dropCapNum}</span><span class="kjb-fb-dropcap">$2</span></span>`);
    // The app's own break points (as in the Read view), so justified lines break
    // words with a dash instead of stretching the spaces, even beside the drop
    // cap, where the browser's own hyphenation often gives up.
    return { __html: injectShyHtml(html, getShyMap()) };
  };
  const note = (text, term = null) => ({ __html: injectShyHtml(`<span class="pilcrow">¶</span> ${renderVerseText(String(text).replace(/^<<[^>]*>>\s*/, '').replace(/^[\u00B6\uFFFD]\s*/, ''), term)}`, getShyMap()) });
  const picked = (v) => selectedVerses?.has(Number(v.verse)) || selectedVerses?.has(String(v.verse));
  const filtered = !!(filterMode && !selectMode && selectedVerses?.size);
  const groups = [];
  (filtered ? verses.filter(picked) : verses).forEach((v) => {
    const breaks = /(^|[\s.,;:!?'\")\]])[\u00B6\uFFFD\u000F]/.test(v.text);
    if (!paragraphs || breaks || v.heading || !groups.length) groups.push([v]);
    else groups[groups.length - 1].push(v);
  });
  return <>
    <div className="kjb-fb-opening" data-fb-sec="head">
      {showBookTitle && <h2 className="kjb-fb-title"><span className="kjb-fb-heading-text">{bookName}</span></h2>}
      <p className="kjb-fb-chapter"><span className="kjb-fb-heading-text">Chapter {chapter}</span></p>
    </div>
    {subscript && <p className="kjb-fb-note" data-fb-sec="sub" dangerouslySetInnerHTML={note(subscript, jumpSection === 'subscript' ? searchTerm : null)} />}
    {groups.map((group, index) => <React.Fragment key={group[0].verse}>
      {group[0].heading && <p className="kjb-fb-heading notranslate" data-fb-heading={group[0].verse}>{String(group[0].heading).replace(/^<<[^>]*>>\s*/, '')}</p>}
      <p className={`kjb-fb-verse ${index === 0 && Number(group[0].verse) === 1 ? 'kjb-fb-first' : ''} ${paragraphs ? 'kjb-fb-para' : ''} ${index > 0 && Number(group[0].verse) !== 1 ? 'kjb-fb-gap' : ''}`}>
        {group.map((v) => <React.Fragment key={v.verse}>
          <span data-fbv={v.verse}>
            {Number(v.verse) !== 1 && <sup>{v.verse}</sup>}
            <span className="kjb-verse-text" dangerouslySetInnerHTML={markup(v.text, Number(v.verse) === parseInt(jumpVerse, 10) ? searchTerm : null, index === 0 && Number(v.verse) === 1 ? v.verse : null)} />
          </span>{' '}
        </React.Fragment>)}
      </p>
    </React.Fragment>)}
    {colophon && (!filtered || picked(verses[verses.length - 1] || {})) && <p className="kjb-fb-note" data-fb-sec="col" dangerouslySetInnerHTML={note(colophon, jumpSection === 'colophon' ? searchTerm : null)} />}
  </>;
}