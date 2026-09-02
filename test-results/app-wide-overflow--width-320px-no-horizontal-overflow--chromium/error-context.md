# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 320px] >> no horizontal overflow: /
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: / @ 320px overflows horizontally by 0px:
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
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - link [ref=e6] [cursor=pointer]:
          - /url: /
          - img "KJB Reader" [ref=e8]
        - textbox [ref=e14]
        - generic [ref=e15]:
          - button "Toggle fullscreen" [ref=e16] [cursor=pointer]
          - button "Toggle theme" [ref=e17] [cursor=pointer]
          - button "Open menu" [ref=e18] [cursor=pointer]
    - main [ref=e19]:
      - generic [ref=e23]:
        - generic [ref=e31]:
          - paragraph [ref=e32]: You're in a private window (Incognito, InPrivate, or Guest)
          - paragraph [ref=e33]: Offline downloads, app install and notifications won't work here, and your settings will be erased when you close this window. Open the app in a normal window for the full experience.
        - generic [ref=e35]:
          - paragraph [ref=e38]: 2 Timothy 2:15
          - blockquote [ref=e40]: "\"Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.\""
        - generic [ref=e41]:
          - link [ref=e42] [cursor=pointer]:
            - /url: /read
            - generic [ref=e46]:
              - paragraph [ref=e47]: Read the Bible
              - paragraph [ref=e48]: KJB Pure Cambridge Edition
          - link [ref=e51] [cursor=pointer]:
            - /url: /contents
            - generic [ref=e54]:
              - paragraph [ref=e55]: Table of Contents
              - paragraph [ref=e56]: Browse all 66 books
          - link [ref=e59] [cursor=pointer]:
            - /url: /saved
            - generic [ref=e63]:
              - paragraph [ref=e64]: Saved Verses
              - paragraph [ref=e65]: Your bookmarked verses
          - link [ref=e68] [cursor=pointer]:
            - /url: /advanced-search
            - generic [ref=e72]:
              - paragraph [ref=e73]: Advanced Search
              - paragraph [ref=e74]: Research verses by properties
          - link [ref=e77] [cursor=pointer]:
            - /url: /gospel
            - generic [ref=e81]:
              - paragraph [ref=e82]: Gospel
              - paragraph [ref=e83]: Learn how to be saved
          - link [ref=e86] [cursor=pointer]:
            - /url: /resources
            - generic [ref=e90]:
              - paragraph [ref=e91]: Resources
              - paragraph [ref=e92]: KJB defence & study
          - link [ref=e95] [cursor=pointer]:
            - /url: /about
            - generic [ref=e99]:
              - paragraph [ref=e100]: About
              - paragraph [ref=e101]: Ministry & links
          - link [ref=e104] [cursor=pointer]:
            - /url: /settings
            - generic [ref=e109]:
              - paragraph [ref=e110]: Settings
              - paragraph [ref=e111]: Offline downloads & info
        - generic [ref=e114]:
          - paragraph [ref=e115]: Are you saved?
          - generic [ref=e116]:
            - paragraph [ref=e117]: Jesus Christ died, shed his blood, was buried, and rose again on the third day for our sins.
            - paragraph [ref=e118]: Trust Christ's blood, death, burial and resurrection for your sins, and be eternally saved.
          - link "Learn How to be Saved" [ref=e119] [cursor=pointer]:
            - /url: /gospel
    - navigation [ref=e122]:
      - generic [ref=e124]:
        - button "Home" [ref=e125] [cursor=pointer]
        - button "Contents" [ref=e131] [cursor=pointer]
        - button "Read" [ref=e134] [cursor=pointer]
        - button "Gospel" [ref=e138] [cursor=pointer]
        - button "Toggle navigation rows" [ref=e142] [cursor=pointer]
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
      |           ^ Error: / @ 320px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```