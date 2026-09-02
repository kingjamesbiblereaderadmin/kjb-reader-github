# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: search.spec.js >> Search [360px] >> word search returns results and renders without overflow
- Location: tests/search.spec.js:31:5

# Error details

```
Error: search results: "love": horizontal overflow:
  <div> ""

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 6

- Array []
+ Array [
+   Object {
+     "tag": "div",
+     "text": "",
+   },
+ ]
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - img "KJB Reader Logo" [ref=e5]
    - generic [ref=e6]: WELCOME TO KJB READER (GUEST MODE)
  - generic [ref=e10]:
    - banner [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]:
          - button "Back" [ref=e14] [cursor=pointer]
          - link "Home" [ref=e15] [cursor=pointer]:
            - /url: /
        - textbox "Search..." [ref=e21]
        - generic [ref=e22]:
          - button "Toggle fullscreen" [ref=e23] [cursor=pointer]
          - button "Toggle theme" [ref=e24] [cursor=pointer]
          - button "Open menu" [ref=e25] [cursor=pointer]
    - main [ref=e26]:
      - generic [ref=e30]:
        - generic [ref=e31]:
          - heading "Search Bible" [level=1] [ref=e32]
          - generic [ref=e33]:
            - textbox "e.g. study, Romans 3:25, 1 Corinthians 15:1-4" [ref=e36]: love
            - button [disabled] [ref=e37]
          - generic [ref=e40]:
            - generic [ref=e43]: "Testament:"
            - combobox [ref=e44] [cursor=pointer]:
              - generic: All
            - button "Books" [ref=e47] [cursor=pointer]
            - generic [ref=e52]:
              - checkbox "Match whole word" [ref=e53] [cursor=pointer]
              - generic [ref=e54] [cursor=pointer]: Match whole word
            - generic [ref=e55]:
              - checkbox "Match case" [ref=e56] [cursor=pointer]
              - generic [ref=e57] [cursor=pointer]: Match case
        - generic [ref=e58]: Searching the KJB...
    - navigation [ref=e63]:
      - generic [ref=e65]:
        - button "Home" [ref=e66] [cursor=pointer]
        - button "Contents" [ref=e71] [cursor=pointer]
        - button "Read" [ref=e74] [cursor=pointer]
        - button "Gospel" [ref=e78] [cursor=pointer]
        - button "Toggle navigation rows" [ref=e82] [cursor=pointer]
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | /**
  2  |  * Search feature tests — the main search page and advanced search filters.
  3  |  */
  4  | import { test, expect } from '@playwright/test';
  5  | 
  6  | const WIDTHS = [360, 393];
  7  | const TOLERANCE_PX = 1.5;
  8  | 
  9  | async function assertNoOverflow(page, label) {
  10 |   const overflow = await page.evaluate((tolerance) => {
  11 |     const docWidth = document.documentElement.clientWidth;
  12 |     const offenders = [];
  13 |     for (const el of document.querySelectorAll('body *')) {
  14 |       const style = getComputedStyle(el);
  15 |       if (style.display === 'none' || style.visibility === 'hidden') continue;
  16 |       const rect = el.getBoundingClientRect();
  17 |       if (rect.width === 0 && rect.height === 0) continue;
  18 |       if (rect.right > docWidth + tolerance) {
  19 |         offenders.push({ tag: el.tagName.toLowerCase(), text: (el.textContent || '').trim().slice(0, 50) });
  20 |       }
  21 |     }
  22 |     return [...new Map(offenders.map((o) => [`${o.tag}:${o.text}`, o])).values()];
  23 |   }, TOLERANCE_PX);
> 24 |   expect(overflow, `${label}: horizontal overflow:\n` + overflow.map((o) => `  <${o.tag}> "${o.text}"`).join('\n')).toEqual([]);
     |                                                                                                                     ^ Error: search results: "love": horizontal overflow:
  25 | }
  26 | 
  27 | for (const width of WIDTHS) {
  28 |   test.describe(`Search [${width}px]`, () => {
  29 |     test.use({ viewport: { width, height: 900 } });
  30 | 
  31 |     test('word search returns results and renders without overflow', async ({ page }) => {
  32 |       await page.goto('/search');
  33 |       const input = page.getByPlaceholder(/study, Romans 3:25/i);
  34 |       await input.fill('love');
  35 |       await input.press('Enter');
  36 | 
  37 |       // Results render as grouped-by-book sections; wait for at least one
  38 |       // book heading to appear rather than a specific count (the exact
  39 |       // number of "love" occurrences isn't the point of this test).
  40 |       await page.waitForSelector('text=/Testament/', { timeout: 15000 });
  41 |       await assertNoOverflow(page, 'search results: "love"');
  42 | 
  43 |       // Clearing back to empty shouldn't error or leave stale results.
  44 |       await input.fill('');
  45 |       await input.press('Enter');
  46 |       await assertNoOverflow(page, 'search: cleared');
  47 |     });
  48 | 
  49 |     test('direct reference search (e.g. "John 3:16") resolves without overflow', async ({ page }) => {
  50 |       await page.goto('/search');
  51 |       const input = page.getByPlaceholder(/study, Romans 3:25/i);
  52 |       await input.fill('John 3:16');
  53 |       await input.press('Enter');
  54 |       await page.waitForTimeout(1000);
  55 |       await assertNoOverflow(page, 'search: direct reference');
  56 |     });
  57 | 
  58 |     test('a search with no matches shows an empty state, not a broken layout', async ({ page }) => {
  59 |       await page.goto('/search');
  60 |       const input = page.getByPlaceholder(/study, Romans 3:25/i);
  61 |       await input.fill('zzzzznonexistentqueryzzzzz');
  62 |       await input.press('Enter');
  63 |       await page.waitForTimeout(1000);
  64 |       await assertNoOverflow(page, 'search: no matches');
  65 |     });
  66 | 
  67 |     test('advanced search page loads and filters render without overflow', async ({ page }) => {
  68 |       await page.goto('/advanced-search');
  69 |       await assertNoOverflow(page, 'advanced search: initial');
  70 | 
  71 |       // Open the book filter if present and try searching within it —
  72 |       // exercised generically since the exact filter UI may evolve.
  73 |       const bookFilterInput = page.getByPlaceholder(/search books/i);
  74 |       if (await bookFilterInput.count()) {
  75 |         await bookFilterInput.fill('John');
  76 |         await assertNoOverflow(page, 'advanced search: book filter typed');
  77 |       }
  78 |     });
  79 |   });
  80 | }
  81 | 
```