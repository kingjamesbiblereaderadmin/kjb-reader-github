// Measure text nodes, not element boxes: element Ranges also include empty
// padding fragments in WebKit, even when selectNodeContents() is used.
export default function columnTextRects(element) {
  const doc = element.ownerDocument;
  const scripture = Array.from(element.querySelectorAll('.kjb-verse-text'));
  const roots = scripture.length ? scripture : [element];
  const range = doc.createRange();
  const rects = [];
  for (const root of roots) {
    const walker = doc.createTreeWalker(root, 4); // NodeFilter.SHOW_TEXT
    let node;
    while ((node = walker.nextNode())) {
      if (!node.textContent.trim()) continue;
      range.selectNodeContents(node);
      rects.push(...Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 1));
    }
  }
  return rects;
}