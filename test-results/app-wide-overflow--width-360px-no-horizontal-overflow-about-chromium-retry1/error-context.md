# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 360px] >> no horizontal overflow: /about
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /about @ 360px overflows horizontally by 0px:
  <div class="kjb-slide-forward"> "AboutAbout the MinistryI'm Shawn, a firm believer that the K" (over by 13.5px)
  <div class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm"> "" (over by 16px)

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 14

- Array []
+ Array [
+   Object {
+     "cls": "kjb-slide-forward",
+     "overBy": 13.5,
+     "tag": "div",
+     "text": "AboutAbout the MinistryI'm Shawn, a firm believer that the K",
+   },
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
      - generic [ref=e23]:
        - heading "About" [level=1] [ref=e28]
        - generic [ref=e30]:
          - heading "About the Ministry" [level=2] [ref=e31]
          - paragraph [ref=e32]: I'm Shawn, a firm believer that the King James Bible is the pure, infallible, perfect Word of God in the English language. I am a dispensational salvationist, rightly dividing the word of truth.
          - list [ref=e33]:
            - listitem [ref=e34]:
              - generic [ref=e35]: •
              - generic [ref=e36]: I believe in the blood-stained gospel as the only way to be saved, and I reject "repent of sins to be saved" (ROYS), "confess with your mouth to be saved," Lordship Salvation, infant baptism, baptism regeneration, etc.
            - listitem [ref=e37]:
              - generic [ref=e38]: •
              - generic [ref=e39]: To be saved, you must believe that Jesus is God, that He shed His blood on Calvary, died, was buried, and rose again for your justification.
            - listitem [ref=e40]:
              - generic [ref=e41]: •
              - generic [ref=e42]: "I believe in OSAS (Once Saved, Always Saved): a believer who has trusted the gospel cannot lose salvation, no matter what happens in their life."
        - generic [ref=e43]:
          - heading "Statement of Faith" [level=2] [ref=e44]
          - button [ref=e46] [cursor=pointer]:
            - heading "The King James Bible" [level=3] [ref=e47]
          - button [ref=e51] [cursor=pointer]:
            - heading "Satan & Hell" [level=3] [ref=e52]
          - button [ref=e56] [cursor=pointer]:
            - heading "Salvation & Pre-Tribulation Rapture" [level=3] [ref=e57]
          - button [ref=e61] [cursor=pointer]:
            - heading "Pagan Holidays & Traditions" [level=3] [ref=e62]
          - button [ref=e66] [cursor=pointer]:
            - heading "Why I Am Not... Series" [level=3] [ref=e67]
        - generic [ref=e70]:
          - heading "Links & Contact" [level=2] [ref=e71]
          - generic [ref=e72]:
            - link [ref=e73] [cursor=pointer]:
              - /url: https://godisgracious1031ministriescom.odoo.com/
              - generic [ref=e78]:
                - paragraph [ref=e79]: God is Gracious 1031 Ministries
                - paragraph [ref=e80]: Ministry Website
            - link [ref=e85] [cursor=pointer]:
              - /url: https://youtube.com/@shawnr325av?si=zC_gQm4I2S_xj-NS
              - generic [ref=e90]:
                - paragraph [ref=e91]: YouTube
                - paragraph [ref=e92]: "@shawnr325av"
            - link [ref=e97] [cursor=pointer]:
              - /url: https://rumble.com/user/Godisgracious1031
              - generic [ref=e102]:
                - paragraph [ref=e103]: Rumble
                - paragraph [ref=e104]: Godisgracious1031
            - link [ref=e109] [cursor=pointer]:
              - /url: https://www.tiktok.com/@svdbyfaithinr325av
              - generic [ref=e113]:
                - paragraph [ref=e114]: TikTok
                - paragraph [ref=e115]: "@svdbyfaithinr325av"
            - link [ref=e120] [cursor=pointer]:
              - /url: https://www.instagram.com/svdbyfaithinhisbloodr325av/
              - generic [ref=e124]:
                - paragraph [ref=e125]: Instagram
                - paragraph [ref=e126]: "@svdbyfaithinhisbloodr325av"
            - link [ref=e131] [cursor=pointer]:
              - /url: https://discord.com/users/faithinhisbloodr325av
              - generic [ref=e135]:
                - paragraph [ref=e136]: Discord
                - paragraph [ref=e137]: faithinhisbloodr325av
            - link [ref=e142] [cursor=pointer]:
              - /url: https://linktr.ee/shawnr325av
              - generic [ref=e146]:
                - paragraph [ref=e147]: Linktree
                - paragraph [ref=e148]: linktr.ee/shawnr325av
            - link [ref=e153] [cursor=pointer]:
              - /url: mailto:kingjamesbiblereader@outlook.sg
              - generic [ref=e158]:
                - paragraph [ref=e159]: Email
                - paragraph [ref=e160]: kingjamesbiblereader@outlook.sg
    - navigation [ref=e165]:
      - generic [ref=e167]:
        - button "Home" [ref=e168] [cursor=pointer]
        - button "Contents" [ref=e173] [cursor=pointer]
        - button "Read" [ref=e176] [cursor=pointer]
        - button "Gospel" [ref=e180] [cursor=pointer]
        - button "Toggle navigation rows" [ref=e184] [cursor=pointer]
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
      |           ^ Error: /about @ 360px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```