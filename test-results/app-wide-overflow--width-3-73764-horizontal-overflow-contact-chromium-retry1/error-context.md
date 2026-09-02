# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 320px] >> no horizontal overflow: /contact
- Location: tests/app-wide-overflow.spec.js:64:7

# Error details

```
Error: /contact @ 320px overflows horizontally:
  <a class="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-br from-p"> "kingjamesbiblereader@outlook.sg" (over by 65px)

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 8

- Array []
+ Array [
+   Object {
+     "cls": "inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-br from-p",
+     "overBy": 65,
+     "tag": "a",
+     "text": "kingjamesbiblereader@outlook.sg",
+   },
+ ]
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Contact Us" [level=1] [ref=e10]
      - paragraph [ref=e11]: We'd love to hear from you
    - button "Back" [ref=e14] [cursor=pointer]
    - generic [ref=e17]:
      - paragraph [ref=e18]: Have a question, feedback, a verse request, or a prayer request? We'd be glad to hear from you. Reach out and we'll do our best to respond.
      - link "kingjamesbiblereader@outlook.sg" [ref=e19] [cursor=pointer]:
        - /url: mailto:kingjamesbiblereader@outlook.sg
      - paragraph [ref=e23]: "Or copy: kingjamesbiblereader@outlook.sg"
    - button "Back" [ref=e25] [cursor=pointer]
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | /**
  2  |  * App-wide overflow crawl.
  3  |  *
  4  |  * Rather than hand-scripting every button on every page (which is both
  5  |  * exhausting to write and to keep in sync as the app grows), this walks
  6  |  * every public route at a spread of real phone/tablet widths and asserts
  7  |  * nothing overflows horizontally — no clipped text, no element running off
  8  |  * the right edge, no word wide enough to force a scrollbar. Combined with
  9  |  * the global `overflow-wrap`/`hyphens` safety net in index.css, this is the
  10 |  * generic version of "every single word wraps and hyphens instead of
  11 |  * overflowing," checked everywhere at once instead of page by page.
  12 |  */
  13 | import { test, expect } from '@playwright/test';
  14 | import { checkOverflow } from './utils/overflow.js';
  15 | 
  16 | // Every public, non-destructive, no-auth-required route. Deliberately
  17 | // excludes: /login, /register, /forgot-password, /reset-password,
  18 | // /oauth/consent (auth flows with server-dependent state), /refresh-cache
  19 | // (destructive action), /manifest-icons, /manifest-screenshots, /dev-tools
  20 | // (admin-gated internal tools) — none of these are pages a normal reader
  21 | // ever lands on, and several would need real auth/session state to render
  22 | // meaningfully.
  23 | const ROUTES = [
  24 |   '/',
  25 |   '/read?book=GEN&chapter=1',
  26 |   '/read?book=1KI&chapter=16',
  27 |   '/gospel',
  28 |   '/resources',
  29 |   '/kjb-defence',
  30 |   '/about',
  31 |   '/contents',
  32 |   '/settings',
  33 |   '/search',
  34 |   '/advanced-search',
  35 |   '/saved',
  36 |   '/legacy',
  37 |   '/espanol',
  38 |   '/espanol-evangelio',
  39 |   '/landing',
  40 |   '/credits',
  41 |   '/changelog',
  42 |   '/terms',
  43 |   '/privacy',
  44 |   '/contact',
  45 |   '/salvation',
  46 |   '/discord',
  47 |   '/extension',
  48 |   '/extension-privacy',
  49 |   '/extension-terms',
  50 |   '/extension-license',
  51 | ];
  52 | 
  53 | // Real device widths this app targets, narrowest first (most likely to
  54 | // reveal an overflow).
  55 | const WIDTHS = [320, 360, 393, 412, 768];
  56 | 
  57 | const TOLERANCE_PX = 1.5;
  58 | 
  59 | for (const width of WIDTHS) {
  60 |   test.describe(`[width ${width}px]`, () => {
  61 |     test.use({ viewport: { width, height: 800 } });
  62 | 
  63 |     for (const route of ROUTES) {
  64 |       test(`no horizontal overflow: ${route}`, async ({ page }) => {
  65 |         await page.addInitScript(() => {
  66 |           try {
  67 |             localStorage.setItem('kjb-has-visited-app', 'true');
  68 |             localStorage.setItem('kjb-prompt-dismissed', 'true');
  69 |             localStorage.setItem('kjb-install-dismissed', 'true');
  70 |           } catch {}
  71 |         });
  72 |         await page.goto(route);
  73 |         await page.waitForLoadState('networkidle').catch(() => {});
  74 | 
  75 |         const offenders = await page.evaluate(checkOverflow, TOLERANCE_PX);
  76 | 
  77 |         expect(
  78 |           offenders,
  79 |           `${route} @ ${width}px overflows horizontally:\n` +
  80 |             offenders.map((o) => `  <${o.tag} class="${o.cls}"> "${o.text}" (over by ${o.overBy}px)`).join('\n')
> 81 |         ).toEqual([]);
     |           ^ Error: /contact @ 320px overflows horizontally:
  82 |       });
  83 |     }
  84 |   });
  85 | }
  86 | 
```