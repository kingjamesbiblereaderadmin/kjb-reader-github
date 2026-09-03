# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: deep-feature-coverage.spec.js >> Saved Verses — folders >> create a folder, move a saved verse into it, and see it filtered there
- Location: tests/deep-feature-coverage.spec.js:39:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTitle('Move').first()

```

# Page snapshot

```yaml
- generic [ref=f1e2]:
  - generic [ref=f1e3]:
    - banner [ref=f1e4]:
      - generic [ref=f1e5]:
        - generic [ref=f1e6]:
          - button "Back" [ref=f1e7] [cursor=pointer]
          - link "Home" [ref=f1e8] [cursor=pointer]:
            - /url: /
        - textbox "Search..." [ref=f1e14]
        - generic [ref=f1e15]:
          - button "Toggle fullscreen" [ref=f1e16] [cursor=pointer]
          - button "Toggle theme" [ref=f1e17] [cursor=pointer]
          - button "Open menu" [ref=f1e18] [cursor=pointer]
    - main [ref=f1e19]:
      - generic [ref=f1e23]:
        - generic [ref=f1e24]:
          - heading "Saved Verses" [level=1] [ref=f1e28]
          - paragraph [ref=f1e29]: 0 verses saved
        - generic [ref=f1e31]:
          - button "All" [ref=f1e32] [cursor=pointer]
          - button "Favorites" [ref=f1e34] [cursor=pointer]
          - button "New Folder" [ref=f1e37] [cursor=pointer]
        - generic [ref=f1e40]:
          - paragraph [ref=f1e43]: No saved verses yet
          - paragraph [ref=f1e44]: Tap any verse while reading and press the bookmark icon to save it.
          - button "Start Reading" [ref=f1e45] [cursor=pointer]
    - navigation [ref=f1e48]:
      - generic [ref=f1e50]:
        - button "Home" [ref=f1e51] [cursor=pointer]
        - button "Contents" [ref=f1e56] [cursor=pointer]
        - button "Read" [ref=f1e59] [cursor=pointer]
        - button "Gospel" [ref=f1e63] [cursor=pointer]
        - button "Toggle navigation rows" [ref=f1e67] [cursor=pointer]
  - region "Notifications alt+T"
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
  30  |   test.beforeEach(async ({ page }) => {
  31  |     await page.addInitScript(() => {
  32  |       try {
  33  |         localStorage.removeItem('kjb-saved-verses');
  34  |         localStorage.removeItem('kjb-saved-folders');
  35  |       } catch {}
  36  |     });
  37  |   });
  38  | 
  39  |   test('create a folder, move a saved verse into it, and see it filtered there', async ({ page }) => {
  40  |     // Save a verse first so there's something to organize.
  41  |     await page.goto('/read?book=JHN&chapter=3');
  42  |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  43  |     await verseLocator(page, 16).click();
  44  |     await page.getByRole('button', { name: /^Save/ }).click();
  45  |     await page.waitForFunction(() => !!localStorage.getItem('kjb-saved-verses'), { timeout: 10000 });
  46  | 
  47  |     await page.goto('/saved');
  48  |     await assertNoOverflow(page, 'saved verses page');
  49  | 
  50  |     // "Move" button opens a dropdown with "New Folder..." which uses a
  51  |     // native window.prompt() — intercept it and supply a name.
  52  |     page.once('dialog', async (dialog) => {
  53  |       expect(dialog.type()).toBe('prompt');
  54  |       await dialog.accept('Study Notes');
  55  |     });
> 56  |     await page.getByTitle('Move').first().click();
      |                                           ^ Error: locator.click: Test timeout of 30000ms exceeded.
  57  |     await page.getByText('New Folder...').click();
  58  |     await page.waitForTimeout(500);
  59  | 
  60  |     // Moving into the new folder: reopen Move, pick the folder by name.
  61  |     await page.getByTitle('Move').first().click();
  62  |     await page.getByText('Study Notes', { exact: true }).click();
  63  |     await page.waitForTimeout(500);
  64  | 
  65  |     // Filter to that folder and confirm the verse shows there.
  66  |     const folderTab = page.getByRole('button', { name: 'Study Notes', exact: true }).first();
  67  |     if (await folderTab.count()) {
  68  |       await folderTab.click();
  69  |       await assertNoOverflow(page, 'filtered to Study Notes folder');
  70  |       await expect(page.locator('body')).toContainText(/John/i);
  71  |     }
  72  | 
  73  |     const stored = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  74  |     expect(stored).toContain('Study Notes');
  75  |   });
  76  | });
  77  | 
  78  | test.describe('Select mode — bulk actions in the reader', () => {
  79  |   test.use({ viewport: { width: 393, height: 900 } });
  80  | 
  81  |   test.beforeEach(async ({ page }) => {
  82  |     await page.addInitScript(() => {
  83  |       try {
  84  |         localStorage.removeItem('kjb-saved-verses');
  85  |         localStorage.removeItem('kjb-verse-highlights');
  86  |       } catch {}
  87  |     });
  88  |     await page.goto('/read?book=JHN&chapter=3');
  89  |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  90  |     // Enter select mode via a verse's popover, then select a small range.
  91  |     await verseLocator(page, 16).click();
  92  |     const selectBtn = page.getByTitle('Select verses');
  93  |     await selectBtn.click();
  94  |     await verseLocator(page, 17).click().catch(() => {});
  95  |     await verseLocator(page, 18).click().catch(() => {});
  96  |   });
  97  | 
  98  |   test('bulk action bar renders with no overflow and shows a real selection count', async ({ page }) => {
  99  |     await assertNoOverflow(page, 'select mode action bar');
  100 |     await expect(page.locator('body')).toContainText(/selected/);
  101 |   });
  102 | 
  103 |   test('Copy (Passage) and Copy (Per Verse) do not throw', async ({ page }) => {
  104 |     const errors = [];
  105 |     page.on('pageerror', (e) => errors.push(e.message));
  106 | 
  107 |     await page.getByRole('button', { name: /^Copy/ }).click();
  108 |     await page.getByText('Copy (Passage)').click();
  109 |     await page.waitForTimeout(300);
  110 | 
  111 |     await page.getByRole('button', { name: /Copied!|^Copy/ }).click();
  112 |     const perVerseItem = page.getByText('Copy (Per Verse)');
  113 |     if (await perVerseItem.count()) {
  114 |       await perVerseItem.click();
  115 |       await page.waitForTimeout(300);
  116 |     }
  117 | 
  118 |     expect(errors, `errors during bulk copy:\n${errors.join('\n')}`).toEqual([]);
  119 |   });
  120 | 
  121 |   test('bulk Save persists all selected verses to localStorage', async ({ page }) => {
  122 |     await page.getByRole('button', { name: /^Save/ }).click();
  123 |     await page.waitForTimeout(500);
  124 |     const stored = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  125 |     expect(stored).toBeTruthy();
  126 |     const parsed = JSON.parse(stored);
  127 |     expect(parsed.length).toBeGreaterThanOrEqual(2);
  128 |   });
  129 | 
  130 |   test('bulk Highlight applies a color to the selection', async ({ page }) => {
  131 |     await page.getByRole('button', { name: /^Highlight/ }).click();
  132 |     const firstColor = page.getByRole('menuitem').first();
  133 |     await firstColor.waitFor({ state: 'visible', timeout: 5000 });
  134 |     await firstColor.click();
  135 |     await page.waitForTimeout(500);
  136 |     const stored = await page.evaluate(() => localStorage.getItem('kjb-verse-highlights'));
  137 |     expect(stored).toBeTruthy();
  138 |   });
  139 | 
  140 |   test('Print Full Page and Print Selected Verses do not throw (window.print stubbed)', async ({ page }) => {
  141 |     const errors = [];
  142 |     page.on('pageerror', (e) => errors.push(e.message));
  143 |     // window.print() would otherwise try to open a real OS print dialog,
  144 |     // which hangs a headless run — stub it to confirm the app's own code
  145 |     // around the call doesn't throw, without actually invoking print UI.
  146 |     await page.evaluate(() => { window.print = () => {}; });
  147 | 
  148 |     await page.getByRole('button', { name: /^Print/ }).click();
  149 |     await page.getByText('Print Full Page').click();
  150 |     await page.waitForTimeout(300);
  151 | 
  152 |     await page.getByRole('button', { name: /^Print/ }).click();
  153 |     const printSelected = page.getByText('Print Selected Verses');
  154 |     if (await printSelected.count()) {
  155 |       await printSelected.click();
  156 |       await page.waitForTimeout(300);
```