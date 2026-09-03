import { jsPDF } from 'jspdf';

const doc = new jsPDF({ unit: 'pt', format: 'a4' });
const marginX = 48, marginTop = 56;
const pageW = doc.internal.pageSize.getWidth();
const pageH = doc.internal.pageSize.getHeight();
const maxW = pageW - marginX * 2;
const lineH = 16;

function measureVerseHeight(text, url) {
  const clean = `\u201C${text}\u201D`;
  let lines = 1;
  let x = marginX + 15;
  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  const words = clean.split(/(\s+)/);
  words.forEach(word => {
    if (!word) return;
    const w = doc.getTextWidth(word);
    if (x + w > marginX + maxW && word.trim()) { x = marginX + 15; lines++; }
    x += w;
  });
  let height = lines * lineH;
  height += lineH;
  if (url) {
    doc.setFontSize(9);
    const linkStartX = marginX + 15;
    const linkMaxW = pageW - marginX - linkStartX;
    const chunks = doc.splitTextToSize(url, linkMaxW);
    height += (lineH - 2) + Math.max(0, chunks.length - 1) * (lineH - 4);
  }
  height += lineH + 8;
  return height;
}

const availablePageHeight = pageH - marginTop - 48;
console.log('Page height:', pageH, 'Available per page:', availablePageHeight);

let y = pageH - 48 - lineH * 2 - 5;
const text = "That your faith should not stand in the wisdom of men, but in the power of God.";
const url = "https://kingjamesbiblereader.com/read?book=1CO&chapter=2&verse=5&from=search&q=God";

const itemHeight = measureVerseHeight(text, url);
console.log('y before item:', y, 'itemHeight:', itemHeight, 'y+itemHeight:', y + itemHeight, 'page bottom limit:', pageH - 48);

const fitsOnFreshPage = itemHeight <= availablePageHeight;
const needsBreakNow = y + itemHeight > pageH - 48;

console.log('Fits on a fresh page:', fitsOnFreshPage);
console.log('New atomic logic breaks BEFORE drawing this item?', fitsOnFreshPage && needsBreakNow);
