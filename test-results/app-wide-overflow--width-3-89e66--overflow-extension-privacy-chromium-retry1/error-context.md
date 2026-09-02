# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 360px] >> no horizontal overflow: /extension-privacy
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /extension-privacy @ 360px overflows horizontally by 0px:
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
      - heading "KJB Reader Extension — Privacy Policy" [level=1] [ref=e10]
      - paragraph [ref=e11]: "Last updated: August 11th, 2026"
    - link "Back to Extension" [ref=e14] [cursor=pointer]:
      - /url: /extension
    - generic [ref=e17]:
      - generic [ref=e18]: ⚠️
      - paragraph [ref=e19]:
        - strong [ref=e20]: "AI-Generated Notice:"
        - text: This Privacy Policy was generated with the assistance of artificial intelligence (AI) and may contain errors or omissions. It is not a substitute for professional legal advice. If you have specific privacy or legal concerns, please consult a qualified professional.
    - generic [ref=e21]:
      - heading "Overview" [level=2] [ref=e22]
      - paragraph [ref=e24]: The KJB Reader browser extension ("KJB Reader - SidePanel") is a companion tool that detects King James Bible verse references on web pages and displays them in a browser side panel. The extension does not collect any personal information, does not require an account, and does not transmit your data to any server.
    - generic [ref=e25]:
      - heading "Permissions and How They Are Used" [level=2] [ref=e26]
      - list [ref=e28]:
        - listitem [ref=e29]:
          - strong [ref=e30]: activeTab
          - text: ": Accesses the text content of the currently active tab only when you click the extension icon or use the right-click context menu. No page content is stored or transmitted."
        - listitem [ref=e31]:
          - strong [ref=e32]: contextMenus
          - text: ": Adds a \"Look up verse in KJB Reader\" option to the right-click menu."
        - listitem [ref=e33]:
          - strong [ref=e34]: sidePanel
          - text: ": Displays the Bible reader interface in the browser's side panel."
        - listitem [ref=e35]:
          - strong [ref=e36]: storage
          - text: ": Stores your preferences locally on your device. No personal data is stored."
        - listitem [ref=e37]:
          - strong [ref=e38]: tabs
          - text: ": Used to open the sidebar panel and navigate to kingjamesbiblereader.com for updates. Does not monitor browsing history."
    - generic [ref=e39]:
      - heading "Data I Collect" [level=2] [ref=e40]
      - paragraph [ref=e42]: I do not collect any personal information. No analytics or tracking scripts are included.
    - generic [ref=e43]:
      - heading "Data Stored On Your Device" [level=2] [ref=e44]
      - paragraph [ref=e46]: Theme and display settings, sidebar panel state — stored locally via the browser's storage API. No cloud sync. Clear by removing the extension.
    - generic [ref=e47]:
      - heading "Internet Access" [level=2] [ref=e48]
      - paragraph [ref=e50]: Fetches Bible verse text as JSON from the KJB Reader API on base44.app. No user data is sent to the server.
    - generic [ref=e51]:
      - heading "Content Script" [level=2] [ref=e52]
      - paragraph [ref=e54]: Scans page text to detect Bible verse references and converts them to clickable links. Page content is processed entirely on your device and never sent to any server. Excludes kingjamesbiblereader.com.
    - generic [ref=e55]:
      - heading "Children's Privacy" [level=2] [ref=e56]
      - paragraph [ref=e58]: Safe for all ages. No personal information collected.
    - generic [ref=e59]:
      - heading "Contact" [level=2] [ref=e60]
      - paragraph [ref=e62]:
        - link "kingjamesbiblereader@outlook.sg" [ref=e63] [cursor=pointer]:
          - /url: mailto:kingjamesbiblereader@outlook.sg
    - link "Back to Extension" [ref=e65] [cursor=pointer]:
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
      |           ^ Error: /extension-privacy @ 360px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```