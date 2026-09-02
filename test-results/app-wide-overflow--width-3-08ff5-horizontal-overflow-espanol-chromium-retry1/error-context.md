# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 360px] >> no horizontal overflow: /espanol
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /espanol @ 360px overflows horizontally by 0px:
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
        - generic [ref=e6]:
          - button "Back" [ref=e7] [cursor=pointer]
          - link "Home" [ref=e8] [cursor=pointer]:
            - /url: /
        - textbox "Search..." [ref=e14]
        - generic [ref=e15]:
          - button "Toggle fullscreen" [ref=e16] [cursor=pointer]
          - button "Toggle theme" [ref=e17] [cursor=pointer]
          - button "Open menu" [ref=e18] [cursor=pointer]
    - main [ref=e19]:
      - generic [ref=e22]:
        - generic [ref=e23]:
          - heading "Recursos en Español" [level=1] [ref=e28]
          - paragraph [ref=e29]: Recursos y estudios de la Biblia en español.
        - generic [ref=e31]:
          - generic [ref=e32]:
            - heading "El Evangelio en Español" [level=2] [ref=e37]
            - iframe [ref=e40]:
              - generic [ref=f1e1]:
                - generic "YouTube Video Player" [ref=f1e3]
                - generic [ref=f1e5]:
                  - generic:
                    - generic:
                      - generic [ref=f1e6] [cursor=pointer]
                      - button "Play video" [ref=f1e10] [cursor=pointer]
                      - button "Hide player controls" [ref=f1e14] [cursor=pointer]
                      - generic [ref=f1e21]:
                        - generic [ref=f1e22]:
                          - link "Como Puedes Saber Que Eres Salvo" [ref=f1e23] [cursor=pointer]:
                            - /url: https://www.youtube.com/watch?v=UmJcHODdUGY
                          - link "Robert Breaker" [ref=f1e24] [cursor=pointer]:
                            - /url: /channel/UCPkTFG8FeBL6iR8YemTaMYQ
                        - generic [ref=f1e26]:
                          - button [ref=f1e27] [cursor=pointer]:
                            - img "thumbnail-image" [ref=f1e28]
                          - generic [ref=f1e30]:
                            - generic: Robert Breaker
                            - generic: 804K subscribers
            - link "Ver en YouTube" [ref=e41] [cursor=pointer]:
              - /url: https://youtu.be/UmJcHODdUGY
            - link [ref=e46] [cursor=pointer]:
              - /url: /espanol-evangelio
              - generic [ref=e50]:
                - paragraph [ref=e51]: Leer el Evangelio de Salvación
                - paragraph [ref=e52]: El artículo completo con videos adicionales
          - generic [ref=e57]:
            - generic [ref=e58]:
              - heading "Robert Breaker" [level=2] [ref=e59]
              - generic [ref=e60]: Verified Preacher
            - generic [ref=e65]:
              - link [ref=e66] [cursor=pointer]:
                - /url: https://laiglesiadelanube.com/
                - generic [ref=e67]:
                  - generic [ref=e72]:
                    - heading "La Iglesia de la Nube" [level=3] [ref=e73]
                    - paragraph [ref=e74]: Sitio Web de Evangelista Misionero Roberto Breaker
                  - button "Copy" [ref=e76]
              - link [ref=e84] [cursor=pointer]:
                - /url: https://spanishbibleissue.com/
                - generic [ref=e85]:
                  - generic [ref=e90]:
                    - heading "Spanish Bible Issue" [level=3] [ref=e91]
                    - paragraph [ref=e92]: Estudios sobre la controversia de las versiones de la Biblia en español.
                  - button "Copy" [ref=e94]
          - generic [ref=e102]:
            - button "La Cuestión de la Biblia en Español - Robert Breaker (Español)" [ref=e104] [cursor=pointer]
            - button "La Cuestión de la Biblia en Español - Robert Breaker (English)" [ref=e112] [cursor=pointer]
    - navigation [ref=e119]:
      - generic [ref=e121]:
        - button "Home" [ref=e122] [cursor=pointer]
        - button "Contents" [ref=e127] [cursor=pointer]
        - button "Read" [ref=e130] [cursor=pointer]
        - button "Gospel" [ref=e134] [cursor=pointer]
        - button "Toggle navigation rows" [ref=e138] [cursor=pointer]
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
      |           ^ Error: /espanol @ 360px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```