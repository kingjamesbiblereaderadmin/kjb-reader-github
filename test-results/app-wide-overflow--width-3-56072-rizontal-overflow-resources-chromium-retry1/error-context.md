# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 360px] >> no horizontal overflow: /resources
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /resources @ 360px overflows horizontally by 0px:
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
    - img "KJB Reader Logo" [ref=e5]
    - generic [ref=e6]: WELCOME BACK TO KJB READER.
  - generic [ref=e10]:
    - banner [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]:
          - button "Back" [ref=e14] [cursor=pointer]
          - link "Home" [ref=e15] [cursor=pointer]:
            - /url: /
        - textbox "Search..." [ref=e21]
        - generic [ref=e22]:
          - button "Toggle fullscreen" [ref=e23] [cursor=pointer]
          - button "Toggle theme" [ref=e24] [cursor=pointer]
          - button "Open menu" [ref=e25] [cursor=pointer]
    - main [ref=e26]:
      - generic [ref=e29]:
        - generic [ref=e30]:
          - heading "Resources" [level=1] [ref=e35]
          - paragraph [ref=e36]: KJB defence materials, studies on modern version corruption, and links to free Bible study resources.
          - generic [ref=e38]:
            - button "Collapse All" [ref=e39] [cursor=pointer]
            - button "Print" [ref=e40] [cursor=pointer]
        - generic [ref=e46]:
          - button "KJBI.org — Free Online Bible College" [ref=e47] [cursor=pointer]
          - generic [ref=e54]:
            - paragraph [ref=e55]: King James Bible Institute by Robert Breaker & Robert Potthoff — a free online Bible college for those who want to go deeper in God's Word.
            - generic [ref=e56]:
              - link "Visit KJBI.org" [ref=e57] [cursor=pointer]:
                - /url: https://kjbi.org
              - button "Copy text" [ref=e62] [cursor=pointer]
        - generic [ref=e67]:
          - button "Discord" [ref=e68] [cursor=pointer]
          - generic [ref=e75]:
            - generic [ref=e76]:
              - heading "KJB Discord Bot" [level=3] [ref=e77]
              - paragraph [ref=e78]: Use the KJB Reader bot in your own Discord account or add it to a server for daily verses and verse search directly in Discord.
              - generic [ref=e79]:
                - link "📱 Personal Install Adds slash commands to your Discord account — works in DMs, group DMs, and any server." [ref=e80] [cursor=pointer]:
                  - /url: https://discord.com/oauth2/authorize?client_id=1529303667348606996&scope=applications.commands&integration_type=1
                  - generic [ref=e81]: 📱 Personal Install
                  - generic [ref=e82]: Adds slash commands to your Discord account — works in DMs, group DMs, and any server.
                - link "🏠 Server Install Bot joins a server for daily verse delivery and searching up verses and keywords." [ref=e83] [cursor=pointer]:
                  - /url: https://discord.com/oauth2/authorize?client_id=1529303667348606996&scope=bot+applications.commands&permissions=378494381072
                  - generic [ref=e84]: 🏠 Server Install
                  - generic [ref=e85]: Bot joins a server for daily verse delivery and searching up verses and keywords.
            - generic [ref=e86]:
              - heading "KJB Knights Server" [level=3] [ref=e87]
              - paragraph [ref=e88]: My and my friends' Discord server — feel free to join.
              - link "Join KJB Knights" [ref=e90] [cursor=pointer]:
                - /url: https://discord.gg/HK9Kqmg7Jh
        - generic [ref=e96]:
          - button "KJB SidePanel" [ref=e97] [cursor=pointer]
          - generic [ref=e105]:
            - paragraph [ref=e106]: Read, search, and look up Bible verses from any web page with the KJB Reader sidebar extension — now available on the Chrome Web Store.
            - link "Get KJB SidePanel" [ref=e108] [cursor=pointer]:
              - /url: /extension
        - generic [ref=e110]:
          - button "Bible Resources (Español)" [ref=e111] [cursor=pointer]
          - generic [ref=e119]:
            - paragraph [ref=e120]: Recursos y estudios de la Biblia en español.
            - link "Open Bible Resources (Español)" [ref=e121] [cursor=pointer]:
              - /url: /espanol
        - generic [ref=e127]:
          - button "KJB Defence" [ref=e128] [cursor=pointer]
          - generic [ref=e135]:
            - paragraph [ref=e136]: A dedicated collection of resources defending the King James Bible and exposing the corruption of modern versions.
            - link "Open KJB Defence" [ref=e137] [cursor=pointer]:
              - /url: /kjb-defence
        - generic [ref=e142]:
          - button [ref=e143] [cursor=pointer]:
            - generic [ref=e144]:
              - heading "Verified KJB Preachers" [level=2] [ref=e151]
              - paragraph [ref=e152]: KJB-believing, soul-winning preachers — tap to see all their links
            - button "Copy text" [ref=e154]
          - generic [ref=e160]:
            - generic [ref=e161]:
              - button [ref=e162] [cursor=pointer]:
                - paragraph [ref=e167]: Robert Breaker
                - button "Copy text" [ref=e169]
              - generic [ref=e175]:
                - paragraph [ref=e176]: KJB missionary evangelist, rightly dividing the word of truth. Also preaches in Spanish.
                - link "YouTube" [ref=e177] [cursor=pointer]:
                  - /url: https://www.youtube.com/@Robertbreaker3
                  - button "Copy text" [ref=e183]
                - link "TikTok" [ref=e191] [cursor=pointer]:
                  - /url: https://www.tiktok.com/@robertbreaker
                  - button "Copy text" [ref=e196]
                - link "thecloudchurch.org" [ref=e204] [cursor=pointer]:
                  - /url: https://thecloudchurch.org/
                  - button "Copy text" [ref=e210]
                - link "laiglesiadelanube.com" [ref=e218] [cursor=pointer]:
                  - /url: https://laiglesiadelanube.com/
                  - button "Copy text" [ref=e224]
            - generic [ref=e232]:
              - button [ref=e233] [cursor=pointer]:
                - paragraph [ref=e238]: Robert Potthoff
                - button "Copy text" [ref=e240]
              - generic [ref=e246]:
                - paragraph [ref=e247]: Big Red Preacher — KJB soul winner.
                - link "Instagram" [ref=e248] [cursor=pointer]:
                  - /url: https://www.instagram.com/robert.potthoff/
                  - button "Copy text" [ref=e254]
                - link "Facebook" [ref=e262] [cursor=pointer]:
                  - /url: https://www.facebook.com/potthoff87
                  - button "Copy text" [ref=e267]
                - link "Instagram" [ref=e275] [cursor=pointer]:
                  - /url: https://www.instagram.com/big_red_preacher
                  - button "Copy text" [ref=e281]
                - link "Mission 1611" [ref=e289] [cursor=pointer]:
                  - /url: https://mission1611.com/
                  - button "Copy text" [ref=e295]
            - generic [ref=e303]:
              - button [ref=e304] [cursor=pointer]:
                - paragraph [ref=e309]: Ryan Poff
                - button "Copy text" [ref=e311]
              - generic [ref=e317]:
                - paragraph [ref=e318]: Seed of Hope Church — KJB pastor and preacher.
                - link "seedofhopechurch.org" [ref=e319] [cursor=pointer]:
                  - /url: https://www.seedofhopechurch.org/
                  - button "Copy text" [ref=e325]
                - link "YouTube" [ref=e333] [cursor=pointer]:
                  - /url: https://youtube.com/@ryan_poff
                  - button "Copy text" [ref=e339]
                - link "TikTok" [ref=e347] [cursor=pointer]:
                  - /url: https://www.tiktok.com/@ryan_sohc
                  - button "Copy text" [ref=e352]
            - generic [ref=e360]:
              - button [ref=e361] [cursor=pointer]:
                - paragraph [ref=e366]: Skyler (AV1611 Ministry)
                - button "Copy text" [ref=e368]
              - generic [ref=e374]:
                - paragraph [ref=e375]: AV1611 Ministry — KJB defence and preaching.
                - link "TikTok" [ref=e376] [cursor=pointer]:
                  - /url: https://www.tiktok.com/@av1611ministries
                  - button "Copy text" [ref=e381]
                - link "YouTube" [ref=e389] [cursor=pointer]:
                  - /url: https://youtube.com/@av1611ministries
                  - button "Copy text" [ref=e395]
            - generic [ref=e403]:
              - button [ref=e404] [cursor=pointer]:
                - paragraph [ref=e409]: Crown of Thorns
                - button "Copy text" [ref=e411]
              - generic [ref=e417]:
                - paragraph [ref=e418]: KJB preaching ministry on YouTube.
                - link "YouTube" [ref=e419] [cursor=pointer]:
                  - /url: https://www.youtube.com/@CrownOfThorns
                  - button "Copy text" [ref=e425]
            - generic [ref=e433]:
              - button [ref=e434] [cursor=pointer]:
                - paragraph [ref=e439]: Paul Johnson
                - button "Copy text" [ref=e441]
              - generic [ref=e447]:
                - paragraph [ref=e448]: Biblical Salvation — KJB preaching and Bible teaching.
                - link "TikTok" [ref=e449] [cursor=pointer]:
                  - /url: https://www.tiktok.com/@pauljohnson9632
                  - button "Copy text" [ref=e454]
                - link "YouTube" [ref=e462] [cursor=pointer]:
                  - /url: https://youtube.com/@biblicalsalvation
                  - button "Copy text" [ref=e468]
            - generic [ref=e476]:
              - button [ref=e477] [cursor=pointer]:
                - paragraph [ref=e482]: CPR Missions
                - button "Copy text" [ref=e484]
              - generic [ref=e490]:
                - paragraph [ref=e491]: Church Planting and Revival Missions — soul winning and church planting.
                - link "YouTube" [ref=e492] [cursor=pointer]:
                  - /url: https://www.youtube.com/channel/UCWBR5DmAi2XPMFRtb-wqHwg
                  - button "Copy text" [ref=e498]
                - link "TikTok" [ref=e506] [cursor=pointer]:
                  - /url: https://www.tiktok.com/@cprmissions
                  - button "Copy text" [ref=e511]
                - link "Facebook" [ref=e519] [cursor=pointer]:
                  - /url: https://www.facebook.com/CPRmission/
                  - button "Copy text" [ref=e524]
                - link "Instagram" [ref=e532] [cursor=pointer]:
                  - /url: https://www.instagram.com/cprmissions/
                  - button "Copy text" [ref=e538]
            - generic [ref=e546]:
              - button [ref=e547] [cursor=pointer]:
                - paragraph [ref=e552]: James Bray
                - button "Copy text" [ref=e554]
              - generic [ref=e560]:
                - paragraph [ref=e561]: KJB preacher and Bible teacher on YouTube.
                - link "YouTube" [ref=e562] [cursor=pointer]:
                  - /url: https://youtube.com/@jamesbrayall3?si=nXkuHAhyVvC_0KVg
                  - button "Copy text" [ref=e568]
        - generic [ref=e576]:
          - button [ref=e577] [cursor=pointer]:
            - generic [ref=e578]:
              - heading "Personal Ministry Links" [level=2] [ref=e583]
              - paragraph [ref=e584]: Personal Ministry Links
            - button "Copy text" [ref=e586]
          - generic [ref=e592]:
            - link [ref=e593] [cursor=pointer]:
              - /url: https://godisgracious1031ministriescom.odoo.com/
              - generic [ref=e598]:
                - paragraph [ref=e599]: God is Gracious 1031 Ministries
                - paragraph [ref=e600]: Ministry Website
              - button "Copy text" [ref=e602]
            - link [ref=e610] [cursor=pointer]:
              - /url: https://youtube.com/@shawnr325av
              - generic [ref=e615]:
                - paragraph [ref=e616]: YouTube
                - paragraph [ref=e617]: "@shawnr325av"
              - button "Copy text" [ref=e619]
            - link [ref=e627] [cursor=pointer]:
              - /url: https://rumble.com/user/Godisgracious1031
              - generic [ref=e632]:
                - paragraph [ref=e633]: Rumble
                - paragraph [ref=e634]: Godisgracious1031
              - button "Copy text" [ref=e636]
            - link [ref=e644] [cursor=pointer]:
              - /url: https://linktr.ee/shawnr325av
              - generic [ref=e649]:
                - paragraph [ref=e650]: Linktree
                - paragraph [ref=e651]: linktr.ee/shawnr325av
              - button "Copy text" [ref=e653]
            - link [ref=e661] [cursor=pointer]:
              - /url: mailto:kingjamesbiblereader@outlook.sg
              - generic [ref=e666]:
                - paragraph [ref=e667]: Contact the Ministry
                - paragraph [ref=e668]: kingjamesbiblereader@outlook.sg
              - button "Copy text" [ref=e669]
    - navigation [ref=e673]:
      - generic [ref=e675]:
        - button "Home" [ref=e676] [cursor=pointer]
        - button "Contents" [ref=e681] [cursor=pointer]
        - button "Read" [ref=e684] [cursor=pointer]
        - button "Gospel" [ref=e688] [cursor=pointer]
        - button "Toggle navigation rows" [ref=e692] [cursor=pointer]
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
      |           ^ Error: /resources @ 360px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```