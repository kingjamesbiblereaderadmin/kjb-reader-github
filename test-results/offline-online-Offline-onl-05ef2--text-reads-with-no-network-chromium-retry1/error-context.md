# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline-online.spec.js >> Offline / online behavior >> downloaded Bible text reads with no network
- Location: tests/offline-online.spec.js:64:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.kjb-verse-text') to be visible

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
      - generic [ref=f1e22]:
        - generic [ref=f1e24]:
          - button "Genesis" [ref=f1e26] [cursor=pointer]
          - button "Ch.1" [ref=f1e31] [cursor=pointer]
          - button "Verse" [disabled] [ref=f1e36]
          - button "100%" [ref=f1e41] [cursor=pointer]
          - button "Font family" [ref=f1e47] [cursor=pointer]
          - button "Switch to paragraph" [ref=f1e50] [cursor=pointer]
          - button "Switch to two-column" [ref=f1e52] [cursor=pointer]
          - button "Select verses" [ref=f1e54] [cursor=pointer]
          - button "Share" [ref=f1e58] [cursor=pointer]
          - button "Print" [ref=f1e65] [cursor=pointer]
          - generic [ref=f1e70]:
            - button [ref=f1e71] [cursor=pointer]
            - button [ref=f1e74] [cursor=pointer]
          - generic [ref=f1e77]:
            - button "Exit fullscreen" [ref=f1e78] [cursor=pointer]
            - button "Hide header" [ref=f1e84] [cursor=pointer]
        - generic [ref=f1e87]:
          - heading "The First Book of Moses, called Genesis" [level=1] [ref=f1e88]
          - paragraph [ref=f1e89]: Chapter 1
        - generic [ref=f1e90]: Failed to load chapter. Please check your connection.
    - navigation [ref=f1e92]:
      - generic [ref=f1e94]:
        - button "Home" [ref=f1e95] [cursor=pointer]
        - button "Contents" [ref=f1e100] [cursor=pointer]
        - button "Read" [ref=f1e103] [cursor=pointer]
        - button "Gospel" [ref=f1e108] [cursor=pointer]
        - button "Toggle navigation rows" [ref=f1e112] [cursor=pointer]
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | /**
  2   |  * Offline / online / back-online tests.
  3   |  *
  4   |  * This app has two separate offline layers that both need coverage:
  5   |  *  1. The service worker (public/sw.js) — caches the app shell (HTML/JS/CSS)
  6   |  *     so the app itself loads with no network at all.
  7   |  *  2. IndexedDB (src/lib/bibleCache.js) — the actual King James Bible text,
  8   |  *     downloaded on first launch or via Settings > "Download All 66 Books",
  9   |  *     so reading/search work with zero network regardless of what the
  10  |  *     service worker cached.
  11  |  *
  12  |  * Playwright's `context.setOffline(true)` blocks real network requests at
  13  |  * the browser level but — same as Chrome DevTools' own "Offline" checkbox —
  14  |  * an already-registered service worker still intercepts fetches and can
  15  |  * serve from its cache. That's exactly the behavior being verified here.
  16  |  */
  17  | import { test, expect } from '@playwright/test';
  18  | import { checkOverflow } from './utils/overflow.js';
  19  | 
  20  | const TOLERANCE_PX = 1.5;
  21  | 
  22  | async function assertNoOverflow(page, label) {
  23  |   const offenders = await page.evaluate(checkOverflow, TOLERANCE_PX);
  24  |   expect(offenders, `${label}: horizontal overflow:\n` + offenders.map((o) => `  <${o.tag}> "${o.text}"`).join('\n')).toEqual([]);
  25  | }
  26  | 
  27  | async function waitForServiceWorkerActive(page) {
  28  |   await page.waitForFunction(
  29  |     async () => {
  30  |       if (!('serviceWorker' in navigator)) return false;
  31  |       const reg = await navigator.serviceWorker.getRegistration();
  32  |       return !!(reg && reg.active);
  33  |     },
  34  |     { timeout: 20000 }
  35  |   );
  36  | }
  37  | 
  38  | test.describe('Offline / online behavior', () => {
  39  |   test.use({ viewport: { width: 393, height: 851 } });
  40  | 
  41  |   test('app shell loads with no network at all after first visit', async ({ page, context }) => {
  42  |     // First visit: online, lets the service worker install and cache the shell.
  43  |     await page.goto('/');
  44  |     await waitForServiceWorkerActive(page);
  45  |     await page.waitForSelector('body');
  46  | 
  47  |     // Now go fully offline and reload — this is the real test: without a
  48  |     // working service worker cache, this would hit the browser's native
  49  |     // "no internet" error page instead of the app.
  50  |     await context.setOffline(true);
  51  |     await page.reload();
  52  | 
  53  |     // The app shell — header nav, KJB Reader branding — should still render.
  54  |     await expect(page.locator('body')).not.toContainText('ERR_INTERNET_DISCONNECTED');
  55  |     await expect(page.getByRole('link', { name: /kjb reader/i }).first()).toBeVisible({ timeout: 15000 }).catch(async () => {
  56  |       // Fallback: some layouts show the logo as an image without accessible
  57  |       // text — just confirm SOME app chrome rendered, not a browser error page.
  58  |       await expect(page.locator('[data-kjb-app-root]')).toBeVisible({ timeout: 15000 });
  59  |     });
  60  | 
  61  |     await context.setOffline(false);
  62  |   });
  63  | 
  64  |   test('downloaded Bible text reads with no network', async ({ page, context }) => {
  65  |     await page.goto('/settings');
  66  |     await waitForServiceWorkerActive(page);
  67  |     await page.getByRole('button', { name: /expand all/i }).click();
  68  | 
  69  |     const downloadBtn = page.getByRole('button', { name: /download all 66 books/i });
  70  |     if (await downloadBtn.count()) {
  71  |       await downloadBtn.click();
  72  |       // Downloading the full KJV can take a little while on a cold cache.
  73  |       await expect(page.getByText(/downloaded successfully|cached.*available offline/i)).toBeVisible({ timeout: 60000 });
  74  |     } else {
  75  |       // Already cached from a previous run in this worker — fine, that's
  76  |       // the state we want anyway.
  77  |       await expect(page.getByText(/cached.*available offline/i)).toBeVisible({ timeout: 10000 }).catch(() => {});
  78  |     }
  79  | 
  80  |     await context.setOffline(true);
  81  | 
  82  |     // Full reload while offline, then navigate to a specific chapter via the
  83  |     // URL — this exercises the real cold-start offline path, not just SPA
  84  |     // client-side routing on an already-warm page.
  85  |     await page.goto('/read?book=GEN&chapter=1');
> 86  |     await page.waitForSelector('.kjb-verse-text', { timeout: 20000 });
      |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  87  | 
  88  |     const firstVerse = await page.locator('.kjb-verse-text').first().innerText();
  89  |     expect(firstVerse.toLowerCase()).toContain('beginning');
  90  | 
  91  |     await assertNoOverflow(page, 'offline reader');
  92  |     await context.setOffline(false);
  93  |   });
  94  | 
  95  |   test('search works with no network once the Bible is cached', async ({ page, context }) => {
  96  |     await page.goto('/settings');
  97  |     await waitForServiceWorkerActive(page);
  98  |     // Rely on the app's own auto-download-on-first-load behavior rather than
  99  |     // re-triggering a manual download every test — just wait for the cache
  100 |     // to be ready before going offline.
  101 |     await page.waitForFunction(
  102 |       async () => {
  103 |         try {
  104 |           const req = indexedDB.open('BibleReaderDB');
  105 |           return await new Promise((resolve) => {
  106 |             req.onsuccess = () => {
  107 |               const db = req.result;
  108 |               resolve(db.objectStoreNames.contains('bibleData'));
  109 |               db.close();
  110 |             };
  111 |             req.onerror = () => resolve(false);
  112 |           });
  113 |         } catch {
  114 |           return false;
  115 |         }
  116 |       },
  117 |       { timeout: 30000 }
  118 |     ).catch(() => {});
  119 | 
  120 |     await context.setOffline(true);
  121 |     await page.goto('/search');
  122 |     await page.waitForSelector('input[type="text"], input[placeholder*="Search" i]', { timeout: 15000 });
  123 |     const searchInput = page.locator('input[type="text"], input[placeholder*="Search" i]').first();
  124 |     await searchInput.fill('beginning');
  125 |     await searchInput.press('Enter');
  126 | 
  127 |     // Either real results appear, or (if this worker's cache genuinely
  128 |     // wasn't warm yet) the app should fail gracefully with a message, not a
  129 |     // blank crash — either way, no horizontal overflow and no thrown error
  130 |     // dialog.
  131 |     await page.waitForTimeout(1500);
  132 |     await assertNoOverflow(page, 'offline search');
  133 | 
  134 |     await context.setOffline(false);
  135 |   });
  136 | 
  137 |   test('settings changed offline persist after reconnecting', async ({ page, context }) => {
  138 |     await page.goto('/settings');
  139 |     await waitForServiceWorkerActive(page);
  140 |     await page.getByRole('button', { name: /expand all/i }).click();
  141 | 
  142 |     await context.setOffline(true);
  143 |     await page.getByRole('button', { name: '🌙 Dark', exact: true }).click();
  144 |     await page.getByRole('button', { name: 'Cursive', exact: true }).click();
  145 | 
  146 |     // Reconnect and reload — a fully client-side (localStorage) preference
  147 |     // must not depend on the network to persist or reflect correctly.
  148 |     await context.setOffline(false);
  149 |     await page.reload();
  150 |     await page.waitForLoadState('networkidle').catch(() => {});
  151 | 
  152 |     const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  153 |     expect(isDark, 'dark mode set while offline should persist after reconnecting').toBe(true);
  154 | 
  155 |     const storedFont = await page.evaluate(() => localStorage.getItem('kjb-reader-font-family'));
  156 |     expect(storedFont).toBe('cursive');
  157 | 
  158 |     await assertNoOverflow(page, 'settings after offline change + reconnect');
  159 |   });
  160 | 
  161 |   test('going offline mid-session then back online does not break the reader', async ({ page, context }) => {
  162 |     await page.goto('/read?book=GEN&chapter=1');
  163 |     await waitForServiceWorkerActive(page);
  164 |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  165 | 
  166 |     await context.setOffline(true);
  167 |     // Navigate within the app (client-side routing, no full reload) while offline.
  168 |     await page.goto('/read?book=GEN&chapter=2');
  169 |     await page.waitForTimeout(1000);
  170 | 
  171 |     await context.setOffline(false);
  172 |     await page.goto('/read?book=GEN&chapter=3');
  173 |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  174 | 
  175 |     await assertNoOverflow(page, 'reader after offline->online transition mid-session');
  176 |   });
  177 | });
  178 | 
```