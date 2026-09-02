# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 320px] >> no horizontal overflow: /terms
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /terms @ 320px overflows horizontally by 0px:
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
      - heading "Terms of Service" [level=1] [ref=e10]
      - paragraph [ref=e11]: "Last updated: September 1st, 2026"
    - button "Back" [ref=e14] [cursor=pointer]
    - generic [ref=e17]:
      - generic [ref=e18]: ⚠️
      - paragraph [ref=e19]:
        - strong [ref=e20]: "AI-Generated Notice:"
        - text: These Terms of Service were generated with the assistance of artificial intelligence (AI) and may contain errors or omissions. They are not a substitute for professional legal advice. If you have specific legal concerns, please consult a qualified legal professional.
    - generic [ref=e21]:
      - heading "Acceptance of Terms" [level=2] [ref=e22]
      - paragraph [ref=e24]: By accessing or using KJB Reader ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
    - generic [ref=e25]:
      - heading "Description of Service" [level=2] [ref=e26]
      - paragraph [ref=e28]: KJB Reader is a free, non-commercial application that provides access to the King James Bible (Pure Cambridge Edition) for personal reading, study, and reflection. The App works offline, offers daily verses, search, bookmarks, and customisable reading settings. A browser extension is also available, providing the same Bible reading and search functionality as a sidebar panel.
    - generic [ref=e29]:
      - heading "Free and Public Domain" [level=2] [ref=e30]
      - generic [ref=e31]:
        - paragraph [ref=e32]: The King James Bible text used in this App is in the public domain worldwide. In the United Kingdom, the KJB is protected by a perpetual Crown Copyright administered by the King's Printer. This App is intended for personal, non-commercial use only. For commercial use within the UK, a licence from Cambridge University Press or the King's Printer may be required.
        - paragraph [ref=e33]: The App itself is provided free of charge and may be freely shared.
    - generic [ref=e34]:
      - heading "Use of the App" [level=2] [ref=e35]
      - generic [ref=e36]:
        - paragraph [ref=e37]: "You agree to use the App only for lawful purposes and in a manner that does not infringe the rights of, or restrict the use and enjoyment of, the App by any third party. You agree not to:"
        - list [ref=e38]:
          - listitem [ref=e39]: Use the App in any way that breaches applicable local, national, or international law or regulation.
          - listitem [ref=e40]: Attempt to gain unauthorised access to, interfere with, or disrupt the App's systems or data.
          - listitem [ref=e41]: Use the App to transmit any malicious code, viruses, or harmful content.
          - listitem [ref=e42]: Reproduce, duplicate, or resell the App for commercial purposes without permission.
    - generic [ref=e43]:
      - heading "No Accounts Required" [level=2] [ref=e44]
      - paragraph [ref=e46]: The core reading App does not require an account. There is no sign-in, no cloud sync, and no remote data storage. All your data — saved verses, reading progress, and settings — exists only on the device you are using. You are responsible for managing your own data on your device. (The optional Discord bot integration, described below, is a separate feature that stores minimal server configuration on my servers.)
    - generic [ref=e47]:
      - heading "KJB Reader Discord Bot" [level=2] [ref=e48]
      - generic [ref=e49]:
        - paragraph [ref=e50]: KJB Reader also offers an optional Discord bot for server administrators to add to their own Discord servers, providing slash-command Bible lookups and scheduled daily verse delivery. Unlike the core reading app, this feature requires storing minimal server configuration (server ID/name, channel, delivery time/timezone, and an optional role for pings) on my servers so scheduled deliveries can run — see the Privacy Policy for details on exactly what is stored.
        - paragraph [ref=e51]: The bot is provided free of charge, "as is," with no guarantee of uninterrupted uptime or delivery at the exact configured time. Server administrators are responsible for ensuring their use of the bot complies with Discord's own Terms of Service and Community Guidelines. Administrators may disable or remove the bot from their server at any time.
    - generic [ref=e52]:
      - heading "Browser Extension" [level=2] [ref=e53]
      - paragraph [ref=e55]: The KJB Reader Extension (KJB Reader - SidePanel) is provided as a free companion to the KJB Reader website, available on browser extension stores (Chrome Web Store, Firefox Add-ons, Opera Add-ons). It uses the same King James Bible text (Pure Cambridge Edition). The extension does not require an account and does not collect personal data. You may uninstall it at any time through your browser extension management page.
    - generic [ref=e56]:
      - heading "Intellectual Property" [level=2] [ref=e57]
      - paragraph [ref=e59]: The App's software, design, and original content (excluding the Bible text, which is public domain) are provided by me. The App was built with the assistance of artificial intelligence (AI) and the Base44 platform. Fonts used in the App are open source under the SIL Open Font License.
    - generic [ref=e60]:
      - heading "Third-Party Content & Licences" [level=2] [ref=e61]
      - paragraph [ref=e63]: The Bible text used is the King James Bible (Pure Cambridge Edition), which is in the public domain.
    - generic [ref=e64]:
      - heading "AI Disclaimer" [level=2] [ref=e65]
      - paragraph [ref=e67]: This App was built with the assistance of artificial intelligence (AI). While great care has been taken to ensure accuracy, AI-generated code and content may contain errors. The King James Bible text itself is sourced from the Pure Cambridge Edition and is not AI-generated. If you notice any issue, please contact me so I can correct it.
    - generic [ref=e68]:
      - heading "Disclaimer of Warranties" [level=2] [ref=e69]
      - paragraph [ref=e71]: The App is provided "as is" and "as available" without warranties of any kind, whether express or implied. While every effort is made to ensure the Bible text is accurate, I do not guarantee that the App will be error-free, uninterrupted, or free from inaccuracies. You use the App at your own risk.
    - generic [ref=e72]:
      - heading "Limitation of Liability" [level=2] [ref=e73]
      - paragraph [ref=e75]: To the fullest extent permitted by law, KJB Reader shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, arising from your use of or inability to use the App.
    - generic [ref=e76]:
      - heading "Changes to These Terms" [level=2] [ref=e77]
      - paragraph [ref=e79]: I may update these Terms of Service from time to time. Any changes will appear on this page with a revised "Last updated" date. Continued use of the App after changes constitutes acceptance of the updated terms.
    - generic [ref=e80]:
      - heading "Contact" [level=2] [ref=e81]
      - paragraph [ref=e83]:
        - text: If you have any questions about these Terms of Service, please contact me at
        - link "kingjamesbiblereader@outlook.sg" [ref=e84] [cursor=pointer]:
          - /url: mailto:kingjamesbiblereader@outlook.sg
        - text: .
    - button "Back" [ref=e86] [cursor=pointer]
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
      |           ^ Error: /terms @ 320px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```