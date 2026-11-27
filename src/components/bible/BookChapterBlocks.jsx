import React from 'react';
import { renderVerseText } from '@/lib/bibleApi';

export default function BookChapterBlocks({ bookName, chapter, verses = [], subscript, colophon, paragraphs, searchTerm, jumpVerse, jumpSection, filterMode, selectMode, selectedVerses }) {
  if (chapter === 0) return null;
  const markup = (text, term = null, dropCap = false) => {
    let html = renderVerseText(String(text).replace(/^<<[^>]*>>\s*/, ''), term);
    if (dropCap) html = html.replace(/^((?:<[^>]+>|\s|¶)*)(\p{L})/u, '$1<span class="kjb-fb-dropcap">$2</span>');
    return { __html: html };
  };
  const note = (text, term = null) => ({ __html: `<span class="pilcrow">¶</span> ${renderVerseText(String(text).replace(/^<<[^>]*>>\s*/, '').replace(/^[\u00B6\uFFFD]\s*/, ''), term)}` });
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
      <h2 className="kjb-fb-title">{bookName}</h2>
      <p className="kjb-fb-chapter">Chapter {chapter}</p>
    </div>
    {subscript && <p className="kjb-fb-note" data-fb-sec="sub" dangerouslySetInnerHTML={note(subscript, jumpSection === 'subscript' ? searchTerm : null)} />}
    {groups.map((group, index) => <React.Fragment key={group[0].verse}>
      {group[0].heading && <p className="kjb-fb-heading notranslate" data-fb-heading={group[0].verse}>{String(group[0].heading).replace(/^<<[^>]*>>\s*/, '')}</p>}
      <p className={`kjb-fb-verse ${index === 0 && Number(group[0].verse) === 1 ? 'kjb-fb-first' : ''} ${paragraphs ? 'kjb-fb-para' : ''}`}>
        {group.map((v) => <React.Fragment key={v.verse}>
          <span data-fbv={v.verse}>
            {Number(v.verse) !== 1 && <sup>{v.verse}</sup>}
            <span className="kjb-verse-text" dangerouslySetInnerHTML={markup(v.text, Number(v.verse) === parseInt(jumpVerse, 10) ? searchTerm : null, index === 0 && Number(v.verse) === 1)} />
          </span>{' '}
        </React.Fragment>)}
      </p>
    </React.Fragment>)}
    {colophon && (!filtered || picked(verses[verses.length - 1] || {})) && <p className="kjb-fb-note" data-fb-sec="col" dangerouslySetInnerHTML={note(colophon, jumpSection === 'colophon' ? searchTerm : null)} />}
  </>;
}