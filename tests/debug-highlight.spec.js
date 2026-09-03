import { test } from '@playwright/test';

test('debug full popover', async ({ page }) => {
  await page.goto('/read?book=JHN&chapter=3');
  await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  await page.locator('#v16 .kjb-verse-text').click();
  await page.waitForTimeout(1500);
  const html = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.trim() === 'Highlight');
    return btns.map((b, i) => {
      // Find nearest ancestor that also contains a "Copy" button — that's the popover.
      let node = b;
      let depth = 0;
      while (node && depth < 8) {
        if (node.textContent.includes('Copy') && node.textContent.includes('Share')) break;
        node = node.parentElement;
        depth++;
      }
      return { index: i, title: b.title, hasPopoverAncestor: !!node, popoverHTML: node ? node.outerHTML.slice(0, 2000) : null };
    });
  });
  console.log(JSON.stringify(html, null, 2));
});
