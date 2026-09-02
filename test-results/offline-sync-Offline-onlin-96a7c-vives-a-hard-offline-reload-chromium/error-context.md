# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline-sync.spec.js >> Offline / online sync >> service worker installs and app shell survives a hard offline reload
- Location: tests/offline-sync.spec.js:51:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('img', { name: /kjb reader logo/i }).or(locator('h1'))
Expected: visible
Error: strict mode violation: getByRole('img', { name: /kjb reader logo/i }).or(locator('h1')) resolved to 3 elements:
    1) <img width="176" height="176" alt="KJB Reader Logo" class="w-44 h-44 object-contain rounded-2xl p-3" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAQAElEQVR4Aez9B7Rl13nfCf73uS+/VznnKqAKBVQh50iCYKZISZQsWpYt05JHbo1sj3s8PbOmPavDrF5e42l77F49Y7c7yJJIS7KyRDGJCSAJEETOqYACCqFyrpfDvXt+/33Ouffc++59VQBBt7qXDvb/7L2/79vfTt+O575CFs8rtiMQz4B9YzDGC8tiHF+Z48JYjBdG4A8By5H+AmjqCbFB2Jg/NxAXxvvj6XNr4m+/9Avxxj9+KOrfnY7hC4ejvnAk6reOgmMtfIHwF6AZiVeEUxzeb4EkY7/CS3ziJd9+md5+4pPG4SVhmU5Yr1GlO14FPOd…/> aka getByRole('img', { name: 'KJB Reader Logo' }).first()
    2) <img alt="KJB Reader Logo" class="w-full h-full object-cover" src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/2279e016e_8e738d108_cfb4bf781_Untitled.png"/> aka getByRole('link', { name: 'KJB Reader Logo' })
    3) <h1 class="font-serif text-4xl font-bold text-foreground mb-2">…</h1> aka getByRole('heading', { name: 'Welcome to KJB Reader' })

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('img', { name: /kjb reader logo/i }).or(locator('h1'))

```

# Page snapshot

```yaml
- generic [ref=f2e2]:
  - generic [ref=f2e4]:
    - img "KJB Reader Logo" [ref=f2e5]
    - generic [ref=f2e6]: WELCOME TO KJB READER (GUEST MODE)
  - generic [ref=f2e11]:
    - generic [ref=f2e12]:
      - link [ref=f2e13] [cursor=pointer]:
        - /url: /
        - img "KJB Reader Logo" [ref=f2e14]
      - heading "Welcome to KJB Reader" [level=1] [ref=f2e15]
      - paragraph [ref=f2e16]: KJB Reader is a free, installable Bible reading app featuring the King James Bible (Pure Cambridge Edition). Enjoy offline reading, search, bookmarks, and customizable typography — all with privacy at the forefront.
    - generic [ref=f2e18]:
      - paragraph [ref=f2e21]: 2 Timothy 2:15
      - blockquote [ref=f2e23]: "\"Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.\""
    - link [ref=f2e25] [cursor=pointer]:
      - /url: /salvation
      - generic [ref=f2e29]:
        - paragraph [ref=f2e30]: Are you saved?
        - paragraph [ref=f2e31]: Jesus Christ died, shed his blood, was buried, and rose again on the third day for our sins. Trust Christ's blood, death, burial and resurrection for your sins, and be eternally saved.
    - link [ref=f2e35] [cursor=pointer]:
      - /url: /espanol-evangelio
      - generic [ref=f2e40]:
        - paragraph [ref=f2e41]: Are you saved? (Español)
        - paragraph [ref=f2e42]: El Evangelio de Salvación
    - generic [ref=f2e46]:
      - generic [ref=f2e47]:
        - button "Install" [ref=f2e48] [cursor=pointer]
        - button "Theme" [ref=f2e55] [cursor=pointer]
        - button "Fonts" [ref=f2e65] [cursor=pointer]
        - button "Layout" [ref=f2e71] [cursor=pointer]
        - button "Explore" [ref=f2e77] [cursor=pointer]
      - generic [ref=f2e84]:
        - heading "Install the App" [level=3] [ref=f2e85]
        - paragraph [ref=f2e86]: Get offline access and faster loading
        - paragraph [ref=f2e88]: You're in a private window. App install and notifications won't work, and settings will be erased when you close this window.
        - paragraph [ref=f2e89]: You can install the app later from Settings.
      - generic [ref=f2e90]:
        - button "Back" [disabled]
        - button "Next" [ref=f2e91] [cursor=pointer]
    - button "Legal & Legacy" [ref=f2e96] [cursor=pointer]
    - button "Contact" [ref=f2e104] [cursor=pointer]
    - paragraph [ref=f2e112]: "© 2026 KJB Reader · Last updated: September 3rd, 2026"
  - region "Notifications alt+T"
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
  21  |       return !!(reg && reg.active);
  22  |     },
  23  |     { timeout: 20000 }
  24  |   );
  25  | }
  26  | 
  27  | // Being *registered* isn't enough for offline reload to work — the current
  28  | // page/tab has to be *controlled* by that active worker (the browser only
  29  | // hands control to a freshly-activated SW once clients.claim() has run and
  30  | // propagated, which is asynchronous even after `reg.active` is set). A
  31  | // reload attempted before that lands as a real network request and fails
  32  | // offline with ERR_INTERNET_DISCONNECTED — not a bug in the app, just an
  33  | // artifact of testing too early.
  34  | async function waitForPageControlled(page) {
  35  |   await page.waitForFunction(
  36  |     () => !!(navigator.serviceWorker && navigator.serviceWorker.controller),
  37  |     { timeout: 20000 }
  38  |   );
  39  | }
  40  | 
  41  | function trackPageErrors(page) {
  42  |   const errors = [];
  43  |   page.on('pageerror', (err) => errors.push(err.message));
  44  |   page.on('console', (msg) => {
  45  |     if (msg.type() === 'error') errors.push(msg.text());
  46  |   });
  47  |   return errors;
  48  | }
  49  | 
  50  | test.describe('Offline / online sync', () => {
  51  |   test('service worker installs and app shell survives a hard offline reload', async ({ page, context }) => {
  52  |     const errors = trackPageErrors(page);
  53  | 
  54  |     await page.goto('/');
  55  |     await waitForServiceWorkerActive(page);
  56  | 
  57  |     // First load registers/activates the worker but isn't controlled by it
  58  |     // yet (standard SW behaviour) — reload once online so this tab becomes
  59  |     // controlled, THEN test the offline path.
  60  |     await page.reload();
  61  |     await waitForPageControlled(page);
  62  |     // Give the shell precache a moment to actually finish writing to the
  63  |     // Cache Storage API.
  64  |     await page.waitForTimeout(1000);
  65  | 
  66  |     await context.setOffline(true);
  67  |     await page.reload();
  68  | 
  69  |     // The shell (not necessarily Bible data — that's a separate opt-in
  70  |     // download, tested below) should still render from cache: no browser
  71  |     // "you are offline" error page, no blank screen.
  72  |     await expect(page.locator('body')).not.toContainText('ERR_INTERNET_DISCONNECTED');
> 73  |     await expect(page.getByRole('img', { name: /kjb reader logo/i }).or(page.locator('h1'))).toBeVisible({ timeout: 10000 });
      |                                                                                              ^ Error: expect(locator).toBeVisible() failed
  74  | 
  75  |     await context.setOffline(false);
  76  |     expect(errors, `uncaught errors during offline reload:\n${errors.join('\n')}`).toEqual([]);
  77  |   });
  78  | 
  79  |   test('settings changed while online are still applied after going offline', async ({ page, context }) => {
  80  |     await page.goto('/settings');
  81  |     await waitForServiceWorkerActive(page);
  82  |     await page.reload();
  83  |     await waitForPageControlled(page);
  84  | 
  85  |     await page.getByRole('button', { name: /expand all/i }).click();
  86  |     await page.getByRole('button', { name: 'Cursive', exact: true }).click();
  87  |     await page.getByRole('button', { name: 'Increase text size' }).click();
  88  |     await page.getByRole('button', { name: 'Increase text size' }).click();
  89  | 
  90  |     const fontBefore = await page.evaluate(() => localStorage.getItem('kjb-reader-font-family'));
  91  |     const zoomBefore = await page.evaluate(() => localStorage.getItem('kjb-zoom'));
  92  |     expect(fontBefore).toBe('cursive');
  93  |     expect(zoomBefore).toBe('150');
  94  | 
  95  |     await context.setOffline(true);
  96  |     await page.reload();
  97  | 
  98  |     // Settings are localStorage-based, so they must survive regardless of
  99  |     // connectivity — this is the "did it actually persist" check, not just
  100 |     // "did the page not crash."
  101 |     const fontAfter = await page.evaluate(() => localStorage.getItem('kjb-reader-font-family'));
  102 |     const zoomAfter = await page.evaluate(() => localStorage.getItem('kjb-zoom'));
  103 |     expect(fontAfter, 'font setting lost after going offline').toBe(fontBefore);
  104 |     expect(zoomAfter, 'zoom setting lost after going offline').toBe(zoomBefore);
  105 | 
  106 |     // And the settings UI itself reflects them correctly while offline —
  107 |     // not just the raw storage value.
  108 |     await page.getByRole('button', { name: /expand all/i }).click().catch(() => {});
  109 |     await expect(page.getByText('Text Size: 150%')).toBeVisible();
  110 | 
  111 |     await context.setOffline(false);
  112 |   });
  113 | 
  114 |   test('a saved verse survives offline → online → reload', async ({ page, context }) => {
  115 |     await page.goto('/read?book=JHN&chapter=3');
  116 |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  117 | 
  118 |     // Save verse 16 via its action popover: tap the verse, then Save.
  119 |     await page.locator('#v16').click();
  120 |     const saveBtn = page.getByRole('button', { name: /^save$/i });
  121 |     if (await saveBtn.count()) {
  122 |       await saveBtn.click();
  123 |     } else {
  124 |       // Selecting via localStorage as a fallback if the popover interaction
  125 |       // path differs from what's expected — the point of this test is the
  126 |       // persistence, not the exact UI path to get there.
  127 |       await page.evaluate(() => {
  128 |         const key = 'kjb-saved-verses';
  129 |         const existing = JSON.parse(localStorage.getItem(key) || '[]');
  130 |         existing.push({ abbr: 'JHN', chapter: 3, verse: 16, savedAt: Date.now() });
  131 |         localStorage.setItem(key, JSON.stringify(existing));
  132 |       });
  133 |     }
  134 | 
  135 |     const savedBefore = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  136 |     expect(savedBefore).toBeTruthy();
  137 | 
  138 |     await context.setOffline(true);
  139 |     await page.reload();
  140 |     const savedOffline = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  141 |     expect(savedOffline, 'saved verse lost while offline').toBe(savedBefore);
  142 | 
  143 |     await context.setOffline(false);
  144 |     await page.reload();
  145 |     const savedOnlineAgain = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  146 |     expect(savedOnlineAgain, 'saved verse lost/changed after coming back online').toBe(savedBefore);
  147 |   });
  148 | 
  149 |   test('reading position persists across an offline/online round trip', async ({ page, context }) => {
  150 |     await page.goto('/read?book=PSA&chapter=23');
  151 |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  152 |     const posBefore = await page.evaluate(() => localStorage.getItem('kjb-position'));
  153 | 
  154 |     await context.setOffline(true);
  155 |     await page.goto('/');
  156 |     await page.goto('/read'); // no query params — should restore last position from storage
  157 |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 }).catch(() => {});
  158 |     const posOffline = await page.evaluate(() => localStorage.getItem('kjb-position'));
  159 | 
  160 |     await context.setOffline(false);
  161 | 
  162 |     expect(posBefore, 'no reading position was saved to begin with').toBeTruthy();
  163 |     expect(posOffline, 'reading position was lost while offline').toBe(posBefore);
  164 |   });
  165 | 
  166 |   test('toggling offline mid-read does not throw or blank the page', async ({ page, context }) => {
  167 |     const errors = trackPageErrors(page);
  168 | 
  169 |     await page.goto('/read?book=GEN&chapter=1');
  170 |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  171 | 
  172 |     await context.setOffline(true);
  173 |     await page.waitForTimeout(500);
```