import { test } from '@playwright/test';

test('debug highlight color click', async ({ page }) => {
  await page.goto('/read?book=JHN&chapter=3');
  await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  await page.locator('#v16 .kjb-verse-text').click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /^Highlight$/ }).click();
  await page.waitForTimeout(500);
  const menuItems = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[role="menuitem"]')).map(el => ({
      text: el.textContent.trim(),
      outerHTML: el.outerHTML.slice(0, 200),
    }));
  });
  console.log('MENU ITEMS:', JSON.stringify(menuItems, null, 2));

  if (menuItems.length) {
    await page.getByRole('menuitem').first().click();
    await page.waitForTimeout(800);
    const btnText = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Highlight'));
      return btns.map(b => b.textContent.trim());
    });
    console.log('BUTTON TEXTS AFTER CLICK:', JSON.stringify(btnText));
    const stored = await page.evaluate(() => localStorage.getItem('kjb-highlighted-verses'));
    console.log('STORED:', stored);
  }
});
