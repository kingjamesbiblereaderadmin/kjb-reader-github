# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: deep-feature-coverage.spec.js >> Saved Verses — folders >> create a folder, move a saved verse into it, and see it filtered there
- Location: tests/deep-feature-coverage.spec.js:30:3

# Error details

```
Error: filtered to Study Notes folder: horizontal overflow:
  <ol> "Moved to Study Notes" (over by 16px)

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 8

- Array []
+ Array [
+   Object {
+     "cls": "toaster group",
+     "overBy": 16,
+     "tag": "ol",
+     "text": "Moved to Study Notes",
+   },
+ ]
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
            - button "Study Notes" [active] [ref=f1e53] [cursor=pointer]
            - button "Delete Folder" [ref=f1e56] [cursor=pointer]
          - button "New Folder" [ref=f1e60] [cursor=pointer]
        - generic [ref=f1e64]:
          - button [ref=f1e65] [cursor=pointer]:
            - paragraph [ref=f1e66]: John 3:16
            - blockquote [ref=f1e67]: "\"¶ For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.\""
          - generic [ref=f1e68]:
            - button "Move" [ref=f1e69] [cursor=pointer]
            - button "Copy" [ref=f1e72] [cursor=pointer]
            - button "Share" [ref=f1e76] [cursor=pointer]
            - button "Remove" [ref=f1e83] [cursor=pointer]
    - navigation [ref=f1e87]:
      - generic [ref=f1e89]:
        - button "Home" [ref=f1e90] [cursor=pointer]
        - button "Contents" [ref=f1e95] [cursor=pointer]
        - button "Read" [ref=f1e98] [cursor=pointer]
        - button "Gospel" [ref=f1e102] [cursor=pointer]
        - button "Toggle navigation rows" [ref=f1e106] [cursor=pointer]
  - region "Notifications alt+T":
    - list:
      - listitem [ref=f1e109]:
        - generic [ref=f1e113]: Moved to Study Notes
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
> 20  |   expect(offenders, `${label}: horizontal overflow:\n` + offenders.map((o) => `  <${o.tag}> "${o.text}" (over by ${o.overBy}px)`).join('\n')).toEqual([]);
      |                                                                                                                                               ^ Error: filtered to Study Notes folder: horizontal overflow:
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
  69  |     await page.getByRole('menuitem', { name: 'Study Notes' }).click();
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
```