# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 360px] >> no horizontal overflow: /credits
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /credits @ 360px overflows horizontally by 0px:
  <div class="absolute top-0 h-full rounded-full"> "" (over by 43.7px)

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 8

- Array []
+ Array [
+   Object {
+     "cls": "absolute top-0 h-full rounded-full",
+     "overBy": 43.7,
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
    - generic [ref=e6]: WELCOME BACK TO KJB READER.
  - generic [ref=e11]:
    - heading "About & Credits" [level=1] [ref=e16]
    - button "Back" [ref=e19] [cursor=pointer]
    - generic [ref=e22]:
      - heading "Bible Text" [level=2] [ref=e27]
      - paragraph [ref=e28]:
        - text: King James Bible (KJB) — public domain text, sourced from
        - link "bibleprotector.com" [ref=e29] [cursor=pointer]:
          - /url: https://bibleprotector.com
        - text: ", the authoritative electronic text of the Pure Cambridge Edition, which offers free PDF, ePub, and TXT downloads."
      - paragraph [ref=e30]: "This app uses the King James Bible: Pure Cambridge Edition (Wharton Text Format). The KJB text is public domain worldwide. In the United Kingdom, it is protected by a perpetual Crown Copyright administered by the King's Printer; this app is for personal, non-commercial use only. For commercial use within the UK, a licence from Cambridge University Press or the King's Printer may be required."
    - generic [ref=e31]:
      - heading "Fonts" [level=2] [ref=e36]
      - paragraph [ref=e37]: Reading & Decorative
      - list [ref=e38]:
        - listitem [ref=e39]:
          - generic [ref=e40]: •
          - generic [ref=e41]:
            - strong [ref=e42]: Cormorant Garamond
            - text: — reading font option
        - listitem [ref=e43]:
          - generic [ref=e44]: •
          - generic [ref=e45]:
            - strong [ref=e46]: Merriweather
            - text: — reading font option
        - listitem [ref=e47]:
          - generic [ref=e48]: •
          - generic [ref=e49]:
            - strong [ref=e50]: Inter
            - text: — interface text
        - listitem [ref=e51]:
          - generic [ref=e52]: •
          - generic [ref=e53]:
            - strong [ref=e54]: Caveat, Dancing Script, Great Vibes
            - text: — handwritten-style fonts for shareable verse cards
        - listitem [ref=e55]:
          - generic [ref=e56]: •
          - generic [ref=e57]:
            - strong [ref=e58]: Comic Neue
            - text: — a friendly, rounded font option for verse cards
        - listitem [ref=e59]:
          - generic [ref=e60]: •
          - generic [ref=e61]:
            - strong [ref=e62]: Serif, Sans, Mono, Cursive
            - text: reading-font options use your device's own built-in fonts — no download or separate attribution needed.
      - paragraph [ref=e63]:
        - text: All of the above are Google Fonts, released under the
        - link "SIL Open Font License" [ref=e64] [cursor=pointer]:
          - /url: https://scripts.sil.org/OFL
        - text: .
      - paragraph [ref=e65]: Accessibility
      - list [ref=e66]:
        - listitem [ref=e67]:
          - generic [ref=e68]: •
          - generic [ref=e69]:
            - strong [ref=e70]: Atkinson Hyperlegible
            - text: — designed by the
            - link "Braille Institute of America" [ref=e71] [cursor=pointer]:
              - /url: https://brailleinstitute.org/freefont
            - text: for readers with low vision. SIL Open Font License.
        - listitem [ref=e72]:
          - generic [ref=e73]: •
          - generic [ref=e74]:
            - strong [ref=e75]: OpenDyslexic
            - text: — designed by
            - link "Abbie Gonzalez" [ref=e76] [cursor=pointer]:
              - /url: https://opendyslexic.org
            - text: to increase readability for readers with dyslexia. SIL Open Font License.
      - paragraph [ref=e77]: In the Android app (Google Play), these fonts are bundled with the app itself so they're available offline from first launch, instead of being downloaded from Google Fonts.
    - generic [ref=e78]:
      - heading "App Platform & Thanks" [level=2] [ref=e84]
      - list [ref=e85]:
        - listitem [ref=e86]:
          - generic [ref=e87]: •
          - generic [ref=e88]:
            - strong [ref=e89]: "App Platform:"
            - text: Built with
            - link "Base44" [ref=e90] [cursor=pointer]:
              - /url: https://base44.com
        - listitem [ref=e95]:
          - generic [ref=e96]: •
          - generic [ref=e97]:
            - strong [ref=e98]: "Android App (Google Play):"
            - text: Built with
            - link "Capacitor" [ref=e99] [cursor=pointer]:
              - /url: https://capacitorjs.com
            - text: (open source, MIT License), generated with the help of Claude
        - listitem [ref=e104]:
          - generic [ref=e105]: •
          - generic [ref=e106]:
            - strong [ref=e107]: "Icons:"
            - link "Lucide" [ref=e108] [cursor=pointer]:
              - /url: https://lucide.dev
            - text: (open source, ISC License)
        - listitem [ref=e113]:
          - generic [ref=e114]: •
          - generic [ref=e115]:
            - strong [ref=e116]: "Special Thanks:"
            - text: Elvish Ishaan for fixing bugs and issues.
    - generic [ref=e117]:
      - heading "Disclaimers" [level=2] [ref=e122]
      - list [ref=e123]:
        - listitem [ref=e124]:
          - generic [ref=e125]: •
          - generic [ref=e126]:
            - strong [ref=e127]: "AI Disclaimer:"
            - text: This app was built with the assistance of artificial intelligence (AI). AI-generated code and content may contain errors. The King James Bible text itself is not AI-generated. Please report any issues so we can correct them.
      - paragraph [ref=e128]: This app is public domain and freely shareable.
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
      |           ^ Error: /credits @ 360px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```