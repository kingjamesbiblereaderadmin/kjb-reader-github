/**
 * Landing-page onboarding wizard interactions — the 5-step
 * Install/Theme/Fonts/Layout/Explore flow new users see. Clicks through
 * every step and every customization option in it.
 */
import { test, expect } from '@playwright/test';

const WIDTHS = [320, 360, 393];
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
  test.describe(`Landing wizard [${width}px]`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('every step, every option, no overflow', async ({ page }) => {
      await page.goto('/landing');
      await assertNoOverflow(page, 'wizard: install step');

      // Theme & Colour step
      await page.getByRole('button', { name: /^next$/i }).click();
      for (const label of ['Light', 'Dark', 'Auto', 'System']) {
        await page.getByRole('button', { name: label, exact: true }).click();
        await assertNoOverflow(page, `wizard: theme=${label}`);
      }

      // Fonts step
      await page.getByRole('button', { name: /^next$/i }).click();
      for (const label of ['Dyslexic', 'Legible', 'Off']) {
        const btn = page.getByRole('button', { name: label, exact: true });
        if (await btn.count()) {
          await btn.click();
          await assertNoOverflow(page, `wizard: a11y-font=${label}`);
        }
      }
      for (const label of ['Serif', 'Sans', 'Mono', 'Cursive', 'Times']) {
        const btn = page.getByRole('button', { name: label, exact: true });
        if (await btn.count()) {
          await btn.click();
          await assertNoOverflow(page, `wizard: font=${label}`);
        }
      }

      // Layout step
      await page.getByRole('button', { name: /^next$/i }).click();
      for (const label of ['Line by Line', 'Paragraph', 'Single Column', 'Two Column']) {
        const btn = page.getByRole('button', { name: label, exact: true });
        if (await btn.count()) {
          await btn.click();
          await assertNoOverflow(page, `wizard: layout=${label}`);
        }
      }

      // Explore step (external/internal resource links — just check layout,
      // don't follow the links)
      await page.getByRole('button', { name: /^next$/i }).click();
      await assertNoOverflow(page, 'wizard: explore step');

      // Back navigation through all steps
      for (let i = 0; i < 4; i++) {
        const backBtn = page.getByRole('button', { name: /^back$/i });
        if (await backBtn.isEnabled().catch(() => false)) {
          await backBtn.click();
          await assertNoOverflow(page, `wizard: back step ${i}`);
        }
      }
    });
  });
}
