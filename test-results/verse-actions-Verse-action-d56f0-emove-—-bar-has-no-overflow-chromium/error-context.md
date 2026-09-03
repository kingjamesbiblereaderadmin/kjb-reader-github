# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: verse-actions.spec.js >> Verse actions [360px] >> tap verse, highlight it with a color, then remove — bar has no overflow
- Location: tests/verse-actions.spec.js:39:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /^Highlighted/ })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('button', { name: /^Highlighted/ })

```

```yaml
- region "Notifications alt+T"
- menu "Highlighted":
  - menuitem "Remove Highlight"
  - menuitem "Yellow"
  - menuitem "Green"
  - menuitem "Blue"
  - menuitem "Pink"
  - menuitem "Purple"
```

# Test source

```ts
  1   | /**
  2   |  * Verse action tests — tap a verse, use the inline VerseTapBar (Highlight
  3   |  * dropdown with color choices/Copy/Share/Save/Close), and confirm the Saved
  4   |  * Verses page reflects saves and deletions correctly (round-trips through
  5   |  * real localStorage, not mocked).
  6   |  */
  7   | import { test, expect } from '@playwright/test';
  8   | import { checkOverflow } from './utils/overflow.js';
  9   | 
  10  | const WIDTHS = [360, 393];
  11  | const TOLERANCE_PX = 1.5;
  12  | 
  13  | async function assertNoOverflow(page, label) {
  14  |   const offenders = await page.evaluate(checkOverflow, TOLERANCE_PX);
  15  |   expect(offenders, `${label}: horizontal overflow:\n` + offenders.map((o) => `  <${o.tag}> "${o.text}" (over by ${o.overBy}px)`).join('\n')).toEqual([]);
  16  | }
  17  | 
  18  | // The clickable target is the inner `.kjb-verse-text` span, not the outer
  19  | // `#v{n}` wrapper (which also contains the verse-number <sup> and has extra
  20  | // padding) — clicking the wrapper's bounding-box center can miss the
  21  | // element that actually has the onClick handler.
  22  | function verseLocator(page, n) {
  23  |   return page.locator(`#v${n} .kjb-verse-text`);
  24  | }
  25  | 
  26  | for (const width of WIDTHS) {
  27  |   test.describe(`Verse actions [${width}px]`, () => {
  28  |     test.use({ viewport: { width, height: 900 } });
  29  | 
  30  |     test.beforeEach(async ({ page }) => {
  31  |       await page.addInitScript(() => {
  32  |         try {
  33  |           localStorage.removeItem('kjb-saved-verses');
  34  |           localStorage.removeItem('kjb-highlighted-verses');
  35  |         } catch {}
  36  |       });
  37  |     });
  38  | 
  39  |     test('tap verse, highlight it with a color, then remove — bar has no overflow', async ({ page }) => {
  40  |       await page.goto('/read?book=JHN&chapter=3');
  41  |       await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  42  | 
  43  |       await verseLocator(page, 16).click();
  44  |       const highlightTrigger = page.getByRole('button', { name: /^Highlight/ });
  45  |       await expect(highlightTrigger).toBeVisible({ timeout: 10000 });
  46  |       await assertNoOverflow(page, 'VerseTapBar open');
  47  | 
  48  |       await highlightTrigger.click();
  49  |       const firstColor = page.getByRole('menuitem').first();
  50  |       await expect(firstColor).toBeVisible({ timeout: 5000 });
  51  |       await firstColor.click();
  52  | 
  53  |       // Button label flips to "Highlighted" once applied.
> 54  |       await expect(page.getByRole('button', { name: /^Highlighted/ })).toBeVisible({ timeout: 10000 });
      |                                                                        ^ Error: expect(locator).toBeVisible() failed
  55  | 
  56  |       const stored = await page.evaluate(() => localStorage.getItem('kjb-highlighted-verses'));
  57  |       expect(stored, 'highlight was not persisted').toBeTruthy();
  58  | 
  59  |       // Remove it via the dropdown's "Remove Highlight" item.
  60  |       await page.getByRole('button', { name: /^Highlighted/ }).click();
  61  |       await page.getByRole('menuitem', { name: 'Remove Highlight' }).click();
  62  |       await expect(page.getByRole('button', { name: /^Highlight$/ })).toBeVisible({ timeout: 10000 });
  63  |     });
  64  | 
  65  |     test('copy and share actions do not throw', async ({ page }) => {
  66  |       const errors = [];
  67  |       page.on('pageerror', (e) => errors.push(e.message));
  68  | 
  69  |       await page.goto('/read?book=JHN&chapter=3');
  70  |       await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  71  |       await verseLocator(page, 16).click();
  72  | 
  73  |       await page.getByRole('button', { name: /^Copy/ }).click();
  74  |       await page.waitForTimeout(300);
  75  |       await page.getByRole('button', { name: /^Share/ }).click().catch(() => {});
  76  |       await page.waitForTimeout(300);
  77  | 
  78  |       expect(errors, `errors during copy/share:\n${errors.join('\n')}`).toEqual([]);
  79  |     });
  80  | 
  81  |     test('save a verse via the tap bar, see it on Saved Verses, then remove it', async ({ page }) => {
  82  |       await page.goto('/read?book=JHN&chapter=3');
  83  |       await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  84  | 
  85  |       await verseLocator(page, 16).click();
  86  |       await page.getByRole('button', { name: /^Save/ }).click();
  87  | 
  88  |       await page.waitForTimeout(500);
  89  |       const saved = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  90  |       expect(saved, 'verse was not persisted after Save').toBeTruthy();
  91  | 
  92  |       await page.goto('/saved');
  93  |       await assertNoOverflow(page, 'saved verses list');
  94  |       await expect(page.locator('body')).toContainText(/John/i);
  95  | 
  96  |       const removeBtn = page.getByTitle('Remove').first();
  97  |       if (await removeBtn.count()) {
  98  |         await removeBtn.click();
  99  |         await page.waitForTimeout(300);
  100 |         const savedAfterRemove = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  101 |         const parsed = savedAfterRemove ? JSON.parse(savedAfterRemove) : [];
  102 |         expect(parsed.length, 'verse still present in storage after removing').toBe(0);
  103 |       }
  104 |     });
  105 | 
  106 |     test('close button dismisses the tap bar', async ({ page }) => {
  107 |       await page.goto('/read?book=JHN&chapter=3');
  108 |       await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  109 | 
  110 |       await verseLocator(page, 16).click();
  111 |       const highlightTrigger = page.getByRole('button', { name: /^Highlight/ });
  112 |       await expect(highlightTrigger).toBeVisible({ timeout: 10000 });
  113 | 
  114 |       await page.getByRole('button', { name: /^Close$/ }).click();
  115 |       await expect(highlightTrigger).toBeHidden({ timeout: 5000 });
  116 |     });
  117 |   });
  118 | }
  119 | 
```