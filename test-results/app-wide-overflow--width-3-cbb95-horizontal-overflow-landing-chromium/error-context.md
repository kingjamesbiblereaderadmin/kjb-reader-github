# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 320px] >> no horizontal overflow: /landing
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /landing @ 320px overflows horizontally by 0px:
  <div class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm"> "" (over by 16px)

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 8

- Array []
+ Array [
+   Object {
+     "cls": "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm",
+     "overBy": 16,
+     "tag": "div",
+     "text": "",
+   },
+ ]
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - link [ref=e6] [cursor=pointer]:
        - /url: /
        - img "KJB Reader Logo" [ref=e7]
      - heading "Welcome to KJB Reader" [level=1] [ref=e8]
      - paragraph [ref=e9]: KJB Reader is a free, installable Bible reading app featuring the King James Bible (Pure Cambridge Edition). Enjoy offline reading, search, bookmarks, and customizable typography — all with privacy at the forefront.
    - generic [ref=e11]:
      - paragraph [ref=e14]: 2 Timothy 2:15
      - blockquote [ref=e16]: "\"Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.\""
    - link [ref=e18] [cursor=pointer]:
      - /url: /salvation
      - generic [ref=e22]:
        - paragraph [ref=e23]: Are you saved?
        - paragraph [ref=e24]: Jesus Christ died, shed his blood, was buried, and rose again on the third day for our sins. Trust Christ's blood, death, burial and resurrection for your sins, and be eternally saved.
    - link [ref=e28] [cursor=pointer]:
      - /url: /espanol-evangelio
      - generic [ref=e33]:
        - paragraph [ref=e34]: Are you saved? (Español)
        - paragraph [ref=e35]: El Evangelio de Salvación
    - generic [ref=e39]:
      - generic [ref=e40]:
        - button "Install" [ref=e41] [cursor=pointer]
        - button "Theme" [ref=e48] [cursor=pointer]
        - button "Fonts" [ref=e58] [cursor=pointer]
        - button "Layout" [ref=e64] [cursor=pointer]
        - button "Explore" [ref=e70] [cursor=pointer]
      - generic [ref=e77]:
        - heading "Install the App" [level=3] [ref=e78]
        - paragraph [ref=e79]: Get offline access and faster loading
        - paragraph [ref=e81]: You're in a private window. App install and notifications won't work, and settings will be erased when you close this window.
        - paragraph [ref=e82]: You can install the app later from Settings.
      - generic [ref=e83]:
        - button "Back" [disabled]
        - button "Next" [ref=e84] [cursor=pointer]
    - button "Legal & Legacy" [ref=e89] [cursor=pointer]
    - button "Contact" [ref=e97] [cursor=pointer]
    - paragraph [ref=e105]: "© 2026 KJB Reader · Last updated: September 3rd, 2026"
  - region "Notifications alt+T"
```

# Test source

```ts
  19  | // (admin-gated internal tools) — none of these are pages a normal reader
  20  | // ever lands on, and several would need real auth/session state to render
  21  | // meaningfully.
  22  | const ROUTES = [
  23  |   '/',
  24  |   '/read?book=GEN&chapter=1',
  25  |   '/read?book=1KI&chapter=16',
  26  |   '/gospel',
  27  |   '/resources',
  28  |   '/kjb-defence',
  29  |   '/about',
  30  |   '/contents',
  31  |   '/settings',
  32  |   '/search',
  33  |   '/advanced-search',
  34  |   '/saved',
  35  |   '/legacy',
  36  |   '/espanol',
  37  |   '/espanol-evangelio',
  38  |   '/landing',
  39  |   '/credits',
  40  |   '/changelog',
  41  |   '/terms',
  42  |   '/privacy',
  43  |   '/contact',
  44  |   '/salvation',
  45  |   '/discord',
  46  |   '/extension',
  47  |   '/extension-privacy',
  48  |   '/extension-terms',
  49  |   '/extension-license',
  50  | ];
  51  | 
  52  | // Real device widths this app targets, narrowest first (most likely to
  53  | // reveal an overflow).
  54  | const WIDTHS = [320, 360, 393, 412, 768];
  55  | 
  56  | const TOLERANCE_PX = 1.5;
  57  | 
  58  | for (const width of WIDTHS) {
  59  |   test.describe(`[width ${width}px]`, () => {
  60  |     test.use({ viewport: { width, height: 800 } });
  61  | 
  62  |     for (const route of ROUTES) {
  63  |       test(`no horizontal overflow: ${route}`, async ({ page }) => {
  64  |         await page.addInitScript(() => {
  65  |           try {
  66  |             localStorage.setItem('kjb-has-visited-app', 'true');
  67  |             localStorage.setItem('kjb-prompt-dismissed', 'true');
  68  |             localStorage.setItem('kjb-install-dismissed', 'true');
  69  |           } catch {}
  70  |         });
  71  |         await page.goto(route);
  72  |         await page.waitForLoadState('networkidle').catch(() => {});
  73  | 
  74  |         const overflow = await page.evaluate((tolerance) => {
  75  |           const docWidth = document.documentElement.clientWidth;
  76  |           const offenders = [];
  77  | 
  78  |           // Whole-document check first — cheapest signal that *something*
  79  |           // is overflowing.
  80  |           const docOverflow = document.documentElement.scrollWidth - docWidth;
  81  | 
  82  |           // Then find exactly which elements, so failures are actionable
  83  |           // instead of just "something, somewhere."
  84  |           const all = document.querySelectorAll('body *');
  85  |           for (const el of all) {
  86  |             const style = getComputedStyle(el);
  87  |             if (style.display === 'none' || style.visibility === 'hidden') continue;
  88  |             const rect = el.getBoundingClientRect();
  89  |             if (rect.width === 0 && rect.height === 0) continue;
  90  |             if (rect.right > docWidth + tolerance) {
  91  |               const text = (el.textContent || '').trim().slice(0, 60);
  92  |               offenders.push({
  93  |                 tag: el.tagName.toLowerCase(),
  94  |                 cls: (el.className && typeof el.className === 'string' ? el.className : '').slice(0, 80),
  95  |                 text,
  96  |                 overBy: Math.round((rect.right - docWidth) * 10) / 10,
  97  |               });
  98  |             }
  99  |           }
  100 |           // Dedupe by tag+text — parent/child elements of the same overflow
  101 |           // both get flagged, only the outermost is actionable.
  102 |           const seen = new Set();
  103 |           const deduped = offenders.filter((o) => {
  104 |             const key = `${o.tag}:${o.text}`;
  105 |             if (seen.has(key)) return false;
  106 |             seen.add(key);
  107 |             return true;
  108 |           });
  109 | 
  110 |           return { docOverflow, offenders: deduped.slice(0, 15) };
  111 |         }, TOLERANCE_PX);
  112 | 
  113 |         expect(
  114 |           overflow.offenders,
  115 |           `${route} @ ${width}px overflows horizontally by ${overflow.docOverflow}px:\n` +
  116 |             overflow.offenders
  117 |               .map((o) => `  <${o.tag} class="${o.cls}"> "${o.text}" (over by ${o.overBy}px)`)
  118 |               .join('\n')
> 119 |         ).toEqual([]);
      |           ^ Error: /landing @ 320px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```