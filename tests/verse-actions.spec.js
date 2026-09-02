/**
 * Verse action tests — tap a verse, use the popover (Highlight/Copy/Share/
 * Save/Select), verify Select mode's bulk action bar, and confirm the
 * Saved Verses page reflects saves and deletions correctly (round-trips
 * through real localStorage, not mocked).
 */
import { test, expect } from '@playwright/test';

const WIDTHS = [360, 393];
const TOLERANCE_PX = 1.5;

async function assertNoOverflow(page, label) {
  const overflow = await page.evaluate((tolerance) => {
    const docWidth = document.documentElement.clientWidth;
    const offenders = [];
    for (const el of document.querySelectorAll('body *')) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (rect.right > docWidth + tolerance) {
        offenders.push({ tag: el.tagName.toLowerCase(), text: (el.textContent || '').trim().slice(0, 50) });
      }
    }
    return [...new Map(offenders.map((o) => [`${o.tag}:${o.text}`, o])).values()];
  }, TOLERANCE_PX);
  expect(overflow, `${label}: horizontal overflow:\n` + overflow.map((o) => `  <${o.tag}> "${o.text}"`).join('\n')).toEqual([]);
}

for (const width of WIDTHS) {
  test.describe(`Verse actions [${width}px]`, () => {
    test.use({ viewport: { width, height: 900 } });

    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        try {
          localStorage.removeItem('kjb-saved-verses');
          localStorage.removeItem('kjb-highlighted-verses');
        } catch {}
      });
    });

    test('tap verse, highlight it, then unhighlight — popover has no overflow', async ({ page }) => {
      await page.goto('/read?book=JHN&chapter=3');
      await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });

      await page.locator('#v16').click();
      const highlightBtn = page.getByTitle('Highlight');
      await expect(highlightBtn).toBeVisible();
      await assertNoOverflow(page, 'verse popover open');

      await highlightBtn.click();
      await expect(page.getByTitle('Unhighlight')).toBeVisible();

      await page.getByTitle('Unhighlight').click();
      await expect(page.getByTitle('Highlight')).toBeVisible();
    });

    test('copy and share actions do not throw', async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));

      await page.goto('/read?book=JHN&chapter=3');
      await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
      await page.locator('#v16').click();

      await page.getByTitle('Copy').click();
      await page.waitForTimeout(300);

      await page.getByTitle('Share').click().catch(() => {});
      await page.waitForTimeout(300);

      expect(errors, `errors during copy/share:\n${errors.join('\n')}`).toEqual([]);
    });

    test('save a verse via the popover, see it on Saved Verses, then remove it', async ({ page }) => {
      await page.goto('/read?book=JHN&chapter=3');
      await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });

      await page.locator('#v16').click();
      await page.getByTitle('Save').click();

      const folderOption = page.locator('[role="menuitem"], button').filter({ hasText: /no folder|default|save/i }).first();
      if (await folderOption.count()) {
        await folderOption.click().catch(() => {});
      }

      await page.waitForTimeout(500);
      const saved = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
      expect(saved, 'verse was not persisted after Save').toBeTruthy();

      await page.goto('/saved');
      await assertNoOverflow(page, 'saved verses list');
      await expect(page.locator('body')).toContainText(/John/i);

      const removeBtn = page.getByTitle('Remove').first();
      if (await removeBtn.count()) {
        await removeBtn.click();
        await page.waitForTimeout(300);
        const savedAfterRemove = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
        const parsed = savedAfterRemove ? JSON.parse(savedAfterRemove) : [];
        expect(parsed.length, 'verse still present in storage after removing').toBe(0);
      }
    });

    test('select mode: multi-select verses and use the bulk action bar without overflow', async ({ page }) => {
      await page.goto('/read?book=JHN&chapter=3');
      await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });

      await page.locator('#v16').click();
      const selectBtn = page.getByTitle('Select verses');
      if (await selectBtn.count()) {
        await selectBtn.click();
        await page.locator('#v17').click().catch(() => {});
        await page.locator('#v18').click().catch(() => {});
        await assertNoOverflow(page, 'select mode with multiple verses');

        const cancelBtn = page.getByRole('button', { name: /cancel|done|close/i }).first();
        if (await cancelBtn.count()) await cancelBtn.click().catch(() => {});
      }
    });
  });
}
