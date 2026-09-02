# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 320px] >> no horizontal overflow: /settings
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /settings @ 320px overflows horizontally by 0px:
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
        - textbox [ref=e14]
        - generic [ref=e15]:
          - button "Toggle fullscreen" [ref=e16] [cursor=pointer]
          - button "Toggle theme" [ref=e17] [cursor=pointer]
          - button "Open menu" [ref=e18] [cursor=pointer]
    - main [ref=e19]:
      - generic [ref=e22]:
        - generic [ref=e23]:
          - heading "Settings" [level=1] [ref=e28]
          - paragraph [ref=e29]: Customise your experience
          - button "Expand All" [ref=e31] [cursor=pointer]
        - generic [ref=e32]:
          - button [ref=e33] [cursor=pointer]:
            - generic [ref=e34]:
              - heading "Display" [level=2] [ref=e35]
              - paragraph [ref=e36]: Customise text size, zoom, font and rotation
          - generic [ref=e39]:
            - generic [ref=e41]:
              - generic [ref=e42]:
                - paragraph [ref=e43]: "Text Size: 100%"
                - paragraph [ref=e44]: Default size
              - generic [ref=e45]:
                - button "Decrease text size" [ref=e46] [cursor=pointer]
                - button "Increase text size" [ref=e50] [cursor=pointer]
            - generic [ref=e55]:
              - generic [ref=e56]:
                - paragraph [ref=e57]: "App Zoom: 100%"
                - paragraph [ref=e58]: Scales the whole app's layout on every page — not just the reader
              - generic [ref=e59]:
                - button "Decrease app zoom" [ref=e60] [cursor=pointer]
                - button "Increase app zoom" [ref=e64] [cursor=pointer]
            - generic [ref=e69]:
              - generic [ref=e74]:
                - paragraph [ref=e75]: Auto Rotate
                - paragraph [ref=e76]: Allow the screen to rotate with your device
              - switch [checked] [ref=e77] [cursor=pointer]
            - generic [ref=e78]:
              - paragraph [ref=e82]: Font Family
              - generic [ref=e83]:
                - button "Serif (Merriweather)" [ref=e84] [cursor=pointer]
                - button "Sans Serif (Inter)" [ref=e85] [cursor=pointer]
                - button "Mono" [ref=e86] [cursor=pointer]
                - button "Cursive" [ref=e87] [cursor=pointer]
                - button "Times New Roman" [ref=e88] [cursor=pointer]
        - generic [ref=e89]:
          - button [ref=e90] [cursor=pointer]:
            - generic [ref=e91]:
              - heading "Accessibility" [level=2] [ref=e92]
              - paragraph [ref=e93]: Reading fonts for the whole app
          - generic [ref=e96]:
            - paragraph [ref=e104]: Accessibility Font
            - paragraph [ref=e105]: Applies across the entire app — menus, pages, and scripture.
            - generic [ref=e106]:
              - button [ref=e107] [cursor=pointer]:
                - generic [ref=e108]:
                  - paragraph [ref=e109]: OpenDyslexic
                  - paragraph [ref=e110]: Designed for readers with dyslexia
              - button [ref=e111] [cursor=pointer]:
                - generic [ref=e112]:
                  - paragraph [ref=e113]: Atkinson Hyperlegible
                  - paragraph [ref=e114]: High legibility for low vision
        - generic [ref=e115]:
          - button [ref=e116] [cursor=pointer]:
            - generic [ref=e117]:
              - heading "Appearance" [level=2] [ref=e118]
              - paragraph [ref=e119]: Customise the look and feel
          - generic [ref=e122]:
            - generic [ref=e123]:
              - heading "Theme" [level=3] [ref=e124]
              - generic [ref=e125]:
                - button "☀️ Light" [ref=e126] [cursor=pointer]
                - button "🌙 Dark" [ref=e127] [cursor=pointer]
                - button "🕐 Auto" [ref=e128] [cursor=pointer]
                - button "📱 System" [ref=e129] [cursor=pointer]
              - paragraph [ref=e130]: "📱 System: follows your device setting"
            - generic [ref=e132]:
              - heading "Theme Colour" [level=3] [ref=e133]
              - generic [ref=e140]:
                - button "Indigo" [ref=e141] [cursor=pointer]
                - button "Sapphire" [ref=e144] [cursor=pointer]
                - button "Sky" [ref=e147] [cursor=pointer]
                - button "Teal" [ref=e150] [cursor=pointer]
                - button "Forest" [ref=e153] [cursor=pointer]
                - button "Amethyst" [ref=e156] [cursor=pointer]
                - button "Rose" [ref=e159] [cursor=pointer]
                - button "Crimson" [ref=e162] [cursor=pointer]
                - button "Amber" [ref=e165] [cursor=pointer]
                - button "Gold Leaf" [ref=e168] [cursor=pointer]
                - button "Burgundy" [ref=e171] [cursor=pointer]
                - button "Slate" [ref=e174] [cursor=pointer]
                - button "Antique" [ref=e177] [cursor=pointer]
                - generic "Custom colour" [ref=e180] [cursor=pointer]:
                  - textbox "Custom" [ref=e182]: "#b8860b"
                  - generic [ref=e183]: Custom
        - generic [ref=e184]:
          - button [ref=e185] [cursor=pointer]:
            - generic [ref=e186]:
              - heading "Offline Library" [level=2] [ref=e187]
              - paragraph [ref=e188]: Not available in preview mode
          - paragraph [ref=e193]:
            - generic [ref=e196]: Offline downloads are not available in private/incognito mode. The cache would be deleted when you close the private window. Open this app in a normal window to download the Bible for offline reading.
        - generic [ref=e197]:
          - button [ref=e198] [cursor=pointer]:
            - generic [ref=e199]:
              - heading "Download Bible" [level=2] [ref=e200]
              - paragraph [ref=e201]: Whole Bible with layout options
          - generic [ref=e204]:
            - paragraph [ref=e205]: Download the entire King James Bible — including title pages, pilcrows and italics — in your chosen layout. Runs on your device.
            - generic [ref=e206]:
              - paragraph [ref=e207]: Include
              - generic [ref=e208]:
                - button "Whole" [ref=e209] [cursor=pointer]
                - button "Old Test." [ref=e213] [cursor=pointer]
                - button "New Test." [ref=e218] [cursor=pointer]
            - generic [ref=e222]:
              - paragraph [ref=e223]: Format
              - generic [ref=e224]:
                - button "PDF" [ref=e225] [cursor=pointer]
                - button "Word" [ref=e231] [cursor=pointer]
                - button "RTF" [ref=e236] [cursor=pointer]
                - button "Text" [ref=e242] [cursor=pointer]
            - generic [ref=e247]:
              - paragraph [ref=e248]: Columns
              - generic [ref=e249]:
                - button "Single" [ref=e250] [cursor=pointer]
                - button "Two" [ref=e253] [cursor=pointer]
            - generic [ref=e257]:
              - paragraph [ref=e258]: Reading Flow
              - generic [ref=e259]:
                - button "Line" [ref=e260] [cursor=pointer]
                - button "Paragraph" [ref=e263] [cursor=pointer]
            - generic [ref=e266]:
              - paragraph [ref=e267]: Book Names
              - generic [ref=e268]:
                - button "Full" [ref=e269] [cursor=pointer]
                - button "Short" [ref=e273] [cursor=pointer]
              - paragraph [ref=e278]: e.g. "Genesis", "The Gospel According to Saint Matthew"
            - generic [ref=e279]:
              - generic [ref=e280]:
                - generic [ref=e281]:
                  - paragraph [ref=e282]: Include Subscripts
                  - paragraph [ref=e283]: Psalm superscriptions / titles
                - switch [checked] [ref=e284] [cursor=pointer]
              - generic [ref=e285]:
                - generic [ref=e286]:
                  - paragraph [ref=e287]: Include Colophons
                  - paragraph [ref=e288]: Epistle closing notes
                - switch [checked] [ref=e289] [cursor=pointer]
            - button "Download Bible (PDF) · ~6 MB" [ref=e290] [cursor=pointer]:
              - text: Download Bible (PDF)
              - generic [ref=e294]: · ~6 MB
            - paragraph [ref=e295]:
              - text: There may be occasional formatting issues depending on your device and reader. For feedback or to report a bug, please contact
              - link "kingjamesbiblereader@outlook.sg" [ref=e296] [cursor=pointer]:
                - /url: mailto:kingjamesbiblereader@outlook.sg
              - text: .
        - generic [ref=e297]:
          - button [ref=e298] [cursor=pointer]:
            - generic [ref=e299]:
              - heading "Old Browser & Offline Options" [level=2] [ref=e300]
              - paragraph [ref=e301]: Standalone HTML file and Legacy Reader for IE & old devices
          - generic [ref=e304]:
            - generic [ref=e305]:
              - paragraph [ref=e306]: Download the entire King James Bible as a single, self-contained HTML file (all 66 books, plus Gospel, Resources and About). It needs no internet, no app and no JavaScript — perfect for very old computers and browsers, or for hosting on your own website.
              - button "Download HTML File" [ref=e307] [cursor=pointer]
              - generic [ref=e311]:
                - paragraph [ref=e318]: How to use it
                - list [ref=e319]:
                  - listitem [ref=e320]: Tap Download HTML File above and save it to your device.
                  - listitem [ref=e321]: Open the saved file by double-tapping it — it opens in any web browser, even offline.
                  - listitem [ref=e322]: Use the quick links at the top to jump to any book, chapter, or the Gospel.
                  - listitem [ref=e323]: To keep it handy, bookmark it or save it to your Home Screen / Desktop.
                - paragraph [ref=e327]: About 6 MB. You can rename it to index.html and upload it to any web host to share it as a website.
            - link [ref=e329] [cursor=pointer]:
              - /url: /legacy
              - generic [ref=e334]:
                - paragraph [ref=e335]: Open Legacy Reader
                - paragraph [ref=e336]: Tested on Internet Explorer 11 / Windows 8.1. Old iOS, macOS, and Android are untested — email kingjamesbiblereader@outlook.sg to report any issues.
        - generic [ref=e341]:
          - button [ref=e342] [cursor=pointer]:
            - generic [ref=e343]:
              - heading "App Info" [level=2] [ref=e344]
              - paragraph [ref=e345]: Version and features
          - generic [ref=e348]:
            - generic [ref=e353]:
              - paragraph [ref=e354]: Automatic Updates
              - paragraph [ref=e355]: This app connects to the internet in the background to automatically apply new features, typo corrections, and security fixes. You never have to refresh manually!
            - generic [ref=e356]:
              - generic [ref=e357]:
                - generic [ref=e358]: Bible Text
                - generic [ref=e359]: King James Bible (PCE)
              - generic [ref=e360]:
                - generic [ref=e361]: Last Updated
                - generic [ref=e362]: September 3rd, 2026
              - generic [ref=e363]:
                - generic [ref=e364]: Offline Support
                - generic [ref=e365]: Unavailable
              - generic [ref=e368]:
                - generic [ref=e369]: PWA Status
                - generic [ref=e370]: Browser
              - generic [ref=e373]:
                - generic [ref=e374]: Theme
                - generic [ref=e375]: 📱 System
            - generic [ref=e376]:
              - generic [ref=e380]: "Admin Access:"
              - button "Sign In" [ref=e381] [cursor=pointer]
            - generic [ref=e382]:
              - button "Reset All Settings" [ref=e383] [cursor=pointer]
              - button "Clear Cache & Reload" [ref=e387] [cursor=pointer]
        - link [ref=e391] [cursor=pointer]:
          - /url: /credits
          - generic [ref=e393]:
            - heading "About & Credits" [level=2] [ref=e394]
            - paragraph [ref=e395]: Attributions, licences and acknowledgements
        - generic [ref=e398]:
          - button [ref=e399] [cursor=pointer]:
            - generic [ref=e400]:
              - heading "Contact & Feedback" [level=2] [ref=e401]
              - paragraph [ref=e402]: Report bugs or share feedback
          - generic [ref=e405]:
            - button [ref=e406] [cursor=pointer]:
              - generic [ref=e410]:
                - paragraph [ref=e411]: Privacy Policy
                - paragraph [ref=e412]: How your data is handled
            - button [ref=e417] [cursor=pointer]:
              - generic [ref=e422]:
                - paragraph [ref=e423]: Terms of Service
                - paragraph [ref=e424]: View our terms
            - generic [ref=e429]:
              - link [ref=e430] [cursor=pointer]:
                - /url: https://godisgracious1031ministriescom.odoo.com/
                - generic [ref=e435]:
                  - paragraph [ref=e436]: God is Gracious 1031 Ministries
                  - paragraph [ref=e437]: Ministry Website
              - link [ref=e442] [cursor=pointer]:
                - /url: https://youtube.com/@shawnr325av?si=zC_gQm4I2S_xj-NS
                - generic [ref=e447]:
                  - paragraph [ref=e448]: YouTube
                  - paragraph [ref=e449]: "@shawnr325av"
              - link [ref=e454] [cursor=pointer]:
                - /url: https://rumble.com/user/Godisgracious1031
                - generic [ref=e459]:
                  - paragraph [ref=e460]: Rumble
                  - paragraph [ref=e461]: Godisgracious1031
              - link [ref=e466] [cursor=pointer]:
                - /url: https://www.tiktok.com/@svdbyfaithinr325av
                - generic [ref=e470]:
                  - paragraph [ref=e471]: TikTok
                  - paragraph [ref=e472]: "@svdbyfaithinr325av"
              - link [ref=e477] [cursor=pointer]:
                - /url: https://www.instagram.com/svdbyfaithinhisbloodr325av/
                - generic [ref=e481]:
                  - paragraph [ref=e482]: Instagram
                  - paragraph [ref=e483]: "@svdbyfaithinhisbloodr325av"
              - link [ref=e488] [cursor=pointer]:
                - /url: https://discord.com/users/faithinhisbloodr325av
                - generic [ref=e492]:
                  - paragraph [ref=e493]: Discord
                  - paragraph [ref=e494]: faithinhisbloodr325av
              - link [ref=e499] [cursor=pointer]:
                - /url: https://linktr.ee/shawnr325av
                - generic [ref=e503]:
                  - paragraph [ref=e504]: Linktree
                  - paragraph [ref=e505]: linktr.ee/shawnr325av
              - link [ref=e510] [cursor=pointer]:
                - /url: mailto:kingjamesbiblereader@outlook.sg
                - generic [ref=e515]:
                  - paragraph [ref=e516]: Email
                  - paragraph [ref=e517]: kingjamesbiblereader@outlook.sg
    - navigation [ref=e522]:
      - generic [ref=e524]:
        - button "Home" [ref=e525] [cursor=pointer]
        - button "Contents" [ref=e530] [cursor=pointer]
        - button "Read" [ref=e533] [cursor=pointer]
        - button "Gospel" [ref=e537] [cursor=pointer]
        - button "Toggle navigation rows" [ref=e541] [cursor=pointer]
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
      |           ^ Error: /settings @ 320px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```