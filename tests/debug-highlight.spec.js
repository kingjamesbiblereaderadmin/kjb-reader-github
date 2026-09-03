import { test } from '@playwright/test';

test('debug highlight button attrs', async ({ page }) => {
  await page.goto('/read?book=JHN&chapter=3');
  await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  await page.locator('#v16 .kjb-verse-text').click();
  await page.waitForTimeout(1500);
  const html = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Highlight') || b.title.toLowerCase().includes('highlight'));
    return btns.map(b => ({ title: b.title, text: b.textContent.trim(), outerHTML: b.outerHTML.slice(0, 300) }));
  });
  console.log(JSON.stringify(html, null, 2));
});
