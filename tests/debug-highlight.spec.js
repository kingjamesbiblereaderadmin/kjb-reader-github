import { test } from '@playwright/test';

test('debug full popover', async ({ page }) => {
  await page.goto('/read?book=JHN&chapter=3');
  await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  await page.locator('#v16 .kjb-verse-text').click();
  await page.waitForTimeout(1500);
  const html = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Highlight');
    if (!btn) return 'NOT FOUND';
    let container = btn.parentElement ? btn.parentElement.parentElement : btn;
    return (container || btn).outerHTML.slice(0, 3000);
  });
  console.log(html);
});
