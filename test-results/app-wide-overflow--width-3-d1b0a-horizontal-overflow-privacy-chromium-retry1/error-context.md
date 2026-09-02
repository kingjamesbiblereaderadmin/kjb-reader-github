# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 360px] >> no horizontal overflow: /privacy
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /privacy @ 360px overflows horizontally by 0px:
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
      - heading "Privacy Policy" [level=1] [ref=e9]
      - paragraph [ref=e10]: "Last updated: September 1st, 2026"
    - button "Back" [ref=e13] [cursor=pointer]
    - generic [ref=e16]:
      - generic [ref=e17]: ⚠️
      - paragraph [ref=e18]:
        - strong [ref=e19]: "AI-Generated Notice:"
        - text: This Privacy Policy was generated with the assistance of artificial intelligence (AI) and may contain errors or omissions. It is not a substitute for professional legal advice. If you have specific privacy or legal concerns, please consult a qualified professional.
    - generic [ref=e20]:
      - heading "Overview" [level=2] [ref=e21]
      - paragraph [ref=e23]: KJB Reader is a free, public-domain King James Bible reading app. Your privacy matters to me. The App works entirely on your own device — no account is required, and no personal information is collected. All your data stays only on your device. I do not sell or share your personal information with third parties.
    - generic [ref=e24]:
      - heading "Information I Collect" [level=2] [ref=e25]
      - paragraph [ref=e27]: I do not collect any personal information. No account is needed to use the App, and I do not ask for your name, email address, location, contacts, device files, or any tracking identifiers. The App is fully functional without signing in. No Bible content or reading data is stored on my servers.
    - generic [ref=e28]:
      - heading "Data Stored On Your Device" [level=2] [ref=e29]
      - generic [ref=e30]:
        - paragraph [ref=e31]: "To make the app work offline and remember your preferences, the following are stored locally on your own device (using your browser's storage):"
        - list [ref=e32]:
          - listitem [ref=e33]: Your settings (theme, fonts, text size, daily verse style).
          - listitem [ref=e34]: Saved verses and reading position.
          - listitem [ref=e35]: An offline copy of the Bible text, if you choose to download it.
          - listitem [ref=e36]: Extension preferences (API configuration) — stored locally via Chrome's storage API if you use the browser extension.
        - paragraph [ref=e37]: All of this data stays only on your device. You can clear it at any time using the "Reset All Settings" or "Clear Cache" options in Settings, or by clearing your browser data.
    - generic [ref=e38]:
      - heading "No Cloud Sync" [level=2] [ref=e39]
      - paragraph [ref=e41]: The core Bible-reading App does not sync any data to the cloud. There are no accounts, no sign-in, and no cloud storage. Everything you do in the App — your saved verses, reading progress, settings, and preferences — exists only on the device you are using. (The optional Discord bot integration, described below, is a separate feature that stores minimal server configuration on my servers.)
    - generic [ref=e42]:
      - heading "KJB Reader Discord Bot" [level=2] [ref=e43]
      - generic [ref=e44]:
        - paragraph [ref=e45]: KJB Reader offers an optional Discord bot that server administrators can add to their own Discord servers for slash-command Bible lookups and scheduled daily verse delivery. This is a separate, opt-in feature from the core reading app described above.
        - paragraph [ref=e46]: "When a server administrator installs and configures the bot, I store the following minimal server configuration on my servers: the Discord server (guild) ID and name, the configured channel name, a Discord webhook URL (used only to post messages to that channel), an optional role ID (used only for the daily verse ping), the chosen delivery time and timezone, and whether delivery is active. I do not store who configured the bot beyond a generic internal label — no personal identifiers of the person running setup are stored."
        - paragraph [ref=e47]: The bot does not use Discord's privileged intents and does not collect profile information about server members. On servers where the bot is added, it reads message text solely to detect Bible references typed in natural language (e.g. "John 3:16") in order to reply with the verse — it does not store, log, or retain message content beyond the moment needed to generate that reply, and does not use messages for any other purpose.
        - paragraph [ref=e48]: This server configuration data is used solely to deliver the scheduled daily verse and to respond to bot commands and mentions. It is never sold or shared with third parties. Server administrators can disable delivery at any time using the /setup disable command, or remove the bot from their server entirely to stop all data use; removing the bot deletes the stored configuration for that server.
        - paragraph [ref=e49]:
          - text: To request removal of a specific server's stored configuration, contact me at
          - link "kingjamesbiblereader@outlook.sg" [ref=e50] [cursor=pointer]:
            - /url: mailto:kingjamesbiblereader@outlook.sg
          - text: with the server name.
    - generic [ref=e51]:
      - heading "Internet Connection & Updates" [level=2] [ref=e52]
      - paragraph [ref=e54]: The app connects to the internet to download the Bible text and to automatically apply updates, typo corrections, and improvements. These requests deliver content to your device and are not used to track or profile you. Standard, non-identifying technical information (such as your IP address) may be processed by my hosting provider purely to deliver the app, as is normal for any website.
    - generic [ref=e55]:
      - heading "Cookies & Analytics" [level=2] [ref=e56]
      - paragraph [ref=e58]: The App does not use cookies to track you. I do not use advertising or third-party tracking cookies. Anonymous, aggregated usage statistics (such as the number of times a page is viewed) may be collected solely to help me improve the site. These statistics are not linked to you or your device and cannot be used to identify anyone personally.
    - generic [ref=e59]:
      - heading "Browser Extension" [level=2] [ref=e60]
      - paragraph [ref=e62]: "The KJB Reader Extension (KJB Reader - SidePanel) is a companion browser extension available on the Chrome Web Store that provides Bible search, reading, and verse lookup from a sidebar panel in your browser. The extension uses these permissions: activeTab (detects Bible verse references on web pages), contextMenus (right-click verse lookup), sidePanel (displays the reader in Chrome side panel), storage (stores preferences locally), and tabs (opens website links in new tabs). No page content is collected or transmitted. The extension does not collect personal information and does not require an account. It fetches Bible verse data as JSON from the KJB Reader API on base44.app. No user data is sent to the server."
    - generic [ref=e63]:
      - heading "Third-Party Content & Licences" [level=2] [ref=e64]
      - paragraph [ref=e66]: The Bible text used is the King James Bible (Pure Cambridge Edition), which is in the public domain.
    - generic [ref=e67]:
      - heading "Children's Privacy" [level=2] [ref=e68]
      - paragraph [ref=e70]: KJB Reader does not knowingly collect any personal information from anyone, including children. The app is safe for all ages.
    - generic [ref=e71]:
      - heading "Changes to This Policy" [level=2] [ref=e72]
      - paragraph [ref=e74]: I may update this Privacy Policy from time to time. Any changes will appear on this page with a revised "Last updated" date.
    - generic [ref=e75]:
      - heading "AI Disclaimer" [level=2] [ref=e76]
      - paragraph [ref=e78]: This app was built with the assistance of artificial intelligence (AI). While great care has been taken to ensure accuracy, AI-generated code and content may contain errors. The King James Bible text itself is sourced from the Pure Cambridge Edition and is not AI-generated. If you notice any issue, please contact me so I can correct it.
    - generic [ref=e79]:
      - heading "Contact" [level=2] [ref=e80]
      - paragraph [ref=e82]:
        - text: If you have any questions about this Privacy Policy, please contact me at
        - link "kingjamesbiblereader@outlook.sg" [ref=e83] [cursor=pointer]:
          - /url: mailto:kingjamesbiblereader@outlook.sg
        - text: .
    - button "Back" [ref=e85] [cursor=pointer]
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
      |           ^ Error: /privacy @ 360px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```