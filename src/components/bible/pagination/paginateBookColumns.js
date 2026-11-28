import { fittingFragment, usedHeight } from '@/components/bible/pagination/bookFragment';

const cache = new Map();

// Measure normal blocks, then materialise each column. No browser multicolumn
// fragments are translated through a clipping window, so glyphs cannot leak
// into the gutter and a last line is never painted below its measured column.
export default function paginateBookColumns(source, width, height, gap, prefix, layoutVersion) {
  const style = getComputedStyle(source);
  const key = [source.innerHTML, width, height, gap, prefix?.columns, prefix?.top,
    style.font, style.letterSpacing, document.documentElement.dataset.a11yFont, layoutVersion].join('|');
  if (cache.has(key)) return cache.get(key);
  const probe = source.cloneNode(false);
  probe.removeAttribute('aria-hidden');
  Object.assign(probe.style, { position: 'absolute', top: '0', left: '0', height: 'auto', width: `${width}px`, display: 'flow-root' });
  source.parentElement.appendChild(probe);
  const columns = Array.from({ length: prefix?.columns || 0 }, () => '');
  let wrappers = new Map();
  const nextColumn = () => { columns.push(probe.innerHTML); probe.replaceChildren(); wrappers = new Map(); };
  if (prefix?.top) {
    const spacer = document.createElement('div');
    spacer.style.height = `${prefix.top}px`;
    probe.appendChild(spacer);
  }
  const wrapperFor = (passage) => {
    const key = passage.dataset.fbCurrent || passage.dataset.fbNext;
    if (!wrappers.has(key)) {
      const wrapper = passage.cloneNode(false);
      wrapper.style.display = 'contents';
      probe.appendChild(wrapper);
      wrappers.set(key, wrapper);
    }
    return wrappers.get(key);
  };
  try {
    for (const passage of source.children) {
      const blocks = [...passage.children];
      // A heading plus its printed note must have room for three verses, not
      // just a token line or two. Very long openings may still span columns.
      if (probe.childNodes.length && blocks.length) {
        const sample = probe.cloneNode(false);
        source.parentElement.appendChild(sample);
        let verses = 0;
        for (const block of blocks) {
          const marks = [...block.querySelectorAll('[data-fbv]')];
          let part = block.cloneNode(true);
          if (marks.length > 3 - verses && verses < 3) {
            const end = marks[3 - verses - 1];
            const range = document.createRange();
            range.setStart(block, 0); range.setEndAfter(end);
            part = block.cloneNode(false); part.appendChild(range.cloneContents());
          }
          sample.appendChild(part);
          verses += marks.length;
          if (verses >= 3) break;
        }
        const openingHeight = Math.min(height, usedHeight(sample));
        sample.remove();
        if (usedHeight(probe) + openingHeight > height) nextColumn();
      }
      for (const original of blocks) {
        let block = original.cloneNode(true);
        while (block) {
          // A heading that opens a column sits flush with the column's first line.
          if (!usedHeight(probe)) { block.style.marginTop = '0'; block.style.paddingTop = '0'; }
          let wrapper = wrapperFor(passage);
          wrapper.appendChild(block);
          if (usedHeight(probe) <= height) break;
          block.remove();
          const split = fittingFragment(probe, block, height);
          if (split && split.tail) {
            if (block.classList.contains('kjb-fb-verse')) split.head.style.textAlignLast = 'justify';
            wrapper.appendChild(split.head);
            nextColumn();
            block = split.tail;
          } else if (usedHeight(probe) > 0) nextColumn();
          else {
            // At extreme accessibility zoom a single line can exceed the page.
            // Keep it available by scrolling, never discard or crop its words.
            wrapper = wrapperFor(passage); wrapper.appendChild(block);
            block.dataset.fbOversize = 'true';
            nextColumn(); block = null;
          }
        }
      }
    }
    if (probe.textContent.trim() || !columns.length) columns.push(probe.innerHTML);
  } finally { probe.remove(); }
  const html = columns.map((content, index) => `<div class="kjb-fb-column" style="left:${index * (width + gap)}px;width:${width}px;height:${height}px">${content}</div>`).join('');
  if (cache.size >= 8) cache.delete(cache.keys().next().value);
  cache.set(key, html);
  return html;
}