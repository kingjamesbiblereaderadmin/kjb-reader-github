/**
 * Paragraph gap after the drop-cap verse.
 *
 * When verse 1 carries the decorative drop cap, the pilcrow (¶) verse that
 * follows it (verse 2, e.g. 2 Samuel 11:2) must keep the SAME paragraph gap
 * as every other ¶ verse. A CSS rule used to cancel it, so verse 2 sat flush
 * under the drop-cap line while every other ¶ verse kept its break.
 *
 * Two independent assertions, both geometric / computed — no screenshots:
 *   1. verse 2's own padding-top is a real paragraph gap (it is never the
 *      topmost verse of a column, so the column-leader flush never zeroes it)
 *   2. the measured vertical gap between verse 1's bottom and verse 2's top
 *      is a real gap, not a flush touch
 *
 * Run locally:
 *   npx playwright install --with-deps chromium   (once)
 *   npm run build && npm run test:layout tests/pilcrow-after-dropcap.spec.js
 */
import { test, expect } from '@playwright/test';

// Chapters whose verse 2 is a pilcrow (¶) verse directly under a drop cap.
const CHAPTERS = [
  { abbr: '2SA', chapter: 11, label: '2 Samuel 11' },
  { abbr: 'GEN', chapter: 3, label: 'Genesis 3' },
  { abbr: 'JOB', chapter: 2, label: 'Job 2' },
  { abbr: 'MAT', chapter: 2, label: 'Matthew 2' },
];

const FONTS = ['serif', 'cursive'];
const ZOOMS = [100, 200];

// The paragraph gap is 2.25rem; anything well under that (or zero) means the
// break collapsed.
const MIN_GAP_PX = 20;

async function openChapter(page, { abbr, chapter, font, zoom }) {
  await page.addInitScript(
    ([f, z]) => {
      try {
        localStorage.setItem('kjb-reader-font-family', f);
        localStorage.setItem('kjb-zoom', String(z));
        localStorage.setItem('kjb-column', 'true');
        localStorage.setItem('kjb-has-visited-app', 'true');
        localStorage.setItem('kjb-prompt-dismissed', 'true');
      } catch {}
    },
    [font, zoom]
  );
  await page.goto(`/read?book=${abbr}&chapter=${chapter}`);
  await page.waitForSelector('#v2', { timeout: 30000 });
  // Let drop-cap measurement and column-leader flush settle.
  await page.waitForTimeout(400);
  return page.evaluate(() => {
    const v2 = document.querySelector('#v2');
    return v2?.getAttribute('data-pilcrow') === 'true';
  });
}

for (const font of FONTS) {
  for (const zoom of ZOOMS) {
    for (const ch of CHAPTERS) {
      test(`${ch.label} — ¶ verse 2 keeps its paragraph gap (${font}, ${zoom}%)`, async ({ page }) => {
        await page.setViewportSize({ width: 393, height: 851 });
        const isPilcrowVerse = await openChapter(page, { ...ch, font, zoom });
        test.skip(!isPilcrowVerse, `${ch.label} verse 2 is not a ¶ verse in this edition`);

        const data = await page.evaluate(() => {
          const v1 = document.querySelector('[id="v1"]');
          const v2 = document.querySelector('#v2[data-pilcrow="true"]');
          if (!v1 || !v2) return null;
          const r1 = v1.getBoundingClientRect();
          const r2 = v2.getBoundingClientRect();
          return {
            padTop: parseFloat(getComputedStyle(v2).paddingTop) || 0,
            marginTop: parseFloat(getComputedStyle(v2).marginTop) || 0,
            v1Bottom: r1.bottom,
            v2Top: r2.top,
            sameColumn: Math.abs(r1.left - r2.left) < 2,
            pilcrowGlyph: !!v2.querySelector('.pilcrow'),
          };
        });

        expect(data, 'verse 1 and the ¶ verse 2 both rendered').toBeTruthy();
        expect(data.pilcrowGlyph, '¶ mark rendered on verse 2').toBe(true);

        // 1. The gap itself, measured between the two verses.
        if (data.sameColumn) {
          const gap = data.v2Top - data.v1Bottom;
          expect(gap, `gap under drop-cap verse (${gap.toFixed(1)}px)`).toBeGreaterThan(MIN_GAP_PX);
        } else {
          // Verse 2 wrapped to the next column: its own top spacing is the gap.
          const spacing = data.padTop + data.marginTop;
          expect(spacing, `verse 2 top spacing (${spacing}px)`).toBeGreaterThan(MIN_GAP_PX);
        }
      });
    }
  }
}