import { test } from '@playwright/test';

test('debug save', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem('kjb-saved-verses');
      localStorage.removeItem('kjb-saved-folders');
    } catch {}
  });
  await page.goto('/read?book=JHN&chapter=3');
  await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  await page.locator('#v16 .kjb-verse-text').click();
  await page.waitForTimeout(500);
  const btns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).filter(b => /save/i.test(b.textContent)).map(b => ({ text: b.textContent.trim(), visible: b.offsetParent !== null }));
  });
  console.log('SAVE BUTTONS:', JSON.stringify(btns, null, 2));
});
