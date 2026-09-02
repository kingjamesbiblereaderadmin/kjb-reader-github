# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 320px] >> no horizontal overflow: /extension
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /extension @ 320px overflows horizontally by 0px:
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
    - generic [ref=e4]:
      - img "Base44" [ref=e5]
      - paragraph [ref=e6]:
        - text: Made with
        - link "Base44 Superagent" [ref=e7] [cursor=pointer]:
          - /url: https://base44.com/superagents
    - generic [ref=e8]:
      - link "Back to Resources" [ref=e10] [cursor=pointer]:
        - /url: /resources
      - generic [ref=e13]:
        - img "KJB Reader SidePanel" [ref=e14]
        - heading "KJB Reader - SidePanel" [level=1] [ref=e15]
        - generic [ref=e16]: v0.4.227
        - paragraph [ref=e19]:
          - strong [ref=e20]: Desktop & Edge Mobile
          - text: — Available for Chrome, Edge, Brave, Firefox, and Opera on desktop. Also tested on Microsoft Edge mobile. Other mobile browsers may not support browser extensions.
        - paragraph [ref=e21]: Read, search, and look up Bible verses from any web page.
        - generic [ref=e22]:
          - link [ref=e23] [cursor=pointer]:
            - /url: https://chromewebstore.google.com/detail/kjb-reader-sidepanel/gbnipepkpenjgdpjfepgcgddmgbofmah
            - img "Available in the Chrome Web Store" [ref=e24]
          - link "Get it from Microsoft Edge Works on mobile" [ref=e26] [cursor=pointer]:
            - /url: https://microsoftedge.microsoft.com/addons/detail/kjb-reader-sidepanel/bphmmbiepbhfnfijaapbmpimkkjdceee
            - img "Get it from Microsoft Edge" [ref=e27]
            - generic [ref=e28]: Works on mobile
          - link [ref=e29] [cursor=pointer]:
            - /url: https://addons.mozilla.org/en-US/firefox/addon/kjb-reader-sidepanel/
            - img "Get the Add-on for Firefox" [ref=e30]
          - link "Get for Opera" [ref=e32] [cursor=pointer]:
            - /url: https://base44.app/api/apps/6a713d810d97fdb5921ed14e/files/mp/public/6a713d810d97fdb5921ed14e/de5519934_kjb-reader-opera-v04190.zip
      - generic [ref=e36]:
        - heading "See It In Action" [level=2] [ref=e37]
        - img "KJB Reader Extension preview" [ref=e39]
      - generic [ref=e40]:
        - heading "Try These Examples" [level=2] [ref=e41]
        - paragraph [ref=e42]: Install the extension, then click any reference below to look it up instantly in the side panel.
        - generic [ref=e43]:
          - generic [ref=e44]:
            - paragraph [ref=e45]: Single Verses
            - generic [ref=e46]:
              - paragraph [ref=e47]: Ephesians 1:13
              - paragraph [ref=e48]: Romans 3:25
              - paragraph [ref=e49]: Hebrews 9:12
          - generic [ref=e50]:
            - paragraph [ref=e51]: Verse Ranges
            - generic [ref=e52]:
              - paragraph [ref=e53]: 1 Corinthians 15:1-4
              - paragraph [ref=e54]: Romans 3:23-25
              - paragraph [ref=e55]: Ephesians 2:8-9
          - generic [ref=e56]:
            - paragraph [ref=e57]: Whole Chapters
            - generic [ref=e58]:
              - paragraph [ref=e59]: Psalm 23
              - paragraph [ref=e60]: Isaiah 53
              - paragraph [ref=e61]: Psalm 119
              - paragraph [ref=e62]: Hebrews 13
          - generic [ref=e63]:
            - paragraph [ref=e64]: Chapter Ranges
            - generic [ref=e65]:
              - paragraph [ref=e66]: Romans 1-3
              - paragraph [ref=e67]: Ephesians 1-2
      - generic [ref=e68]:
        - heading "Features" [level=2] [ref=e69]
        - generic [ref=e70]:
          - generic [ref=e76]:
            - paragraph [ref=e77]: Instant Verse Lookup
            - paragraph [ref=e78]: Auto-detect Bible references on any web page. Verses become clickable links that open in the sidebar.
          - generic [ref=e83]:
            - paragraph [ref=e84]: Read the KJB
            - paragraph [ref=e85]: Full King James Bible (Pure Cambridge Edition) with chapter navigation, verse numbers, and pilcrows.
          - generic [ref=e90]:
            - paragraph [ref=e91]: Right-Click Search
            - paragraph [ref=e92]: Select any text on a page, right-click, and look it up in the KJB sidebar instantly.
          - generic [ref=e97]:
            - paragraph [ref=e98]: Advanced Search
            - paragraph [ref=e99]: Wildcards (? and *), whole-word match, case sensitivity, and Old/New Testament filtering.
          - generic [ref=e104]:
            - paragraph [ref=e105]: Gospel Tab
            - paragraph [ref=e106]: Built-in salvation guide with 1 Corinthians 15:1-4, Romans 3:25, and verified KJB preachers.
          - generic [ref=e112]:
            - paragraph [ref=e113]: Resources Tab
            - paragraph [ref=e114]: Quick links to KJBI.org, Discord bot, KJB defence materials, and ministry websites.
      - generic [ref=e115]:
        - heading "Installation Instructions" [level=2] [ref=e116]
        - list [ref=e117]:
          - listitem [ref=e118]:
            - generic [ref=e119]: "1"
            - generic [ref=e120]: Download the .zip file using the button above
          - listitem [ref=e121]:
            - generic [ref=e122]: "2"
            - generic [ref=e123]: Extract/unzip the downloaded file
          - listitem [ref=e124]:
            - generic [ref=e125]: "3"
            - generic [ref=e126]:
              - text: Open Chrome and go to
              - code [ref=e127]: chrome://extensions
          - listitem [ref=e128]:
            - generic [ref=e129]: "4"
            - generic [ref=e130]: Enable ‘Developer mode’ (toggle in top right)
          - listitem [ref=e131]:
            - generic [ref=e132]: "5"
            - generic [ref=e133]: Click ‘Load unpacked’ and select the extracted folder
          - listitem [ref=e134]:
            - generic [ref=e135]: "6"
            - generic [ref=e136]: The KJB SidePanel icon will appear in your toolbar
      - generic [ref=e137]:
        - link [ref=e138] [cursor=pointer]:
          - /url: /extension-privacy
          - generic [ref=e142]:
            - paragraph [ref=e143]: Extension Privacy Policy
            - paragraph [ref=e144]: How the extension handles your data
        - link [ref=e147] [cursor=pointer]:
          - /url: /extension-terms
          - generic [ref=e152]:
            - paragraph [ref=e153]: Extension Terms of Service
            - paragraph [ref=e154]: Terms for using the extension
        - link [ref=e157] [cursor=pointer]:
          - /url: /extension-license
          - generic [ref=e163]:
            - paragraph [ref=e164]: Extension MIT License
            - paragraph [ref=e165]: Open-source licence terms
        - link [ref=e168] [cursor=pointer]:
          - /url: /extension/change-log
          - generic [ref=e174]:
            - paragraph [ref=e175]: Changelog
            - paragraph [ref=e176]: Full version history
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
      |           ^ Error: /extension @ 320px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```