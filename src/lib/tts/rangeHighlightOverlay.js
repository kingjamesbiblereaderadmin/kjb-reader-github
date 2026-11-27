// Range rectangles work in every browser and WebView without modifying scripture.
import { readingArea } from '@/lib/tts/readerFollow';

let layer;
export function clearRangeHighlight() { layer?.replaceChildren(); }

function pageWindows() {
  const book = document.querySelector('[data-testid="kjb-flipbook"]');
  if (!book) return null;
  const slots = [...book.querySelectorAll('.kjb-fb-slot')]
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0);
  return slots.length ? slots : null;
}

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
  const windows = pageWindows();
  if (!layer?.isConnected) {
    layer = document.createElement('div');
    layer.className = 'kjb-word-overlay';
    layer.setAttribute('aria-hidden', 'true');
    document.documentElement.appendChild(layer);
  }
  const fragment = document.createDocumentFragment();
  for (const range of ranges) {
    for (const rect of range.getClientRects()) {
      let box = clippedRect(rect, range.startContainer.parentElement);
      if (!box) continue;
      if (windows) {
        box = windows.reduce((best, win) => {
          const left = Math.max(box.left, win.left), top = Math.max(box.top, win.top);
          const right = Math.min(box.left + box.width, win.right), bottom = Math.min(box.top + box.height, win.bottom);
          return right > left && bottom > top && (!best || (right - left) * (bottom - top) > best.width * best.height)
            ? { left, top, width: right - left, height: bottom - top } : best;
        }, null);
        if (!box) continue;
      }
      const mark = document.createElement('span');
      mark.className = 'kjb-word-overlay-mark';
      Object.assign(mark.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
      fragment.appendChild(mark);
    }
  }
  layer.replaceChildren(fragment);
}