# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 320px] >> no horizontal overflow: /resources
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /resources @ 320px overflows horizontally by 0px:
  <div class="absolute top-0 h-full rounded-full"> "" (over by 53.5px)

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 8

- Array []
+ Array [
+   Object {
+     "cls": "absolute top-0 h-full rounded-full",
+     "overBy": 53.5,
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
          - heading "Resources" [level=1] [ref=e28]
          - paragraph [ref=e29]: KJB defence materials, studies on modern version corruption, and links to free Bible study resources.
          - generic [ref=e31]:
            - button "Collapse All" [ref=e32] [cursor=pointer]
            - button "Print" [ref=e33] [cursor=pointer]
        - generic [ref=e39]:
          - button "KJBI.org — Free Online Bible College" [ref=e40] [cursor=pointer]
          - generic [ref=e47]:
            - paragraph [ref=e48]: King James Bible Institute by Robert Breaker & Robert Potthoff — a free online Bible college for those who want to go deeper in God's Word.
            - generic [ref=e49]:
              - link "Visit KJBI.org" [ref=e50] [cursor=pointer]:
                - /url: https://kjbi.org
              - button "Copy text" [ref=e55] [cursor=pointer]
        - generic [ref=e60]:
          - button "Discord" [ref=e61] [cursor=pointer]
          - generic [ref=e68]:
            - generic [ref=e69]:
              - heading "KJB Discord Bot" [level=3] [ref=e70]
              - paragraph [ref=e71]: Use the KJB Reader bot in your own Discord account or add it to a server for daily verses and verse search directly in Discord.
              - generic [ref=e72]:
                - link "📱 Personal Install Adds slash commands to your Discord account — works in DMs, group DMs, and any server." [ref=e73] [cursor=pointer]:
                  - /url: https://discord.com/oauth2/authorize?client_id=1529303667348606996&scope=applications.commands&integration_type=1
                  - generic [ref=e74]: 📱 Personal Install
                  - generic [ref=e75]: Adds slash commands to your Discord account — works in DMs, group DMs, and any server.
                - link "🏠 Server Install Bot joins a server for daily verse delivery and searching up verses and keywords." [ref=e76] [cursor=pointer]:
                  - /url: https://discord.com/oauth2/authorize?client_id=1529303667348606996&scope=bot+applications.commands&permissions=378494381072
                  - generic [ref=e77]: 🏠 Server Install
                  - generic [ref=e78]: Bot joins a server for daily verse delivery and searching up verses and keywords.
            - generic [ref=e79]:
              - heading "KJB Knights Server" [level=3] [ref=e80]
              - paragraph [ref=e81]: My and my friends' Discord server — feel free to join.
              - link "Join KJB Knights" [ref=e83] [cursor=pointer]:
                - /url: https://discord.gg/HK9Kqmg7Jh
        - generic [ref=e89]:
          - button "KJB SidePanel" [ref=e90] [cursor=pointer]
          - generic [ref=e98]:
            - paragraph [ref=e99]: Read, search, and look up Bible verses from any web page with the KJB Reader sidebar extension — now available on the Chrome Web Store.
            - link "Get KJB SidePanel" [ref=e101] [cursor=pointer]:
              - /url: /extension
        - generic [ref=e103]:
          - button "Bible Resources (Español)" [ref=e104] [cursor=pointer]
          - generic [ref=e112]:
            - paragraph [ref=e113]: Recursos y estudios de la Biblia en español.
            - link "Open Bible Resources (Español)" [ref=e114] [cursor=pointer]:
              - /url: /espanol
        - generic [ref=e120]:
          - button "KJB Defence" [ref=e121] [cursor=pointer]
          - generic [ref=e128]:
            - paragraph [ref=e129]: A dedicated collection of resources defending the King James Bible and exposing the corruption of modern versions.
            - link "Open KJB Defence" [ref=e130] [cursor=pointer]:
              - /url: /kjb-defence
        - generic [ref=e135]:
          - button [ref=e136] [cursor=pointer]:
            - generic [ref=e137]:
              - heading "Verified KJB Preachers" [level=2] [ref=e144]
              - paragraph [ref=e145]: KJB-believing, soul-winning preachers — tap to see all their links
            - button "Copy text" [ref=e147]
          - generic [ref=e153]:
            - generic [ref=e154]:
              - button [ref=e155] [cursor=pointer]:
                - paragraph [ref=e160]: Robert Breaker
                - button "Copy text" [ref=e162]
              - generic [ref=e168]:
                - paragraph [ref=e169]: KJB missionary evangelist, rightly dividing the word of truth. Also preaches in Spanish.
                - link "YouTube" [ref=e170] [cursor=pointer]:
                  - /url: https://www.youtube.com/@Robertbreaker3
                  - button "Copy text" [ref=e176]
                - link "TikTok" [ref=e184] [cursor=pointer]:
                  - /url: https://www.tiktok.com/@robertbreaker
                  - button "Copy text" [ref=e189]
                - link "thecloudchurch.org" [ref=e197] [cursor=pointer]:
                  - /url: https://thecloudchurch.org/
                  - button "Copy text" [ref=e203]
                - link "laiglesiadelanube.com" [ref=e211] [cursor=pointer]:
                  - /url: https://laiglesiadelanube.com/
                  - button "Copy text" [ref=e217]
            - generic [ref=e225]:
              - button [ref=e226] [cursor=pointer]:
                - paragraph [ref=e231]: Robert Potthoff
                - button "Copy text" [ref=e233]
              - generic [ref=e239]:
                - paragraph [ref=e240]: Big Red Preacher — KJB soul winner.
                - link "Instagram" [ref=e241] [cursor=pointer]:
                  - /url: https://www.instagram.com/robert.potthoff/
                  - button "Copy text" [ref=e247]
                - link "Facebook" [ref=e255] [cursor=pointer]:
                  - /url: https://www.facebook.com/potthoff87
                  - button "Copy text" [ref=e260]
                - link "Instagram" [ref=e268] [cursor=pointer]:
                  - /url: https://www.instagram.com/big_red_preacher
                  - button "Copy text" [ref=e274]
                - link "Mission 1611" [ref=e282] [cursor=pointer]:
                  - /url: https://mission1611.com/
                  - button "Copy text" [ref=e288]
            - generic [ref=e296]:
              - button [ref=e297] [cursor=pointer]:
                - paragraph [ref=e302]: Ryan Poff
                - button "Copy text" [ref=e304]
              - generic [ref=e310]:
                - paragraph [ref=e311]: Seed of Hope Church — KJB pastor and preacher.
                - link "seedofhopechurch.org" [ref=e312] [cursor=pointer]:
                  - /url: https://www.seedofhopechurch.org/
                  - button "Copy text" [ref=e318]
                - link "YouTube" [ref=e326] [cursor=pointer]:
                  - /url: https://youtube.com/@ryan_poff
                  - button "Copy text" [ref=e332]
                - link "TikTok" [ref=e340] [cursor=pointer]:
                  - /url: https://www.tiktok.com/@ryan_sohc
                  - button "Copy text" [ref=e345]
            - generic [ref=e353]:
              - button [ref=e354] [cursor=pointer]:
                - paragraph [ref=e359]: Skyler (AV1611 Ministry)
                - button "Copy text" [ref=e361]
              - generic [ref=e367]:
                - paragraph [ref=e368]: AV1611 Ministry — KJB defence and preaching.
                - link "TikTok" [ref=e369] [cursor=pointer]:
                  - /url: https://www.tiktok.com/@av1611ministries
                  - button "Copy text" [ref=e374]
                - link "YouTube" [ref=e382] [cursor=pointer]:
                  - /url: https://youtube.com/@av1611ministries
                  - button "Copy text" [ref=e388]
            - generic [ref=e396]:
              - button [ref=e397] [cursor=pointer]:
                - paragraph [ref=e402]: Crown of Thorns
                - button "Copy text" [ref=e404]
              - generic [ref=e410]:
                - paragraph [ref=e411]: KJB preaching ministry on YouTube.
                - link "YouTube" [ref=e412] [cursor=pointer]:
                  - /url: https://www.youtube.com/@CrownOfThorns
                  - button "Copy text" [ref=e418]
            - generic [ref=e426]:
              - button [ref=e427] [cursor=pointer]:
                - paragraph [ref=e432]: Paul Johnson
                - button "Copy text" [ref=e434]
              - generic [ref=e440]:
                - paragraph [ref=e441]: Biblical Salvation — KJB preaching and Bible teaching.
                - link "TikTok" [ref=e442] [cursor=pointer]:
                  - /url: https://www.tiktok.com/@pauljohnson9632
                  - button "Copy text" [ref=e447]
                - link "YouTube" [ref=e455] [cursor=pointer]:
                  - /url: https://youtube.com/@biblicalsalvation
                  - button "Copy text" [ref=e461]
            - generic [ref=e469]:
              - button [ref=e470] [cursor=pointer]:
                - paragraph [ref=e475]: CPR Missions
                - button "Copy text" [ref=e477]
              - generic [ref=e483]:
                - paragraph [ref=e484]: Church Planting and Revival Missions — soul winning and church planting.
                - link "YouTube" [ref=e485] [cursor=pointer]:
                  - /url: https://www.youtube.com/channel/UCWBR5DmAi2XPMFRtb-wqHwg
                  - button "Copy text" [ref=e491]
                - link "TikTok" [ref=e499] [cursor=pointer]:
                  - /url: https://www.tiktok.com/@cprmissions
                  - button "Copy text" [ref=e504]
                - link "Facebook" [ref=e512] [cursor=pointer]:
                  - /url: https://www.facebook.com/CPRmission/
                  - button "Copy text" [ref=e517]
                - link "Instagram" [ref=e525] [cursor=pointer]:
                  - /url: https://www.instagram.com/cprmissions/
                  - button "Copy text" [ref=e531]
            - generic [ref=e539]:
              - button [ref=e540] [cursor=pointer]:
                - paragraph [ref=e545]: James Bray
                - button "Copy text" [ref=e547]
              - generic [ref=e553]:
                - paragraph [ref=e554]: KJB preacher and Bible teacher on YouTube.
                - link "YouTube" [ref=e555] [cursor=pointer]:
                  - /url: https://youtube.com/@jamesbrayall3?si=nXkuHAhyVvC_0KVg
                  - button "Copy text" [ref=e561]
        - generic [ref=e569]:
          - button [ref=e570] [cursor=pointer]:
            - generic [ref=e571]:
              - heading "Personal Ministry Links" [level=2] [ref=e576]
              - paragraph [ref=e577]: Personal Ministry Links
            - button "Copy text" [ref=e579]
          - generic [ref=e585]:
            - link [ref=e586] [cursor=pointer]:
              - /url: https://godisgracious1031ministriescom.odoo.com/
              - generic [ref=e591]:
                - paragraph [ref=e592]: God is Gracious 1031 Ministries
                - paragraph [ref=e593]: Ministry Website
              - button "Copy text" [ref=e595]
            - link [ref=e603] [cursor=pointer]:
              - /url: https://youtube.com/@shawnr325av
              - generic [ref=e608]:
                - paragraph [ref=e609]: YouTube
                - paragraph [ref=e610]: "@shawnr325av"
              - button "Copy text" [ref=e612]
            - link [ref=e620] [cursor=pointer]:
              - /url: https://rumble.com/user/Godisgracious1031
              - generic [ref=e625]:
                - paragraph [ref=e626]: Rumble
                - paragraph [ref=e627]: Godisgracious1031
              - button "Copy text" [ref=e629]
            - link [ref=e637] [cursor=pointer]:
              - /url: https://linktr.ee/shawnr325av
              - generic [ref=e642]:
                - paragraph [ref=e643]: Linktree
                - paragraph [ref=e644]: linktr.ee/shawnr325av
              - button "Copy text" [ref=e646]
            - link [ref=e654] [cursor=pointer]:
              - /url: mailto:kingjamesbiblereader@outlook.sg
              - generic [ref=e659]:
                - paragraph [ref=e660]: Contact the Ministry
                - paragraph [ref=e661]: kingjamesbiblereader@outlook.sg
              - button "Copy text" [ref=e662]
    - navigation [ref=e666]:
      - generic [ref=e668]:
        - button "Home" [ref=e669] [cursor=pointer]
        - button "Contents" [ref=e674] [cursor=pointer]
        - button "Read" [ref=e677] [cursor=pointer]
        - button "Gospel" [ref=e681] [cursor=pointer]
        - button "Toggle navigation rows" [ref=e685] [cursor=pointer]
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
      |           ^ Error: /resources @ 320px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```