# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: deep-feature-coverage.spec.js >> Saved Verses — folders >> create a folder, move a saved verse into it, and see it filtered there
- Location: tests/deep-feature-coverage.spec.js:30:3

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
          - paragraph [ref=f1e29]: 1 verse saved
        - generic [ref=f1e31]:
          - textbox "Search saved verses..." [ref=f1e36]
          - button "Print saved verses" [ref=f1e37] [cursor=pointer]
          - button "Select verses" [ref=f1e42] [cursor=pointer]
        - generic [ref=f1e46]:
          - button "All" [ref=f1e47] [cursor=pointer]
          - button "Favorites" [ref=f1e49] [cursor=pointer]
          - generic [ref=f1e52]:
            - button "Study Notes" [ref=f1e53] [cursor=pointer]
            - button "Delete Folder" [ref=f1e56] [cursor=pointer]
          - button "New Folder" [ref=f1e60] [cursor=pointer]
        - paragraph [ref=f1e65]: No verses in this folder.
    - navigation [ref=f1e66]:
      - generic [ref=f1e68]:
        - button "Home" [ref=f1e69] [cursor=pointer]
        - button "Contents" [ref=f1e74] [cursor=pointer]
        - button "Read" [ref=f1e77] [cursor=pointer]
        - button "Gospel" [ref=f1e81] [cursor=pointer]
        - button "Toggle navigation rows" [ref=f1e85] [cursor=pointer]
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
  52  |     // "Move" button opens a dropdown with "New Folder..." which uses a
  53  |     // native window.prompt() — intercept it and supply a name.
  54  |     page.once('dialog', async (dialog) => {
  55  |       expect(dialog.type()).toBe('prompt');
  56  |       await dialog.accept('Study Notes');
  57  |     });
  58  |     await page.getByTitle('Move').first().click();
  59  |     await page.getByText('New Folder...').click();
  60  |     await page.waitForTimeout(500);
  61  | 
  62  |     // Moving into the new folder: reopen Move, pick the folder by name.
> 63  |     await page.getByTitle('Move').first().click();
      |                                           ^ Error: locator.click: Test timeout of 30000ms exceeded.
  64  |     await page.getByText('Study Notes', { exact: true }).click();
  65  |     await page.waitForTimeout(500);
  66  | 
  67  |     // Filter to that folder and confirm the verse shows there.
  68  |     const folderTab = page.getByRole('button', { name: 'Study Notes', exact: true }).first();
  69  |     if (await folderTab.count()) {
  70  |       await folderTab.click();
  71  |       await assertNoOverflow(page, 'filtered to Study Notes folder');
  72  |       await expect(page.locator('body')).toContainText(/John/i);
  73  |     }
  74  | 
  75  |     const stored = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  76  |     expect(stored).toContain('Study Notes');
  77  |   });
  78  | });
  79  | 
  80  | test.describe('Select mode — bulk actions in the reader', () => {
  81  |   test.use({ viewport: { width: 393, height: 900 } });
  82  | 
  83  |   test.beforeEach(async ({ page }) => {
  84  |     await page.addInitScript(() => {
  85  |       try {
  86  |         localStorage.removeItem('kjb-saved-verses');
  87  |         localStorage.removeItem('kjb-verse-highlights');
  88  |       } catch {}
  89  |     });
  90  |     await page.goto('/read?book=JHN&chapter=3');
  91  |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  92  |     // Enter select mode via a verse's popover, then select a small range.
  93  |     await verseLocator(page, 16).click();
  94  |     const selectBtn = page.getByTitle('Select verses');
  95  |     await selectBtn.click();
  96  |     await verseLocator(page, 17).click().catch(() => {});
  97  |     await verseLocator(page, 18).click().catch(() => {});
  98  |   });
  99  | 
  100 |   test('bulk action bar renders with no overflow and shows a real selection count', async ({ page }) => {
  101 |     await assertNoOverflow(page, 'select mode action bar');
  102 |     await expect(page.locator('body')).toContainText(/selected/);
  103 |   });
  104 | 
  105 |   test('Copy (Passage) and Copy (Per Verse) do not throw', async ({ page }) => {
  106 |     const errors = [];
  107 |     page.on('pageerror', (e) => errors.push(e.message));
  108 | 
  109 |     await page.getByRole('button', { name: /^Copy/ }).click();
  110 |     await page.getByText('Copy (Passage)').click();
  111 |     await page.waitForTimeout(300);
  112 | 
  113 |     await page.getByRole('button', { name: /Copied!|^Copy/ }).click();
  114 |     const perVerseItem = page.getByText('Copy (Per Verse)');
  115 |     if (await perVerseItem.count()) {
  116 |       await perVerseItem.click();
  117 |       await page.waitForTimeout(300);
  118 |     }
  119 | 
  120 |     expect(errors, `errors during bulk copy:\n${errors.join('\n')}`).toEqual([]);
  121 |   });
  122 | 
  123 |   test('bulk Save persists all selected verses to localStorage', async ({ page }) => {
  124 |     await page.getByRole('button', { name: /^Save/ }).click();
  125 |     await page.waitForTimeout(500);
  126 |     const stored = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  127 |     expect(stored).toBeTruthy();
  128 |     const parsed = JSON.parse(stored);
  129 |     expect(parsed.length).toBeGreaterThanOrEqual(2);
  130 |   });
  131 | 
  132 |   test('bulk Highlight applies a color to the selection', async ({ page }) => {
  133 |     await page.getByRole('button', { name: /^Highlight/ }).click();
  134 |     const firstColor = page.getByRole('menuitem').first();
  135 |     await firstColor.waitFor({ state: 'visible', timeout: 5000 });
  136 |     await firstColor.click();
  137 |     await page.waitForTimeout(500);
  138 |     const stored = await page.evaluate(() => localStorage.getItem('kjb-verse-highlights'));
  139 |     expect(stored).toBeTruthy();
  140 |   });
  141 | 
  142 |   test('Print Full Page and Print Selected Verses do not throw (window.print stubbed)', async ({ page }) => {
  143 |     const errors = [];
  144 |     page.on('pageerror', (e) => errors.push(e.message));
  145 |     // window.print() would otherwise try to open a real OS print dialog,
  146 |     // which hangs a headless run — stub it to confirm the app's own code
  147 |     // around the call doesn't throw, without actually invoking print UI.
  148 |     await page.evaluate(() => { window.print = () => {}; });
  149 | 
  150 |     await page.getByRole('button', { name: /^Print/ }).click();
  151 |     await page.getByText('Print Full Page').click();
  152 |     await page.waitForTimeout(300);
  153 | 
  154 |     await page.getByRole('button', { name: /^Print/ }).click();
  155 |     const printSelected = page.getByText('Print Selected Verses');
  156 |     if (await printSelected.count()) {
  157 |       await printSelected.click();
  158 |       await page.waitForTimeout(300);
  159 |     }
  160 | 
  161 |     expect(errors, `errors during print:\n${errors.join('\n')}`).toEqual([]);
  162 |   });
  163 | 
```