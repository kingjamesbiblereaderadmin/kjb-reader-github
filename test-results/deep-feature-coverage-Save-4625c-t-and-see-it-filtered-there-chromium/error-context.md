# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: deep-feature-coverage.spec.js >> Saved Verses — folders >> create a folder, move a saved verse into it, and see it filtered there
- Location: tests/deep-feature-coverage.spec.js:30:3

# Error details

```
Error: locator.click: Error: strict mode violation: getByText('Study Notes', { exact: true }) resolved to 2 elements:
    1) <button class="flex items-center gap-2 px-4 py-2 rounded-full font-sans text-sm font-medium whitespace-nowrap transition-colors bg-secondary text-secondary-foreground hover:bg-accent/20">…</button> aka locator('#kjb-scroll').getByText('Study Notes')
    2) <span class="font-sans text-sm sm:text-xs">Study Notes</span> aka getByLabel('', { exact: true }).getByText('Study Notes')

Call log:
  - waiting for getByText('Study Notes', { exact: true })

```

# Page snapshot

```yaml
- generic:
  - generic:
    - generic:
      - banner:
        - generic:
          - generic [ref=f1e1]:
            - button [ref=f1e2] [cursor=pointer]
            - link [ref=f1e3] [cursor=pointer]:
              - /url: /
          - textbox [ref=f1e9]:
            - /placeholder: Search...
          - generic:
            - button
            - button
            - button
      - main:
        - generic:
          - generic:
            - generic:
              - generic:
                - generic:
                  - heading [level=1]: Saved Verses
                  - paragraph: 1 verse saved
                - generic:
                  - generic:
                    - textbox:
                      - /placeholder: Search saved verses...
                  - button
                  - button
                - generic:
                  - button: All
                  - generic:
                    - button: Favorites
                  - generic:
                    - button: Study Notes
                  - button: New Folder
                - generic:
                  - generic:
                    - button:
                      - paragraph: John 3:16 Favorites
                      - blockquote: "\"¶ For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.\""
                    - generic:
                      - button [expanded]
                      - button
                      - button
                      - button
      - navigation:
        - generic:
          - generic:
            - button:
              - generic: Home
            - button:
              - generic: Contents
            - button:
              - generic: Read
            - button:
              - generic: Gospel
            - button
    - region "Notifications alt+T"
  - menu [active] [ref=f1e10]:
    - generic [ref=f1e11]: Move to...
    - menuitem "Favorites" [ref=f1e12]
    - menuitem "Study Notes" [ref=f1e16]
    - separator [ref=f1e20]
    - menuitem "New Folder..." [ref=f1e21]
```

# Test source

```ts
  1   | /**
  2   |  * Deep feature coverage — the remaining user-facing gaps identified in a
  3   |  * full feature audit: Saved Verses folders, select-mode bulk actions
  4   |  * (copy/share/print/save/highlight/read-selected), the toolbar Print
  5   |  * dropdown, and an actual (not just UI-toggle) Download Bible export.
  6   |  *
  7   |  * Deliberately NOT covered here: internal admin/dev tooling
  8   |  * (/dev-tools, /manifest-icons, /manifest-screenshots, /refresh-cache) —
  9   |  * these aren't reader-facing features, and the "Share Card" image cropper
  10  |  * only exists inside /manifest-screenshots (app-store screenshot
  11  |  * generation), not as a real user flow.
  12  |  */
  13  | import { test, expect } from '@playwright/test';
  14  | import { checkOverflow } from './utils/overflow.js';
  15  | 
  16  | const TOLERANCE_PX = 1.5;
  17  | 
  18  | async function assertNoOverflow(page, label) {
  19  |   const offenders = await page.evaluate(checkOverflow, TOLERANCE_PX);
  20  |   expect(offenders, `${label}: horizontal overflow:\n` + offenders.map((o) => `  <${o.tag}> "${o.text}" (over by ${o.overBy}px)`).join('\n')).toEqual([]);
  21  | }
  22  | 
  23  | function verseLocator(page, n) {
  24  |   return page.locator(`#v${n} .kjb-verse-text`);
  25  | }
  26  | 
  27  | test.describe('Saved Verses — folders', () => {
  28  |   test.use({ viewport: { width: 393, height: 900 } });
  29  | 
  30  |   test('create a folder, move a saved verse into it, and see it filtered there', async ({ page }) => {
  31  |     // Save a verse first so there's something to organize. Storage is
  32  |     // cleared via evaluate() right after the FIRST navigation, not via
  33  |     // addInitScript — addInitScript re-runs on every subsequent
  34  |     // page.goto() in this test (it fires on every navigation, not just
  35  |     // the first), which would wipe the verse right as we navigate to
  36  |     // /saved to check it.
  37  |     await page.goto('/read?book=JHN&chapter=3');
  38  |     await page.evaluate(() => {
  39  |       try {
  40  |         localStorage.removeItem('kjb-saved-verses');
  41  |         localStorage.removeItem('kjb-saved-folders');
  42  |       } catch {}
  43  |     });
  44  |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  45  |     await verseLocator(page, 16).click();
  46  |     await page.getByRole('button', { name: /^Save/ }).click();
  47  |     await page.waitForFunction(() => !!localStorage.getItem('kjb-saved-verses'), { timeout: 10000 });
  48  | 
  49  |     await page.goto('/saved');
  50  |     await assertNoOverflow(page, 'saved verses page');
  51  | 
  52  |     // The Move button opens a dropdown with a New Folder... item, which
  53  |     // uses a native window.prompt() -- intercept it and supply a name.
  54  |     page.once('dialog', async (dialog) => {
  55  |       expect(dialog.type()).toBe('prompt');
  56  |       await dialog.accept('Study Notes');
  57  |     });
  58  |     await page.getByTitle('Move').first().click();
  59  |     await page.getByText('New Folder...').click();
  60  |     await page.waitForTimeout(500);
  61  | 
  62  |     // Creating a folder auto-switches the active filter to it (empty, since
  63  |     // the verse hasn't been moved yet) -- that hides the verse card, and
  64  |     // with it the Move button. Switch back to All to see the card again
  65  |     // before moving the verse into the now-existing folder.
  66  |     await page.getByRole('button', { name: 'All', exact: true }).click();
  67  |     await page.waitForTimeout(300);
  68  |     await page.getByTitle('Move').first().click();
> 69  |     await page.getByText('Study Notes', { exact: true }).click();
      |                                                          ^ Error: locator.click: Error: strict mode violation: getByText('Study Notes', { exact: true }) resolved to 2 elements:
  70  |     await page.waitForTimeout(500);
  71  | 
  72  |     // Filter to that folder and confirm the verse shows there.
  73  |     const folderTab = page.getByRole('button', { name: 'Study Notes', exact: true }).first();
  74  |     if (await folderTab.count()) {
  75  |       await folderTab.click();
  76  |       await assertNoOverflow(page, 'filtered to Study Notes folder');
  77  |       await expect(page.locator('body')).toContainText(/John/i);
  78  |     }
  79  | 
  80  |     const stored = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  81  |     expect(stored).toContain('Study Notes');
  82  |   });
  83  | });
  84  | 
  85  | test.describe('Select mode — bulk actions in the reader', () => {
  86  |   test.use({ viewport: { width: 393, height: 900 } });
  87  | 
  88  |   test.beforeEach(async ({ page }) => {
  89  |     await page.addInitScript(() => {
  90  |       try {
  91  |         localStorage.removeItem('kjb-saved-verses');
  92  |         localStorage.removeItem('kjb-verse-highlights');
  93  |       } catch {}
  94  |     });
  95  |     await page.goto('/read?book=JHN&chapter=3');
  96  |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  97  |     // Enter select mode via a verse's popover, then select a small range.
  98  |     await verseLocator(page, 16).click();
  99  |     const selectBtn = page.getByTitle('Select verses');
  100 |     await selectBtn.click();
  101 |     await verseLocator(page, 17).click().catch(() => {});
  102 |     await verseLocator(page, 18).click().catch(() => {});
  103 |   });
  104 | 
  105 |   test('bulk action bar renders with no overflow and shows a real selection count', async ({ page }) => {
  106 |     await assertNoOverflow(page, 'select mode action bar');
  107 |     await expect(page.locator('body')).toContainText(/selected/);
  108 |   });
  109 | 
  110 |   test('Copy (Passage) and Copy (Per Verse) do not throw', async ({ page }) => {
  111 |     const errors = [];
  112 |     page.on('pageerror', (e) => errors.push(e.message));
  113 | 
  114 |     await page.getByRole('button', { name: /^Copy/ }).click();
  115 |     await page.getByText('Copy (Passage)').click();
  116 |     await page.waitForTimeout(300);
  117 | 
  118 |     await page.getByRole('button', { name: /Copied!|^Copy/ }).click();
  119 |     const perVerseItem = page.getByText('Copy (Per Verse)');
  120 |     if (await perVerseItem.count()) {
  121 |       await perVerseItem.click();
  122 |       await page.waitForTimeout(300);
  123 |     }
  124 | 
  125 |     expect(errors, `errors during bulk copy:\n${errors.join('\n')}`).toEqual([]);
  126 |   });
  127 | 
  128 |   test('bulk Save persists all selected verses to localStorage', async ({ page }) => {
  129 |     await page.getByRole('button', { name: /^Save/ }).click();
  130 |     await page.waitForTimeout(500);
  131 |     const stored = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  132 |     expect(stored).toBeTruthy();
  133 |     const parsed = JSON.parse(stored);
  134 |     expect(parsed.length).toBeGreaterThanOrEqual(2);
  135 |   });
  136 | 
  137 |   test('bulk Highlight applies a color to the selection', async ({ page }) => {
  138 |     await page.getByRole('button', { name: /^Highlight/ }).click();
  139 |     const firstColor = page.getByRole('menuitem').first();
  140 |     await firstColor.waitFor({ state: 'visible', timeout: 5000 });
  141 |     await firstColor.click();
  142 |     await page.waitForTimeout(500);
  143 |     const stored = await page.evaluate(() => localStorage.getItem('kjb-verse-highlights'));
  144 |     expect(stored).toBeTruthy();
  145 |   });
  146 | 
  147 |   test('Print Full Page and Print Selected Verses do not throw (window.print stubbed)', async ({ page }) => {
  148 |     const errors = [];
  149 |     page.on('pageerror', (e) => errors.push(e.message));
  150 |     // window.print() would otherwise try to open a real OS print dialog,
  151 |     // which hangs a headless run — stub it to confirm the app's own code
  152 |     // around the call doesn't throw, without actually invoking print UI.
  153 |     await page.evaluate(() => { window.print = () => {}; });
  154 | 
  155 |     await page.getByRole('button', { name: /^Print/ }).click();
  156 |     await page.getByText('Print Full Page').click();
  157 |     await page.waitForTimeout(300);
  158 | 
  159 |     await page.getByRole('button', { name: /^Print/ }).click();
  160 |     const printSelected = page.getByText('Print Selected Verses');
  161 |     if (await printSelected.count()) {
  162 |       await printSelected.click();
  163 |       await page.waitForTimeout(300);
  164 |     }
  165 | 
  166 |     expect(errors, `errors during print:\n${errors.join('\n')}`).toEqual([]);
  167 |   });
  168 | 
  169 |   test('Read Selected and Show Full Chapter change what is displayed', async ({ page }) => {
```