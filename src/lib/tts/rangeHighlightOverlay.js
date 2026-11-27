// Range rectangles work in every browser and WebView without modifying scripture.
import { readingArea } from '@/lib/tts/readerFollow';

let layer;
export function clearRangeHighlight() { layer?.replaceChildren(); }

// The shading sits above the page, so a word scrolled under the pinned toolbar
// and heading must be cut off there. The heading's own words are left alone.
function pinnedEdge(element) {
  if (!element || element.closest('#kjb-anchored-heading, [data-testid="kjb-flipbook"]')
    || document.querySelector('[data-testid="kjb-flipbook"]')) return 0;
  return readingArea().top - 4;
}

function clippedRect(rect, element) {
  let left = Math.max(0, rect.left), top = Math.max(0, pinnedEdge(element), rect.top);
  let right = Math.min(innerWidth, rect.right), bottom = Math.min(innerHeight, rect.bottom);
  for (let parent = element; parent && parent !== document.documentElement; parent = parent.parentElement) {
    const style = getComputedStyle(parent);
    if (style.visibility === 'hidden' || style.display === 'none') return null;
    const box = parent.getBoundingClientRect();
    if (/(hidden|clip|auto|scroll)/.test(style.overflowX)) {
      left = Math.max(left, box.left); right = Math.min(right, box.right);
    }
    if (/(hidden|clip|auto|scroll)/.test(style.overflowY)) {
      top = Math.max(top, box.top); bottom = Math.min(bottom, box.bottom);
    }
  }
  return right > left && bottom > top ? { left, top, width: right - left, height: bottom - top } : null;
}

export function paintRangeHighlight(ranges) {
  if (!layer?.isConnected) {
    layer = document.createElement('div');
    layer.className = 'kjb-word-overlay';
    layer.setAttribute('aria-hidden', 'true');
    document.documentElement.appendChild(layer);
  }
  const fragment = document.createDocumentFragment();
  for (const range of ranges) {
    for (const rect of range.getClientRects()) {
      const box = clippedRect(rect, range.startContainer.parentElement);
      if (!box) continue;
      const mark = document.createElement('span');
      mark.className = 'kjb-word-overlay-mark';
      Object.assign(mark.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
      fragment.appendChild(mark);
    }
  }
  layer.replaceChildren(fragment);
}