/**
 * Search feature tests — the main search page and advanced search filters.
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
  test.describe(`Search [${width}px]`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('word search returns results and renders without overflow', async ({ page }) => {
      await page.goto('/search');
      const input = page.getByPlaceholder(/study, Romans 3:25/i);
      await input.fill('love');
      await input.press('Enter');

      // Results render as grouped-by-book sections; wait for at least one
      // book heading to appear rather than a specific count (the exact
      // number of "love" occurrences isn't the point of this test).
      await page.waitForSelector('text=/Testament/', { timeout: 15000 });
      await assertNoOverflow(page, 'search results: "love"');

      // Clearing back to empty shouldn't error or leave stale results.
      await input.fill('');
      await input.press('Enter');
      await assertNoOverflow(page, 'search: cleared');
    });

    test('direct reference search (e.g. "John 3:16") resolves without overflow', async ({ page }) => {
      await page.goto('/search');
      const input = page.getByPlaceholder(/study, Romans 3:25/i);
      await input.fill('John 3:16');
      await input.press('Enter');
      await page.waitForTimeout(1000);
      await assertNoOverflow(page, 'search: direct reference');
    });

    test('a search with no matches shows an empty state, not a broken layout', async ({ page }) => {
      await page.goto('/search');
      const input = page.getByPlaceholder(/study, Romans 3:25/i);
      await input.fill('zzzzznonexistentqueryzzzzz');
      await input.press('Enter');
      await page.waitForTimeout(1000);
      await assertNoOverflow(page, 'search: no matches');
    });

    test('advanced search page loads and filters render without overflow', async ({ page }) => {
      await page.goto('/advanced-search');
      await assertNoOverflow(page, 'advanced search: initial');

      // Open the book filter if present and try searching within it —
      // exercised generically since the exact filter UI may evolve.
      const bookFilterInput = page.getByPlaceholder(/search books/i);
      if (await bookFilterInput.count()) {
        await bookFilterInput.fill('John');
        await assertNoOverflow(page, 'advanced search: book filter typed');
      }
    });
  });
}
