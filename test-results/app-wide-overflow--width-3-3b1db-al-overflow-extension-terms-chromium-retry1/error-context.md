# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 360px] >> no horizontal overflow: /extension-terms
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /extension-terms @ 360px overflows horizontally by 0px:
  <div class="absolute top-0 h-full rounded-full"> "" (over by 4.1px)

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 8

- Array []
+ Array [
+   Object {
+     "cls": "absolute top-0 h-full rounded-full",
+     "overBy": 4.1,
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
      - heading "KJB Reader Extension — Terms of Service" [level=1] [ref=e10]
      - paragraph [ref=e11]: "Last updated: August 11th, 2026"
    - link "Back to Extension" [ref=e14] [cursor=pointer]:
      - /url: /extension
    - generic [ref=e17]:
      - generic [ref=e18]: ⚠️
      - paragraph [ref=e19]:
        - strong [ref=e20]: "AI-Generated Notice:"
        - text: These Terms of Service were generated with the assistance of artificial intelligence (AI) and may contain errors or omissions. They are not a substitute for professional legal advice.
    - generic [ref=e21]:
      - heading "Acceptance of Terms" [level=2] [ref=e22]
      - paragraph [ref=e24]: By installing and using the KJB Reader browser extension ("KJB Reader - SidePanel"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please uninstall the extension.
    - generic [ref=e25]:
      - heading "Description of Service" [level=2] [ref=e26]
      - paragraph [ref=e28]: The KJB Reader browser extension is a free, non-commercial companion tool that detects King James Bible verse references on web pages and displays them in a browser side panel. It provides Bible search, reading, and verse lookup functionality. The extension is available for Chrome, Edge, Firefox, and Opera.
    - generic [ref=e29]:
      - heading "Free and Public Domain" [level=2] [ref=e30]
      - paragraph [ref=e32]: The King James Bible text used in this extension is in the public domain worldwide. In the United Kingdom, the KJB is protected by a perpetual Crown Copyright administered by the King's Printer. This extension is intended for personal, non-commercial use only.
    - generic [ref=e33]:
      - heading "Use of the Extension" [level=2] [ref=e34]
      - generic [ref=e35]:
        - paragraph [ref=e36]: "You agree to use the extension only for lawful purposes. You agree not to:"
        - list [ref=e37]:
          - listitem [ref=e38]: Use the extension in any way that breaches applicable local, national, or international law.
          - listitem [ref=e39]: Attempt to gain unauthorised access to, interfere with, or disrupt the extension's systems or data.
          - listitem [ref=e40]: Reproduce, duplicate, or resell the extension for commercial purposes without permission.
    - generic [ref=e41]:
      - heading "No Accounts Required" [level=2] [ref=e42]
      - paragraph [ref=e44]: The extension does not require an account. There is no sign-in, no cloud sync, and no remote data storage. All your preferences exist only on your device. You are responsible for managing your own data.
    - generic [ref=e45]:
      - heading "Permissions" [level=2] [ref=e46]
      - paragraph [ref=e48]: "The extension uses these permissions: activeTab (detects Bible verse references on web pages), contextMenus (right-click verse lookup), sidePanel (displays the reader in the browser side panel), storage (stores preferences locally), and tabs (opens website links in new tabs). No page content is collected or transmitted."
    - generic [ref=e49]:
      - heading "Intellectual Property" [level=2] [ref=e50]
      - paragraph [ref=e52]: The extension's software, design, and original content are provided by me. The King James Bible text is sourced from the Pure Cambridge Edition and is in the public domain. The extension was built with the assistance of artificial intelligence (AI) and the Base44 platform.
    - generic [ref=e53]:
      - heading "Disclaimer of Warranties" [level=2] [ref=e54]
      - paragraph [ref=e56]: The extension is provided "as is" and "as available" without warranties of any kind. I do not guarantee that the extension will be error-free, uninterrupted, or free from inaccuracies. You use the extension at your own risk.
    - generic [ref=e57]:
      - heading "Limitation of Liability" [level=2] [ref=e58]
      - paragraph [ref=e60]: To the fullest extent permitted by law, I shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the extension.
    - generic [ref=e61]:
      - heading "Changes to These Terms" [level=2] [ref=e62]
      - paragraph [ref=e64]: I may update these Terms of Service from time to time. Any changes will appear on this page with a revised "Last updated" date.
    - generic [ref=e65]:
      - heading "Contact" [level=2] [ref=e66]
      - paragraph [ref=e68]:
        - text: If you have any questions about these Terms, please contact me at
        - link "kingjamesbiblereader@outlook.sg" [ref=e69] [cursor=pointer]:
          - /url: mailto:kingjamesbiblereader@outlook.sg
        - text: .
    - link "Back to Extension" [ref=e71] [cursor=pointer]:
      - /url: /extension
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
      |           ^ Error: /extension-terms @ 360px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```