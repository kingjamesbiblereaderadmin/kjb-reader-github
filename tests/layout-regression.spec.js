/**
 * Layout regression tests for the reader page.
 *
 * These exist because the bugs we keep hitting (RunningHead text overlapping
 * the "Chapter N" label, two-column verse text bleeding across the
 * column-rule divider) are all *geometric* — an element's bounding box
 * crossing a line it shouldn't. That's something a script can check exactly,
 * every combination, every time, instead of someone scrolling through
 * screenshots on a phone.
 *
 * Run locally:
 *   npx playwright install --with-deps chromium   (once)
 *   npm run test:layout
 *
 * Runs automatically in CI on every push (see
 * .github/workflows/layout-tests.yml) against a local `vite preview` build,
 * so a regression shows up as a failed check before you ever open the app.
 */
import { test, expect } from '@playwright/test';

// A representative slice of books/chapters, not all 1189 chapters — chosen to
// hit the longest book titles (the ones that actually stress RunningHead's
// shrink/stack logic) plus a couple of ordinary ones as a control.
const BOOKS = [
  { abbr: '1KI', chapter: 16, label: '1 Kings 16 (longest OT title)' },
  { abbr: '2KI', chapter: 3, label: '2 Kings 3 (longest OT title)' },
  { abbr: '1SA', chapter: 5, label: '1 Samuel 5 (long title)' },
  { abbr: 'PSA', chapter: 119, label: 'Psalms 119 (longest chapter)' },
  { abbr: 'GEN', chapter: 3, label: 'Genesis 3 (control/short title)' },
  { abbr: 'REV', chapter: 21, label: 'Revelation 21 (long title)' },
];

const FONTS = ['serif', 'cursive'];
const ZOOM_LEVELS = [100, 150, 175, 200, 250];

// Real devices this app is meant to run on: a narrow phone and a tablet-ish
// width, both portrait. Two-column mode is the whole point of the test, and
// it's most cramped (and most likely to leak) on a narrow phone.
const VIEWPORTS = [
  { name: 'phone', width: 393, height: 851 },
  { name: 'narrow-phone', width: 360, height: 780 },
];

const OVERFLOW_TOLERANCE_PX = 1.5; // sub-pixel rendering slop

async function openReader(page, { abbr, chapter, font, zoom }) {
  await page.addInitScript(
    ([f, z]) => {
      try {
        localStorage.setItem('kjb-reader-font-family', f);
        localStorage.setItem('kjb-zoom', String(z));
        localStorage.setItem('kjb-column', 'true');
        // Skip onboarding/install prompts so the reader renders immediately.
        localStorage.setItem('kjb-has-visited-app', 'true');
        localStorage.setItem('kjb-prompt-dismissed', 'true');
      } catch {}
    },
    [font, zoom]
  );
  await page.goto(`/read?book=${abbr}&chapter=${chapter}`);
  // Wait for actual verse text, not just the shell.
  await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
}

for (const viewport of VIEWPORTS) {
  test.describe(`[${viewport.name} ${viewport.width}x${viewport.height}]`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const font of FONTS) {
      for (const zoom of ZOOM_LEVELS) {
        for (const book of BOOKS) {
          test(`${book.label} — ${font} @ ${zoom}%`, async ({ page }) => {
            await openReader(page, { abbr: book.abbr, chapter: book.chapter, font, zoom });

            // ── RunningHead: book title vs "Chapter N" must never overlap ──
            const head = page.getByTestId('kjb-running-head');
            if (await head.count()) {
              const headBox = await head.boundingBox();
              const bookBox = await page.getByTestId('kjb-running-head-book').boundingBox();
              const chapterBox = await page.getByTestId('kjb-running-head-chapter').boundingBox();
              const stacked = (await head.getAttribute('data-stacked')) === 'true';

              expect(headBox, `${book.label}: RunningHead not visible`).toBeTruthy();
              expect(bookBox, `${book.label}: book title span not visible`).toBeTruthy();
              expect(chapterBox, `${book.label}: chapter span not visible`).toBeTruthy();

              if (!stacked) {
                // Inline mode: the book title's right edge must sit at or
                // before the chapter label's left edge — any overlap here is
                // the exact bug we fixed twice already.
                expect(
                  bookBox.x + bookBox.width,
                  `${book.label} (${font} @ ${zoom}%): book title overlaps "Chapter N" — RunningHead did not shrink/stack correctly`
                ).toBeLessThanOrEqual(chapterBox.x + OVERFLOW_TOLERANCE_PX);
              } else {
                // Stacked mode: chapter label must be fully below the book
                // title, not beside or overlapping it.
                expect(
                  bookBox.y + bookBox.height,
                  `${book.label} (${font} @ ${zoom}%): stacked RunningHead — chapter label overlaps book title vertically`
                ).toBeLessThanOrEqual(chapterBox.y + OVERFLOW_TOLERANCE_PX);
              }

              // Neither span may spill outside the header's own box (this
              // would mean the internal shrink-to-fit measurement itself is
              // wrong, independent of the other span).
              for (const [name, box] of [['book title', bookBox], ['chapter label', chapterBox]]) {
                expect(
                  box.x,
                  `${book.label} (${font} @ ${zoom}%): ${name} starts left of RunningHead container`
                ).toBeGreaterThanOrEqual(headBox.x - OVERFLOW_TOLERANCE_PX);
                expect(
                  box.x + box.width,
                  `${book.label} (${font} @ ${zoom}%): ${name} extends right of RunningHead container`
                ).toBeLessThanOrEqual(headBox.x + headBox.width + OVERFLOW_TOLERANCE_PX);
              }
            }

            // ── Two-column verse text: nothing may cross into the divider ──
            const container = page.getByTestId('kjb-two-col-container');
            if (await container.count()) {
              const result = await container.evaluate((el, tolerance) => {
                const containerRect = el.getBoundingClientRect();
                const style = getComputedStyle(el);
                const gapPx = parseFloat(style.columnGap) || 0;
                const leftColumnRightEdge = containerRect.left + (containerRect.width - gapPx) / 2;
                const rightColumnLeftEdge = leftColumnRightEdge + gapPx;
                const containerCenter = containerRect.left + containerRect.width / 2;

                const overflows = [];
                // Any leaf element with visible text — this is what actually
                // paints pixels, so it's what can visually "leak."
                const candidates = el.querySelectorAll('*');
                for (const node of candidates) {
                  if (node.children.length > 0) continue; // only leaves
                  const text = (node.textContent || '').trim();
                  if (!text) continue;
                  const rects = node.getClientRects();
                  for (const rect of rects) {
                    if (rect.width === 0 || rect.height === 0) continue;
                    const rectCenter = rect.left + rect.width / 2;
                    if (rectCenter < containerCenter) {
                      // Left column: right edge must not pass the divider's
                      // left-column boundary.
                      if (rect.right > leftColumnRightEdge + tolerance) {
                        overflows.push({
                          text: text.slice(0, 40),
                          side: 'left',
                          overBy: Math.round((rect.right - leftColumnRightEdge) * 10) / 10,
                        });
                      }
                    } else {
                      // Right column: left edge must not start before the
                      // divider's right-column boundary.
                      if (rect.left < rightColumnLeftEdge - tolerance) {
                        overflows.push({
                          text: text.slice(0, 40),
                          side: 'right',
                          overBy: Math.round((rightColumnLeftEdge - rect.left) * 10) / 10,
                        });
                      }
                    }
                  }
                }
                return {
                  overflows,
                  scrollWidth: el.scrollWidth,
                  clientWidth: el.clientWidth,
                };
              }, OVERFLOW_TOLERANCE_PX);

              expect(
                result.overflows,
                `${book.label} (${font} @ ${zoom}%): text leaking across the column divider:\n` +
                  result.overflows.map((o) => `  "${o.text}" (${o.side} column, over by ${o.overBy}px)`).join('\n')
              ).toEqual([]);

              // Whole-container overflow (e.g. a word too wide to break at
              // all) shows up as horizontal scroll on the container itself.
              expect(
                result.scrollWidth,
                `${book.label} (${font} @ ${zoom}%): two-column container has horizontal overflow`
              ).toBeLessThanOrEqual(result.clientWidth + OVERFLOW_TOLERANCE_PX);
            }

            // ── Flow divider overlay: a T junction at the running head's
            //    rule, never a "+" above it, never a gap below it ──
            const divider = page.getByTestId('kjb-two-col-flow-divider');
            const headForDivider = page.getByTestId('kjb-running-head');
            const containerForDivider = page.getByTestId('kjb-two-col-container');
            if ((await divider.count()) && (await containerForDivider.count())) {
              const dBox = await divider.boundingBox();
              const cBox = await containerForDivider.boundingBox();
              expect(dBox, `${book.label}: flow divider not visible`).toBeTruthy();
              expect(cBox, `${book.label}: columns container not visible`).toBeTruthy();

              // Runs the full height of the columns…
              expect(
                dBox.y + dBox.height,
                `${book.label} (${font} @ ${zoom}%): flow divider stops short of the columns' bottom`
              ).toBeGreaterThanOrEqual(cBox.y + cBox.height - OVERFLOW_TOLERANCE_PX);

              // …and sits on the column gap's exact midpoint.
              const midX = cBox.x + cBox.width / 2;
              expect(
                Math.abs(dBox.x + dBox.width / 2 - midX),
                `${book.label} (${font} @ ${zoom}%): flow divider is off the column gap midpoint`
              ).toBeLessThanOrEqual(OVERFLOW_TOLERANCE_PX);

              // The junction target is the head's OUTER box (.kjb-running-head,
              // which owns the mb-6 margin and contains the horizontal rule at
              // its very bottom edge). The kjb-running-head testid sits on the
              // inner label container, which ends 7px ABOVE the rule — using it
              // here makes a correct divider look 5.5px short.
              const headOuter = page.locator('.kjb-running-head');
              if ((await headOuter.count()) && (await headOuter.boundingBox())) {
                const hBox = await headOuter.boundingBox();
                // T junction: the divider's TOP edge must sit exactly on the
                // running head's bottom (its horizontal rule). Above it is the
                // "+" bug (line crossing over the heading); below it is the
                // abrupt-start bug the overlay exists to fix.
                expect(
                  dBox.y,
                  `${book.label} (${font} @ ${zoom}%): flow divider extends ABOVE the running head's rule (the "+" bug)`
                ).toBeGreaterThanOrEqual(hBox.y + hBox.height - OVERFLOW_TOLERANCE_PX);
                expect(
                  dBox.y,
                  `${book.label} (${font} @ ${zoom}%): flow divider starts below the running head's rule (gap at the T junction)`
                ).toBeLessThanOrEqual(hBox.y + hBox.height + OVERFLOW_TOLERANCE_PX);
              } else {
                // No running head (chapter 1): the divider matches the
                // columns box exactly, like the column-rule itself.
                expect(
                  Math.abs(dBox.y - cBox.y),
                  `${book.label} (${font} @ ${zoom}%): with no running head, flow divider should start at the columns' top`
                ).toBeLessThanOrEqual(OVERFLOW_TOLERANCE_PX);
              }
            }
          });
        }
      }
    }
  });
}

// ── App Zoom regression ─────────────────────────────────────────────────
// The matrix above covers the READER's own text zoom (kjb-zoom), which flows
// through props and re-triggers RunningHead's measurement. App Zoom
// (kjb-layout-zoom) is a different path: it scales the root font-size —
// every rem size — without changing any container's pixel width, so before
// the fix neither RunningHead nor the drop cap adapted: the book title ran
// into "Chapter N", and the floated drop-cap letter grew wider than its
// column and sank below the first line, stranding the rest of the first word
// ABOVE the cap ("OW" over the big "N" in 1 Chronicles 8).
for (const viewport of VIEWPORTS) {
  test.describe(`[${viewport.name} ${viewport.width}x${viewport.height}] App Zoom 200%`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test(`1 Chronicles 8 — header & drop cap @ App Zoom 200%`, async ({ page }) => {
      await page.addInitScript(() => {
        try {
          localStorage.setItem('kjb-reader-font-family', 'serif');
          localStorage.setItem('kjb-zoom', '100');
          localStorage.setItem('kjb-layout-zoom', '200');
          localStorage.setItem('kjb-column', 'true');
          localStorage.setItem('kjb-has-visited-app', 'true');
          localStorage.setItem('kjb-prompt-dismissed', 'true');
        } catch {}
      });
      await page.goto('/read?book=1CH&chapter=8');
      await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });

      // Header: same non-overlap contract as the matrix above.
      const head = page.getByTestId('kjb-running-head');
      const bookBox = await page.getByTestId('kjb-running-head-book').boundingBox();
      const chapterBox = await page.getByTestId('kjb-running-head-chapter').boundingBox();
      const stacked = (await head.getAttribute('data-stacked')) === 'true';
      expect(bookBox).toBeTruthy();
      expect(chapterBox).toBeTruthy();
      if (!stacked) {
        expect(bookBox.x + bookBox.width).toBeLessThanOrEqual(
          chapterBox.x + OVERFLOW_TOLERANCE_PX
        );
      } else {
        expect(bookBox.y + bookBox.height).toBeLessThanOrEqual(
          chapterBox.y + OVERFLOW_TOLERANCE_PX
        );
      }

      // Drop cap: the floated letter must sit ON the first line of its verse.
      // If it doesn't fit beside the gutter, CSS pushes the float below the
      // first line — the rest of the first word then renders ABOVE the cap.
      const letter = page.locator('.kjb-dropcap-letter');
      if (await letter.count()) {
        const check = await letter.evaluate((el) => {
          const verse = el.closest('.kjb-verse-text');
          if (!verse) return null;
          return {
            letterTop: el.getBoundingClientRect().top,
            textTop: verse.getBoundingClientRect().top,
          };
        });
        expect(check).toBeTruthy();
        expect(
          check.letterTop,
          'App Zoom 200%: drop-cap letter sank below the first line — the rest of the first word rendered above the cap'
        ).toBeLessThanOrEqual(check.textTop + 8);
      }
    });
  });
}