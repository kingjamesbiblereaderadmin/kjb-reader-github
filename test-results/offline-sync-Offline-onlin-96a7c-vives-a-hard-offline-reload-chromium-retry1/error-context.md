# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline-sync.spec.js >> Offline / online sync >> service worker installs and app shell survives a hard offline reload
- Location: tests/offline-sync.spec.js:37:3

# Error details

```
Error: page.reload: net::ERR_INTERNET_DISCONNECTED
Call log:
  - waiting for navigation until "load"

```

# Test source

```ts
  1   | /**
  2   |  * Offline / online sync tests.
  3   |  *
  4   |  * This app stores everything locally (no cloud account — see the Privacy
  5   |  * Policy), so "sync" here means: does state survive a real online→offline→
  6   |  * online round trip without loss or corruption, and does the app keep
  7   |  * working (not just "not crash," but actually usable) while offline.
  8   |  *
  9   |  * These need a real service-worker install, so they run against the actual
  10  |  * production build via `vite preview` (same as every other spec here) with
  11  |  * a persistent browser context, and use `context.setOffline()` to flip
  12  |  * connectivity for real rather than mocking fetch.
  13  |  */
  14  | import { test, expect } from '@playwright/test';
  15  | 
  16  | async function waitForServiceWorkerActive(page) {
  17  |   await page.waitForFunction(
  18  |     async () => {
  19  |       if (!('serviceWorker' in navigator)) return false;
  20  |       const reg = await navigator.serviceWorker.getRegistration();
  21  |       return !!(reg && (reg.active || reg.waiting));
  22  |     },
  23  |     { timeout: 20000 }
  24  |   );
  25  | }
  26  | 
  27  | function trackPageErrors(page) {
  28  |   const errors = [];
  29  |   page.on('pageerror', (err) => errors.push(err.message));
  30  |   page.on('console', (msg) => {
  31  |     if (msg.type() === 'error') errors.push(msg.text());
  32  |   });
  33  |   return errors;
  34  | }
  35  | 
  36  | test.describe('Offline / online sync', () => {
  37  |   test('service worker installs and app shell survives a hard offline reload', async ({ page, context }) => {
  38  |     const errors = trackPageErrors(page);
  39  | 
  40  |     await page.goto('/');
  41  |     await waitForServiceWorkerActive(page);
  42  | 
  43  |     // Give the shell precache a moment to actually finish writing to the
  44  |     // Cache Storage API (registration being "active" doesn't guarantee the
  45  |     // install event's cache.addAll has resolved yet).
  46  |     await page.waitForTimeout(1500);
  47  | 
  48  |     await context.setOffline(true);
> 49  |     await page.reload();
      |                ^ Error: page.reload: net::ERR_INTERNET_DISCONNECTED
  50  | 
  51  |     // The shell (not necessarily Bible data — that's a separate opt-in
  52  |     // download, tested below) should still render from cache: no browser
  53  |     // "you are offline" error page, no blank screen.
  54  |     await expect(page.locator('body')).not.toContainText('ERR_INTERNET_DISCONNECTED');
  55  |     await expect(page.getByRole('img', { name: /kjb reader logo/i }).or(page.locator('h1'))).toBeVisible({ timeout: 10000 });
  56  | 
  57  |     await context.setOffline(false);
  58  |     expect(errors, `uncaught errors during offline reload:\n${errors.join('\n')}`).toEqual([]);
  59  |   });
  60  | 
  61  |   test('settings changed while online are still applied after going offline', async ({ page, context }) => {
  62  |     await page.goto('/settings');
  63  |     await waitForServiceWorkerActive(page);
  64  | 
  65  |     await page.getByRole('button', { name: /expand all/i }).click();
  66  |     await page.getByRole('button', { name: 'Cursive', exact: true }).click();
  67  |     await page.getByRole('button', { name: 'Increase text size' }).click();
  68  |     await page.getByRole('button', { name: 'Increase text size' }).click();
  69  | 
  70  |     const fontBefore = await page.evaluate(() => localStorage.getItem('kjb-reader-font-family'));
  71  |     const zoomBefore = await page.evaluate(() => localStorage.getItem('kjb-zoom'));
  72  |     expect(fontBefore).toBe('cursive');
  73  |     expect(zoomBefore).toBe('150');
  74  | 
  75  |     await context.setOffline(true);
  76  |     await page.reload();
  77  | 
  78  |     // Settings are localStorage-based, so they must survive regardless of
  79  |     // connectivity — this is the "did it actually persist" check, not just
  80  |     // "did the page not crash."
  81  |     const fontAfter = await page.evaluate(() => localStorage.getItem('kjb-reader-font-family'));
  82  |     const zoomAfter = await page.evaluate(() => localStorage.getItem('kjb-zoom'));
  83  |     expect(fontAfter, 'font setting lost after going offline').toBe(fontBefore);
  84  |     expect(zoomAfter, 'zoom setting lost after going offline').toBe(zoomBefore);
  85  | 
  86  |     // And the settings UI itself reflects them correctly while offline —
  87  |     // not just the raw storage value.
  88  |     await page.getByRole('button', { name: /expand all/i }).click().catch(() => {});
  89  |     await expect(page.getByText('Text Size: 150%')).toBeVisible();
  90  | 
  91  |     await context.setOffline(false);
  92  |   });
  93  | 
  94  |   test('a saved verse survives offline → online → reload', async ({ page, context }) => {
  95  |     await page.goto('/read?book=JHN&chapter=3');
  96  |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  97  | 
  98  |     // Save verse 16 via its action popover: tap the verse, then Save.
  99  |     await page.locator('#v16').click();
  100 |     const saveBtn = page.getByRole('button', { name: /^save$/i });
  101 |     if (await saveBtn.count()) {
  102 |       await saveBtn.click();
  103 |     } else {
  104 |       // Selecting via localStorage as a fallback if the popover interaction
  105 |       // path differs from what's expected — the point of this test is the
  106 |       // persistence, not the exact UI path to get there.
  107 |       await page.evaluate(() => {
  108 |         const key = 'kjb-saved-verses';
  109 |         const existing = JSON.parse(localStorage.getItem(key) || '[]');
  110 |         existing.push({ abbr: 'JHN', chapter: 3, verse: 16, savedAt: Date.now() });
  111 |         localStorage.setItem(key, JSON.stringify(existing));
  112 |       });
  113 |     }
  114 | 
  115 |     const savedBefore = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  116 |     expect(savedBefore).toBeTruthy();
  117 | 
  118 |     await context.setOffline(true);
  119 |     await page.reload();
  120 |     const savedOffline = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  121 |     expect(savedOffline, 'saved verse lost while offline').toBe(savedBefore);
  122 | 
  123 |     await context.setOffline(false);
  124 |     await page.reload();
  125 |     const savedOnlineAgain = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  126 |     expect(savedOnlineAgain, 'saved verse lost/changed after coming back online').toBe(savedBefore);
  127 |   });
  128 | 
  129 |   test('reading position persists across an offline/online round trip', async ({ page, context }) => {
  130 |     await page.goto('/read?book=PSA&chapter=23');
  131 |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  132 |     const posBefore = await page.evaluate(() => localStorage.getItem('kjb-position'));
  133 | 
  134 |     await context.setOffline(true);
  135 |     await page.goto('/');
  136 |     await page.goto('/read'); // no query params — should restore last position from storage
  137 |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 }).catch(() => {});
  138 |     const posOffline = await page.evaluate(() => localStorage.getItem('kjb-position'));
  139 | 
  140 |     await context.setOffline(false);
  141 | 
  142 |     expect(posBefore, 'no reading position was saved to begin with').toBeTruthy();
  143 |     expect(posOffline, 'reading position was lost while offline').toBe(posBefore);
  144 |   });
  145 | 
  146 |   test('toggling offline mid-read does not throw or blank the page', async ({ page, context }) => {
  147 |     const errors = trackPageErrors(page);
  148 | 
  149 |     await page.goto('/read?book=GEN&chapter=1');
```