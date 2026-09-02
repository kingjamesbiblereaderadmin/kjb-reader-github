# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 360px] >> no horizontal overflow: /gospel
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /gospel @ 360px overflows horizontally by 0px:
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
      - generic [ref=e23]:
        - generic [ref=e24]:
          - heading "How to be Saved" [level=1] [ref=e28]
          - paragraph [ref=e29]: "The Gospel is the glad tidings of the Lord Jesus Christ:"
          - paragraph [ref=e30]: Trust he is God, died, shed his blood, buried and rose again on the third day for our sins according to the scriptures.
          - generic [ref=e33]:
            - button "Copy the Gospel" [ref=e34] [cursor=pointer]
            - generic [ref=e38]:
              - button "Share" [ref=e39] [cursor=pointer]
              - button [ref=e46] [cursor=pointer]
        - link [ref=e49] [cursor=pointer]:
          - /url: /espanol-evangelio
          - generic [ref=e54]:
            - paragraph [ref=e55]: Are you saved? (Español)
            - paragraph [ref=e56]: El Evangelio de Salvación
        - generic [ref=e59]:
          - generic [ref=e60]:
            - generic [ref=e61]:
              - heading "1. Believe you are a sinner that deserves hell" [level=3] [ref=e65]
              - button "Copy text" [ref=e66] [cursor=pointer]
            - generic [ref=e70]:
              - blockquote [ref=e71]: "\"Therefore by the deeds of the law there shall no flesh be justified in his sight: for by the law is the knowledge of sin.\" — Romans 3:20"
              - blockquote [ref=e72]: "\"The wicked shall be turned into hell, and all the nations that forget God.\" — Psalm 9:17"
              - generic [ref=e73]:
                - button "Romans 3:20" [ref=e74] [cursor=pointer]
                - button "Psalm 9:17" [ref=e75] [cursor=pointer]
          - generic [ref=e76]:
            - generic [ref=e77]:
              - heading "2. Believe that Jesus is God manifested in the flesh" [level=3] [ref=e82]
              - button "Copy text" [ref=e83] [cursor=pointer]
            - generic [ref=e87]:
              - blockquote [ref=e88]: "\"And without controversy great is the mystery of godliness: God was manifest in the flesh, justified in the Spirit, seen of angels, preached unto the Gentiles, believed on in the world, received up into glory.\" — 1 Timothy 3:16"
              - button "1 Timothy 3:16" [ref=e90] [cursor=pointer]
          - generic [ref=e91]:
            - generic [ref=e92]:
              - heading "3. Believe he died, shed his blood, was buried and rose again for our sins according to the scriptures" [level=3] [ref=e97]
              - button "Copy text" [ref=e98] [cursor=pointer]
            - generic [ref=e102]:
              - blockquote [ref=e103]: "\"Moreover, brethren, I declare unto you the gospel which I preached unto you, which also ye have received, and wherein ye stand; By which also ye are saved, if ye keep in memory what I preached unto you, unless ye have believed in vain. For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures.\" — 1 Corinthians 15:1–4"
              - blockquote [ref=e104]: "\"Whom God hath set forth to be a propitiation through faith in his blood, to declare his righteousness for the remission of sins that are past, through the forbearance of God;\" — Romans 3:25"
              - generic [ref=e105]:
                - button "1 Corinthians 15:1–4" [ref=e106] [cursor=pointer]
                - button "Romans 3:25" [ref=e107] [cursor=pointer]
          - generic [ref=e108]:
            - button [ref=e109] [cursor=pointer]:
              - generic [ref=e116]:
                - heading "These do NOT make you a Christian:" [level=3] [ref=e117]
                - button "Copy text" [ref=e119]
            - list [ref=e126]:
              - listitem [ref=e127]: Repenting of sins
              - listitem [ref=e132]: Making Jesus Lord
              - listitem [ref=e137]: Being a member of a church
              - listitem [ref=e142]: Tithing
              - listitem [ref=e147]: Being baptised (water)
              - listitem [ref=e152]: Saying a sinner's prayer
              - listitem [ref=e157]: Confessing with your mouth
              - listitem [ref=e162]: Lordship Salvation
        - generic [ref=e167]:
          - button [ref=e168] [cursor=pointer]:
            - heading "Once Saved, Always Saved" [level=3] [ref=e169]
            - button "Copy text" [ref=e171]
          - generic [ref=e177]:
            - paragraph [ref=e178]: A believer who has trusted the gospel cannot lose salvation, no matter what happens in their life. God's gift of eternal life is just that — eternal.
            - blockquote [ref=e179]:
              - text: "\"In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise.\" —"
              - button "Ephesians 1:13" [ref=e180] [cursor=pointer]
        - generic [ref=e181]:
          - button [ref=e182] [cursor=pointer]:
            - heading "Watch the Gospel" [level=2] [ref=e183]
          - iframe [ref=e187]:
            - generic [ref=f1e1]:
              - generic "YouTube Video Player" [ref=f1e3]
              - generic [ref=f1e5]:
                - generic:
                  - generic:
                    - generic [ref=f1e6] [cursor=pointer]
                    - button "Play video" [ref=f1e10] [cursor=pointer]
                    - button "Hide player controls" [ref=f1e12] [cursor=pointer]
                    - generic [ref=f1e19]:
                      - generic [ref=f1e20]:
                        - 'link "THE GOSPEL THAT SAVES #gospel #howtobesaved #howtogetsaved #gospelofsalvation #faithintheblood #god" [ref=f1e21] [cursor=pointer]':
                          - /url: https://www.youtube.com/watch?v=znP9Dr6tOzU
                        - link "Robert Breaker" [ref=f1e22] [cursor=pointer]:
                          - /url: /channel/UCPkTFG8FeBL6iR8YemTaMYQ
                      - generic [ref=f1e24]:
                        - button [ref=f1e25] [cursor=pointer]
                        - generic [ref=f1e27]:
                          - generic: Robert Breaker
                          - generic: 804K subscribers
          - generic [ref=e188]:
            - generic [ref=e189]:
              - paragraph [ref=e190]: THE GOSPEL THAT SAVES
              - paragraph [ref=e191]: Robert Breaker
            - generic [ref=e192]:
              - button "Copy text" [ref=e193] [cursor=pointer]
              - link "Watch on YouTube ↗" [ref=e197] [cursor=pointer]:
                - /url: https://www.youtube.com/watch?v=znP9Dr6tOzU
        - generic [ref=e198]:
          - button [ref=e199] [cursor=pointer]:
            - heading "Playlist on Gospel Videos" [level=3] [ref=e200]
          - generic [ref=e204]:
            - link "Watch Full Playlist on YouTube" [ref=e205] [cursor=pointer]:
              - /url: https://www.youtube.com/playlist?list=PLNGhZnJavRf3f2_NI79j5GigC6xK5_YYq
            - button "Copy text" [ref=e208] [cursor=pointer]
        - generic [ref=e212]:
          - button [ref=e213] [cursor=pointer]:
            - heading "KJBI.org — Free Online Bible College" [level=3] [ref=e219]
          - generic [ref=e222]:
            - paragraph [ref=e223]: King James Bible Institute by Robert Breaker & Robert Potthoff — a free online Bible college for those who want to go deeper in God's Word.
            - link "Visit KJBI.org" [ref=e224] [cursor=pointer]:
              - /url: https://kjbi.org
        - generic [ref=e229]:
          - button [ref=e230] [cursor=pointer]:
            - generic [ref=e231]:
              - heading "Verified KJB Preachers" [level=2] [ref=e238]
              - paragraph [ref=e239]: KJB-believing, soul-winning preachers — tap to see all their links
            - button "Copy text" [ref=e241]
          - generic [ref=e247]:
            - generic [ref=e248]:
              - button [ref=e249] [cursor=pointer]:
                - paragraph [ref=e254]: Robert Breaker
                - button "Copy text" [ref=e256]
              - generic [ref=e262]:
                - paragraph [ref=e263]: KJB missionary evangelist, rightly dividing the word of truth. Also preaches in Spanish.
                - link "YouTube" [ref=e264] [cursor=pointer]:
                  - /url: https://www.youtube.com/@Robertbreaker3
                  - button "Copy text" [ref=e270]
                - link "TikTok" [ref=e278] [cursor=pointer]:
                  - /url: https://www.tiktok.com/@robertbreaker
                  - button "Copy text" [ref=e283]
                - link "thecloudchurch.org" [ref=e291] [cursor=pointer]:
                  - /url: https://thecloudchurch.org/
                  - button "Copy text" [ref=e297]
                - link "laiglesiadelanube.com" [ref=e305] [cursor=pointer]:
                  - /url: https://laiglesiadelanube.com/
                  - button "Copy text" [ref=e311]
            - generic [ref=e319]:
              - button [ref=e320] [cursor=pointer]:
                - paragraph [ref=e325]: Robert Potthoff
                - button "Copy text" [ref=e327]
              - generic [ref=e333]:
                - paragraph [ref=e334]: Big Red Preacher — KJB soul winner.
                - link "Instagram" [ref=e335] [cursor=pointer]:
                  - /url: https://www.instagram.com/robert.potthoff/
                  - button "Copy text" [ref=e341]
                - link "Facebook" [ref=e349] [cursor=pointer]:
                  - /url: https://www.facebook.com/potthoff87
                  - button "Copy text" [ref=e354]
                - link "Instagram" [ref=e362] [cursor=pointer]:
                  - /url: https://www.instagram.com/big_red_preacher
                  - button "Copy text" [ref=e368]
                - link "Mission 1611" [ref=e376] [cursor=pointer]:
                  - /url: https://mission1611.com/
                  - button "Copy text" [ref=e382]
            - generic [ref=e390]:
              - button [ref=e391] [cursor=pointer]:
                - paragraph [ref=e396]: Ryan Poff
                - button "Copy text" [ref=e398]
              - generic [ref=e404]:
                - paragraph [ref=e405]: Seed of Hope Church — KJB pastor and preacher.
                - link "seedofhopechurch.org" [ref=e406] [cursor=pointer]:
                  - /url: https://www.seedofhopechurch.org/
                  - button "Copy text" [ref=e412]
                - link "YouTube" [ref=e420] [cursor=pointer]:
                  - /url: https://youtube.com/@ryan_poff
                  - button "Copy text" [ref=e426]
                - link "TikTok" [ref=e434] [cursor=pointer]:
                  - /url: https://www.tiktok.com/@ryan_sohc
                  - button "Copy text" [ref=e439]
            - generic [ref=e447]:
              - button [ref=e448] [cursor=pointer]:
                - paragraph [ref=e453]: Skyler (AV1611 Ministry)
                - button "Copy text" [ref=e455]
              - generic [ref=e461]:
                - paragraph [ref=e462]: AV1611 Ministry — KJB defence and preaching.
                - link "TikTok" [ref=e463] [cursor=pointer]:
                  - /url: https://www.tiktok.com/@av1611ministries
                  - button "Copy text" [ref=e468]
                - link "YouTube" [ref=e476] [cursor=pointer]:
                  - /url: https://youtube.com/@av1611ministries
                  - button "Copy text" [ref=e482]
            - generic [ref=e490]:
              - button [ref=e491] [cursor=pointer]:
                - paragraph [ref=e496]: Crown of Thorns
                - button "Copy text" [ref=e498]
              - generic [ref=e504]:
                - paragraph [ref=e505]: KJB preaching ministry on YouTube.
                - link "YouTube" [ref=e506] [cursor=pointer]:
                  - /url: https://www.youtube.com/@CrownOfThorns
                  - button "Copy text" [ref=e512]
            - generic [ref=e520]:
              - button [ref=e521] [cursor=pointer]:
                - paragraph [ref=e526]: Paul Johnson
                - button "Copy text" [ref=e528]
              - generic [ref=e534]:
                - paragraph [ref=e535]: Biblical Salvation — KJB preaching and Bible teaching.
                - link "TikTok" [ref=e536] [cursor=pointer]:
                  - /url: https://www.tiktok.com/@pauljohnson9632
                  - button "Copy text" [ref=e541]
                - link "YouTube" [ref=e549] [cursor=pointer]:
                  - /url: https://youtube.com/@biblicalsalvation
                  - button "Copy text" [ref=e555]
            - generic [ref=e563]:
              - button [ref=e564] [cursor=pointer]:
                - paragraph [ref=e569]: CPR Missions
                - button "Copy text" [ref=e571]
              - generic [ref=e577]:
                - paragraph [ref=e578]: Church Planting and Revival Missions — soul winning and church planting.
                - link "YouTube" [ref=e579] [cursor=pointer]:
                  - /url: https://www.youtube.com/channel/UCWBR5DmAi2XPMFRtb-wqHwg
                  - button "Copy text" [ref=e585]
                - link "TikTok" [ref=e593] [cursor=pointer]:
                  - /url: https://www.tiktok.com/@cprmissions
                  - button "Copy text" [ref=e598]
                - link "Facebook" [ref=e606] [cursor=pointer]:
                  - /url: https://www.facebook.com/CPRmission/
                  - button "Copy text" [ref=e611]
                - link "Instagram" [ref=e619] [cursor=pointer]:
                  - /url: https://www.instagram.com/cprmissions/
                  - button "Copy text" [ref=e625]
            - generic [ref=e633]:
              - button [ref=e634] [cursor=pointer]:
                - paragraph [ref=e639]: James Bray
                - button "Copy text" [ref=e641]
              - generic [ref=e647]:
                - paragraph [ref=e648]: KJB preacher and Bible teacher on YouTube.
                - link "YouTube" [ref=e649] [cursor=pointer]:
                  - /url: https://youtube.com/@jamesbrayall3?si=nXkuHAhyVvC_0KVg
                  - button "Copy text" [ref=e655]
    - navigation [ref=e663]:
      - generic [ref=e665]:
        - button "Home" [ref=e666] [cursor=pointer]
        - button "Contents" [ref=e671] [cursor=pointer]
        - button "Read" [ref=e674] [cursor=pointer]
        - button "Gospel" [ref=e678] [cursor=pointer]
        - button "Toggle navigation rows" [ref=e683] [cursor=pointer]
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
      |           ^ Error: /gospel @ 360px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```