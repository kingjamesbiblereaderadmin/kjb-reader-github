import { test } from '@playwright/test';

test('debug full popover', async ({ page }) => {
  await page.goto('/read?book=JHN&chapter=3');
  await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  await page.locator('#v16 .kjb-verse-text').click();
  await page.waitForTimeout(1500);
  const html = await page.evaluate(() => {
    // Find any element containing the text "Highlight" and walk up a few
    // levels to capture its container.
    const all = Array.from(document.querySelectorAll('*'));
    const target = all.find(el => el.children.length === 0 && el.textContent.trim() === 'Highlight');
    if (!target) return 'NOT FOUND';
    let container = target;
    for (let i = 0; i < 4 && container.parentElement; i++) container = container.parentElement;
    return container.outerHTML.slice(0, 3000);
  });
  console.log(html);
});
