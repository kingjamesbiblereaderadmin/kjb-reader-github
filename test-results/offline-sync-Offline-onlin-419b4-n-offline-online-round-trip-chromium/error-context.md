# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline-sync.spec.js >> Offline / online sync >> reading position persists across an offline/online round trip
- Location: tests/offline-sync.spec.js:153:3

# Error details

```
Error: page.goto: net::ERR_INTERNET_DISCONNECTED at http://localhost:4173/
Call log:
  - navigating to "http://localhost:4173/", waiting until "load"

```

# Test source

```ts
  59  |     await waitForServiceWorkerActive(page);
  60  | 
  61  |     // First load registers/activates the worker but isn't controlled by it
  62  |     // yet (standard SW behaviour) — reload once online so this tab becomes
  63  |     // controlled, THEN test the offline path.
  64  |     await page.reload();
  65  |     await waitForPageControlled(page);
  66  |     // Give the shell precache a moment to actually finish writing to the
  67  |     // Cache Storage API.
  68  |     await page.waitForTimeout(1000);
  69  | 
  70  |     await context.setOffline(true);
  71  |     await page.reload();
  72  | 
  73  |     // The shell (not necessarily Bible data — that's a separate opt-in
  74  |     // download, tested below) should still render from cache: no browser
  75  |     // "you are offline" error page, no blank screen.
  76  |     await expect(page.locator('body')).not.toContainText('ERR_INTERNET_DISCONNECTED');
  77  |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  78  | 
  79  |     await context.setOffline(false);
  80  |     expect(errors, `uncaught errors during offline reload:\n${errors.join('\n')}`).toEqual([]);
  81  |   });
  82  | 
  83  |   test('settings changed while online are still applied after going offline', async ({ page, context }) => {
  84  |     await page.goto('/settings');
  85  |     await waitForServiceWorkerActive(page);
  86  |     await page.reload();
  87  |     await waitForPageControlled(page);
  88  | 
  89  |     await page.getByRole('button', { name: /expand all/i }).click();
  90  |     await page.getByRole('button', { name: 'Cursive', exact: true }).click();
  91  |     await page.getByRole('button', { name: 'Increase text size' }).click();
  92  |     await page.getByRole('button', { name: 'Increase text size' }).click();
  93  | 
  94  |     const fontBefore = await page.evaluate(() => localStorage.getItem('kjb-reader-font-family'));
  95  |     const zoomBefore = await page.evaluate(() => localStorage.getItem('kjb-zoom'));
  96  |     expect(fontBefore).toBe('cursive');
  97  |     expect(zoomBefore).toBe('150');
  98  | 
  99  |     await context.setOffline(true);
  100 |     await page.reload();
  101 | 
  102 |     // Settings are localStorage-based, so they must survive regardless of
  103 |     // connectivity — this is the "did it actually persist" check, not just
  104 |     // "did the page not crash."
  105 |     const fontAfter = await page.evaluate(() => localStorage.getItem('kjb-reader-font-family'));
  106 |     const zoomAfter = await page.evaluate(() => localStorage.getItem('kjb-zoom'));
  107 |     expect(fontAfter, 'font setting lost after going offline').toBe(fontBefore);
  108 |     expect(zoomAfter, 'zoom setting lost after going offline').toBe(zoomBefore);
  109 | 
  110 |     // And the settings UI itself reflects them correctly while offline —
  111 |     // not just the raw storage value.
  112 |     await page.getByRole('button', { name: /expand all/i }).click().catch(() => {});
  113 |     await expect(page.getByText('Text Size: 150%')).toBeVisible();
  114 | 
  115 |     await context.setOffline(false);
  116 |   });
  117 | 
  118 |   test('a saved verse survives offline → online → reload', async ({ page, context }) => {
  119 |     await page.goto('/read?book=JHN&chapter=3');
  120 |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  121 | 
  122 |     // Save verse 16 via its action popover: tap the verse, then Save.
  123 |     await page.locator('#v16').click();
  124 |     const saveBtn = page.getByRole('button', { name: /^save$/i });
  125 |     if (await saveBtn.count()) {
  126 |       await saveBtn.click();
  127 |     } else {
  128 |       // Selecting via localStorage as a fallback if the popover interaction
  129 |       // path differs from what's expected — the point of this test is the
  130 |       // persistence, not the exact UI path to get there.
  131 |       await page.evaluate(() => {
  132 |         const key = 'kjb-saved-verses';
  133 |         const existing = JSON.parse(localStorage.getItem(key) || '[]');
  134 |         existing.push({ abbr: 'JHN', chapter: 3, verse: 16, savedAt: Date.now() });
  135 |         localStorage.setItem(key, JSON.stringify(existing));
  136 |       });
  137 |     }
  138 | 
  139 |     const savedBefore = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  140 |     expect(savedBefore).toBeTruthy();
  141 | 
  142 |     await context.setOffline(true);
  143 |     await page.reload();
  144 |     const savedOffline = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  145 |     expect(savedOffline, 'saved verse lost while offline').toBe(savedBefore);
  146 | 
  147 |     await context.setOffline(false);
  148 |     await page.reload();
  149 |     const savedOnlineAgain = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  150 |     expect(savedOnlineAgain, 'saved verse lost/changed after coming back online').toBe(savedBefore);
  151 |   });
  152 | 
  153 |   test('reading position persists across an offline/online round trip', async ({ page, context }) => {
  154 |     await page.goto('/read?book=PSA&chapter=23');
  155 |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  156 |     const posBefore = await page.evaluate(() => localStorage.getItem('kjb-position'));
  157 | 
  158 |     await context.setOffline(true);
> 159 |     await page.goto('/');
      |                ^ Error: page.goto: net::ERR_INTERNET_DISCONNECTED at http://localhost:4173/
  160 |     await page.goto('/read'); // no query params — should restore last position from storage
  161 |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 }).catch(() => {});
  162 |     const posOffline = await page.evaluate(() => localStorage.getItem('kjb-position'));
  163 | 
  164 |     await context.setOffline(false);
  165 | 
  166 |     expect(posBefore, 'no reading position was saved to begin with').toBeTruthy();
  167 |     expect(posOffline, 'reading position was lost while offline').toBe(posBefore);
  168 |   });
  169 | 
  170 |   test('toggling offline mid-read does not throw or blank the page', async ({ page, context }) => {
  171 |     const errors = trackPageErrors(page);
  172 | 
  173 |     await page.goto('/read?book=GEN&chapter=1');
  174 |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  175 | 
  176 |     await context.setOffline(true);
  177 |     await page.waitForTimeout(500);
  178 |     // Try normal in-app navigation (not a reload) while offline — this is
  179 |     // the realistic "lost signal while reading" case.
  180 |     await page.getByRole('button', { name: /next/i }).click().catch(() => {});
  181 |     await page.waitForTimeout(500);
  182 | 
  183 |     await context.setOffline(false);
  184 |     await page.waitForTimeout(500);
  185 | 
  186 |     // The reader content region should still be present and non-empty —
  187 |     // not replaced by a blank screen or an unhandled error boundary.
  188 |     await expect(page.locator('.kjb-reader-content')).toBeVisible();
  189 |     const hasText = await page.locator('.kjb-reader-content').innerText();
  190 |     expect(hasText.trim().length, 'reader content went blank during offline toggle').toBeGreaterThan(0);
  191 | 
  192 |     expect(errors, `uncaught errors while toggling offline mid-read:\n${errors.join('\n')}`).toEqual([]);
  193 |   });
  194 | });
  195 | 
```