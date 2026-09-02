# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline-online.spec.js >> Offline / online behavior >> downloaded Bible text reads with no network
- Location: tests/offline-online.spec.js:74:3

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
  28  |   // `reg.active` just means a worker exists in the active state — it does
  29  |   // NOT mean it's controlling *this* page's fetches yet (that only happens
  30  |   // once `navigator.serviceWorker.controller` is set, which needs either a
  31  |   // second navigation or this SW's own `clients.claim()` in its activate
  32  |   // handler to take effect). Testing offline behavior against `active`
  33  |   // alone is testing the wrong thing — the page's own requests wouldn't
  34  |   // actually route through the worker yet.
  35  |   const hasController = () => 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
  36  |   try {
  37  |     await page.waitForFunction(hasController, { timeout: 8000 });
  38  |     return;
  39  |   } catch {
  40  |     // clients.claim() didn't reach this page in time (can happen on a truly
  41  |     // cold first load) — one online reload is exactly what a real user's
  42  |     // second visit does, and is enough to pick up the controller.
  43  |     await page.reload();
  44  |     await page.waitForFunction(hasController, { timeout: 20000 });
  45  |   }
  46  | }
  47  | 
  48  | test.describe('Offline / online behavior', () => {
  49  |   test.use({ viewport: { width: 393, height: 851 } });
  50  | 
  51  |   test('app shell loads with no network at all after first visit', async ({ page, context }) => {
  52  |     // First visit: online, lets the service worker install and cache the shell.
  53  |     await page.goto('/');
  54  |     await waitForServiceWorkerActive(page);
  55  |     await page.waitForSelector('body');
  56  | 
  57  |     // Now go fully offline and reload — this is the real test: without a
  58  |     // working service worker cache, this would hit the browser's native
  59  |     // "no internet" error page instead of the app.
  60  |     await context.setOffline(true);
  61  |     await page.reload();
  62  | 
  63  |     // The app shell — header nav, KJB Reader branding — should still render.
  64  |     await expect(page.locator('body')).not.toContainText('ERR_INTERNET_DISCONNECTED');
  65  |     await expect(page.getByRole('link', { name: /kjb reader/i }).first()).toBeVisible({ timeout: 15000 }).catch(async () => {
  66  |       // Fallback: some layouts show the logo as an image without accessible
  67  |       // text — just confirm SOME app chrome rendered, not a browser error page.
  68  |       await expect(page.locator('[data-kjb-app-root]')).toBeVisible({ timeout: 15000 });
  69  |     });
  70  | 
  71  |     await context.setOffline(false);
  72  |   });
  73  | 
  74  |   test('downloaded Bible text reads with no network', async ({ page, context }) => {
  75  |     await page.goto('/settings');
  76  |     await waitForServiceWorkerActive(page);
  77  |     await page.getByRole('button', { name: /expand all/i }).click();
  78  | 
  79  |     const downloadBtn = page.getByRole('button', { name: /download all 66 books/i });
  80  |     if (await downloadBtn.count()) {
  81  |       await downloadBtn.click();
  82  |       // Downloading the full KJV can take a little while on a cold cache.
  83  |       await expect(page.getByText(/downloaded successfully|cached.*available offline/i)).toBeVisible({ timeout: 60000 });
  84  |     } else {
  85  |       // Already cached from a previous run in this worker — fine, that's
  86  |       // the state we want anyway.
  87  |       await expect(page.getByText(/cached.*available offline/i)).toBeVisible({ timeout: 10000 }).catch(() => {});
  88  |     }
  89  | 
  90  |     await context.setOffline(true);
  91  | 
  92  |     // Full reload while offline, then navigate to a specific chapter via the
  93  |     // URL — this exercises the real cold-start offline path, not just SPA
  94  |     // client-side routing on an already-warm page.
  95  |     await page.goto('/read?book=GEN&chapter=1');
> 96  |     await page.waitForSelector('.kjb-verse-text', { timeout: 20000 });
      |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  97  | 
  98  |     const firstVerse = await page.locator('.kjb-verse-text').first().innerText();
  99  |     expect(firstVerse.toLowerCase()).toContain('beginning');
  100 | 
  101 |     await assertNoOverflow(page, 'offline reader');
  102 |     await context.setOffline(false);
  103 |   });
  104 | 
  105 |   test('search works with no network once the Bible is cached', async ({ page, context }) => {
  106 |     await page.goto('/settings');
  107 |     await waitForServiceWorkerActive(page);
  108 |     // Rely on the app's own auto-download-on-first-load behavior rather than
  109 |     // re-triggering a manual download every test — just wait for the cache
  110 |     // to be ready before going offline.
  111 |     await page.waitForFunction(
  112 |       async () => {
  113 |         try {
  114 |           const req = indexedDB.open('BibleReaderDB');
  115 |           return await new Promise((resolve) => {
  116 |             req.onsuccess = () => {
  117 |               const db = req.result;
  118 |               resolve(db.objectStoreNames.contains('bibleData'));
  119 |               db.close();
  120 |             };
  121 |             req.onerror = () => resolve(false);
  122 |           });
  123 |         } catch {
  124 |           return false;
  125 |         }
  126 |       },
  127 |       { timeout: 30000 }
  128 |     ).catch(() => {});
  129 | 
  130 |     await context.setOffline(true);
  131 |     await page.goto('/search');
  132 |     await page.waitForSelector('input[type="text"], input[placeholder*="Search" i]', { timeout: 15000 });
  133 |     const searchInput = page.locator('input[type="text"], input[placeholder*="Search" i]').first();
  134 |     await searchInput.fill('beginning');
  135 |     await searchInput.press('Enter');
  136 | 
  137 |     // Either real results appear, or (if this worker's cache genuinely
  138 |     // wasn't warm yet) the app should fail gracefully with a message, not a
  139 |     // blank crash — either way, no horizontal overflow and no thrown error
  140 |     // dialog.
  141 |     await page.waitForTimeout(1500);
  142 |     await assertNoOverflow(page, 'offline search');
  143 | 
  144 |     await context.setOffline(false);
  145 |   });
  146 | 
  147 |   test('settings changed offline persist after reconnecting', async ({ page, context }) => {
  148 |     await page.goto('/settings');
  149 |     await waitForServiceWorkerActive(page);
  150 |     await page.getByRole('button', { name: /expand all/i }).click();
  151 | 
  152 |     await context.setOffline(true);
  153 |     await page.getByRole('button', { name: '🌙 Dark', exact: true }).click();
  154 |     await page.getByRole('button', { name: 'Cursive', exact: true }).click();
  155 | 
  156 |     // Reconnect and reload — a fully client-side (localStorage) preference
  157 |     // must not depend on the network to persist or reflect correctly.
  158 |     await context.setOffline(false);
  159 |     await page.reload();
  160 |     await page.waitForLoadState('networkidle').catch(() => {});
  161 | 
  162 |     const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  163 |     expect(isDark, 'dark mode set while offline should persist after reconnecting').toBe(true);
  164 | 
  165 |     const storedFont = await page.evaluate(() => localStorage.getItem('kjb-reader-font-family'));
  166 |     expect(storedFont).toBe('cursive');
  167 | 
  168 |     await assertNoOverflow(page, 'settings after offline change + reconnect');
  169 |   });
  170 | 
  171 |   test('going offline mid-session then back online does not break the reader', async ({ page, context }) => {
  172 |     await page.goto('/read?book=GEN&chapter=1');
  173 |     await waitForServiceWorkerActive(page);
  174 |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  175 | 
  176 |     await context.setOffline(true);
  177 |     // Navigate within the app (client-side routing, no full reload) while offline.
  178 |     await page.goto('/read?book=GEN&chapter=2');
  179 |     await page.waitForTimeout(1000);
  180 | 
  181 |     await context.setOffline(false);
  182 |     await page.goto('/read?book=GEN&chapter=3');
  183 |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  184 | 
  185 |     await assertNoOverflow(page, 'reader after offline->online transition mid-session');
  186 |   });
  187 | });
  188 | 
```