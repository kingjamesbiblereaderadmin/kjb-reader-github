# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 320px] >> no horizontal overflow: /salvation
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /salvation @ 320px overflows horizontally by 0px:
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
    - link "Back to Landing" [ref=e6] [cursor=pointer]:
      - /url: /landing
    - generic [ref=e9]:
      - heading "How to be Saved" [level=1] [ref=e13]
      - paragraph [ref=e14]: "The Gospel is the glad tidings of the Lord Jesus Christ:"
      - paragraph [ref=e15]: Trust he is God, died, shed his blood, buried and rose again on the third day for our sins according to the scriptures.
      - generic [ref=e18]:
        - button "Copy the Gospel" [ref=e19] [cursor=pointer]
        - generic [ref=e23]:
          - button "Share" [ref=e24] [cursor=pointer]
          - button [ref=e31] [cursor=pointer]
    - link [ref=e34] [cursor=pointer]:
      - /url: /espanol-evangelio
      - generic [ref=e39]:
        - paragraph [ref=e40]: Are you saved? (Español)
        - paragraph [ref=e41]: El Evangelio de Salvación
    - generic [ref=e44]:
      - generic [ref=e45]:
        - generic [ref=e46]:
          - heading "1. Believe you are a sinner that deserves hell" [level=3] [ref=e50]
          - button "Copy text" [ref=e51] [cursor=pointer]
        - generic [ref=e55]:
          - blockquote [ref=e56]: "\"Therefore by the deeds of the law there shall no flesh be justified in his sight: for by the law is the knowledge of sin.\" — Romans 3:20"
          - blockquote [ref=e57]: "\"The wicked shall be turned into hell, and all the nations that forget God.\" — Psalm 9:17"
          - generic [ref=e58]:
            - button "Romans 3:20" [ref=e59] [cursor=pointer]
            - button "Psalm 9:17" [ref=e60] [cursor=pointer]
      - generic [ref=e61]:
        - generic [ref=e62]:
          - heading "2. Believe that Jesus is God manifested in the flesh" [level=3] [ref=e67]
          - button "Copy text" [ref=e68] [cursor=pointer]
        - generic [ref=e72]:
          - blockquote [ref=e73]: "\"And without controversy great is the mystery of godliness: God was manifest in the flesh, justified in the Spirit, seen of angels, preached unto the Gentiles, believed on in the world, received up into glory.\" — 1 Timothy 3:16"
          - button "1 Timothy 3:16" [ref=e75] [cursor=pointer]
      - generic [ref=e76]:
        - generic [ref=e77]:
          - heading "3. Believe he died, shed his blood, was buried and rose again for our sins according to the scriptures" [level=3] [ref=e82]
          - button "Copy text" [ref=e83] [cursor=pointer]
        - generic [ref=e87]:
          - blockquote [ref=e88]: "\"Moreover, brethren, I declare unto you the gospel which I preached unto you, which also ye have received, and wherein ye stand; By which also ye are saved, if ye keep in memory what I preached unto you, unless ye have believed in vain. For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures.\" — 1 Corinthians 15:1–4"
          - blockquote [ref=e89]: "\"Whom God hath set forth to be a propitiation through faith in his blood, to declare his righteousness for the remission of sins that are past, through the forbearance of God;\" — Romans 3:25"
          - generic [ref=e90]:
            - button "1 Corinthians 15:1–4" [ref=e91] [cursor=pointer]
            - button "Romans 3:25" [ref=e92] [cursor=pointer]
      - generic [ref=e93]:
        - button [ref=e94] [cursor=pointer]:
          - generic [ref=e101]:
            - heading "These do NOT make you a Christian:" [level=3] [ref=e102]
            - button "Copy text" [ref=e104]
        - list [ref=e111]:
          - listitem [ref=e112]: Repenting of sins
          - listitem [ref=e117]: Making Jesus Lord
          - listitem [ref=e122]: Being a member of a church
          - listitem [ref=e127]: Tithing
          - listitem [ref=e132]: Being baptised (water)
          - listitem [ref=e137]: Saying a sinner's prayer
          - listitem [ref=e142]: Confessing with your mouth
          - listitem [ref=e147]: Lordship Salvation
    - generic [ref=e152]:
      - button [ref=e153] [cursor=pointer]:
        - heading "Once Saved, Always Saved" [level=3] [ref=e154]
        - button "Copy text" [ref=e156]
      - generic [ref=e162]:
        - paragraph [ref=e163]: A believer who has trusted the gospel cannot lose salvation, no matter what happens in their life. God's gift of eternal life is just that — eternal.
        - blockquote [ref=e164]:
          - text: "\"In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise.\" —"
          - button "Ephesians 1:13" [ref=e165] [cursor=pointer]
    - generic [ref=e166]:
      - button [ref=e167] [cursor=pointer]:
        - heading "Watch the Gospel" [level=2] [ref=e168]
      - iframe [ref=e172]:
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
      - generic [ref=e173]:
        - generic [ref=e174]:
          - paragraph [ref=e175]: THE GOSPEL THAT SAVES
          - paragraph [ref=e176]: Robert Breaker
        - generic [ref=e177]:
          - button "Copy text" [ref=e178] [cursor=pointer]
          - link "Watch on YouTube ↗" [ref=e182] [cursor=pointer]:
            - /url: https://www.youtube.com/watch?v=znP9Dr6tOzU
    - generic [ref=e183]:
      - button [ref=e184] [cursor=pointer]:
        - heading "Playlist on Gospel Videos" [level=3] [ref=e185]
      - generic [ref=e189]:
        - link "Watch Full Playlist on YouTube" [ref=e190] [cursor=pointer]:
          - /url: https://www.youtube.com/playlist?list=PLNGhZnJavRf3f2_NI79j5GigC6xK5_YYq
        - button "Copy text" [ref=e193] [cursor=pointer]
    - generic [ref=e197]:
      - button [ref=e198] [cursor=pointer]:
        - heading "KJBI.org — Free Online Bible College" [level=3] [ref=e204]
      - generic [ref=e207]:
        - paragraph [ref=e208]: King James Bible Institute by Robert Breaker & Robert Potthoff — a free online Bible college for those who want to go deeper in God's Word.
        - link "Visit KJBI.org" [ref=e209] [cursor=pointer]:
          - /url: https://kjbi.org
    - generic [ref=e214]:
      - button [ref=e215] [cursor=pointer]:
        - generic [ref=e216]:
          - heading "Verified KJB Preachers" [level=2] [ref=e223]
          - paragraph [ref=e224]: KJB-believing, soul-winning preachers — tap to see all their links
        - button "Copy text" [ref=e226]
      - generic [ref=e232]:
        - generic [ref=e233]:
          - button [ref=e234] [cursor=pointer]:
            - paragraph [ref=e239]: Robert Breaker
            - button "Copy text" [ref=e241]
          - generic [ref=e247]:
            - paragraph [ref=e248]: KJB missionary evangelist, rightly dividing the word of truth. Also preaches in Spanish.
            - link "YouTube" [ref=e249] [cursor=pointer]:
              - /url: https://www.youtube.com/@Robertbreaker3
              - button "Copy text" [ref=e255]
            - link "TikTok" [ref=e263] [cursor=pointer]:
              - /url: https://www.tiktok.com/@robertbreaker
              - button "Copy text" [ref=e268]
            - link "thecloudchurch.org" [ref=e276] [cursor=pointer]:
              - /url: https://thecloudchurch.org/
              - button "Copy text" [ref=e282]
            - link "laiglesiadelanube.com" [ref=e290] [cursor=pointer]:
              - /url: https://laiglesiadelanube.com/
              - button "Copy text" [ref=e296]
        - generic [ref=e304]:
          - button [ref=e305] [cursor=pointer]:
            - paragraph [ref=e310]: Robert Potthoff
            - button "Copy text" [ref=e312]
          - generic [ref=e318]:
            - paragraph [ref=e319]: Big Red Preacher — KJB soul winner.
            - link "Instagram" [ref=e320] [cursor=pointer]:
              - /url: https://www.instagram.com/robert.potthoff/
              - button "Copy text" [ref=e326]
            - link "Facebook" [ref=e334] [cursor=pointer]:
              - /url: https://www.facebook.com/potthoff87
              - button "Copy text" [ref=e339]
            - link "Instagram" [ref=e347] [cursor=pointer]:
              - /url: https://www.instagram.com/big_red_preacher
              - button "Copy text" [ref=e353]
            - link "Mission 1611" [ref=e361] [cursor=pointer]:
              - /url: https://mission1611.com/
              - button "Copy text" [ref=e367]
        - generic [ref=e375]:
          - button [ref=e376] [cursor=pointer]:
            - paragraph [ref=e381]: Ryan Poff
            - button "Copy text" [ref=e383]
          - generic [ref=e389]:
            - paragraph [ref=e390]: Seed of Hope Church — KJB pastor and preacher.
            - link "seedofhopechurch.org" [ref=e391] [cursor=pointer]:
              - /url: https://www.seedofhopechurch.org/
              - button "Copy text" [ref=e397]
            - link "YouTube" [ref=e405] [cursor=pointer]:
              - /url: https://youtube.com/@ryan_poff
              - button "Copy text" [ref=e411]
            - link "TikTok" [ref=e419] [cursor=pointer]:
              - /url: https://www.tiktok.com/@ryan_sohc
              - button "Copy text" [ref=e424]
        - generic [ref=e432]:
          - button [ref=e433] [cursor=pointer]:
            - paragraph [ref=e438]: Skyler (AV1611 Ministry)
            - button "Copy text" [ref=e440]
          - generic [ref=e446]:
            - paragraph [ref=e447]: AV1611 Ministry — KJB defence and preaching.
            - link "TikTok" [ref=e448] [cursor=pointer]:
              - /url: https://www.tiktok.com/@av1611ministries
              - button "Copy text" [ref=e453]
            - link "YouTube" [ref=e461] [cursor=pointer]:
              - /url: https://youtube.com/@av1611ministries
              - button "Copy text" [ref=e467]
        - generic [ref=e475]:
          - button [ref=e476] [cursor=pointer]:
            - paragraph [ref=e481]: Crown of Thorns
            - button "Copy text" [ref=e483]
          - generic [ref=e489]:
            - paragraph [ref=e490]: KJB preaching ministry on YouTube.
            - link "YouTube" [ref=e491] [cursor=pointer]:
              - /url: https://www.youtube.com/@CrownOfThorns
              - button "Copy text" [ref=e497]
        - generic [ref=e505]:
          - button [ref=e506] [cursor=pointer]:
            - paragraph [ref=e511]: Paul Johnson
            - button "Copy text" [ref=e513]
          - generic [ref=e519]:
            - paragraph [ref=e520]: Biblical Salvation — KJB preaching and Bible teaching.
            - link "TikTok" [ref=e521] [cursor=pointer]:
              - /url: https://www.tiktok.com/@pauljohnson9632
              - button "Copy text" [ref=e526]
            - link "YouTube" [ref=e534] [cursor=pointer]:
              - /url: https://youtube.com/@biblicalsalvation
              - button "Copy text" [ref=e540]
        - generic [ref=e548]:
          - button [ref=e549] [cursor=pointer]:
            - paragraph [ref=e554]: CPR Missions
            - button "Copy text" [ref=e556]
          - generic [ref=e562]:
            - paragraph [ref=e563]: Church Planting and Revival Missions — soul winning and church planting.
            - link "YouTube" [ref=e564] [cursor=pointer]:
              - /url: https://www.youtube.com/channel/UCWBR5DmAi2XPMFRtb-wqHwg
              - button "Copy text" [ref=e570]
            - link "TikTok" [ref=e578] [cursor=pointer]:
              - /url: https://www.tiktok.com/@cprmissions
              - button "Copy text" [ref=e583]
            - link "Facebook" [ref=e591] [cursor=pointer]:
              - /url: https://www.facebook.com/CPRmission/
              - button "Copy text" [ref=e596]
            - link "Instagram" [ref=e604] [cursor=pointer]:
              - /url: https://www.instagram.com/cprmissions/
              - button "Copy text" [ref=e610]
        - generic [ref=e618]:
          - button [ref=e619] [cursor=pointer]:
            - paragraph [ref=e624]: James Bray
            - button "Copy text" [ref=e626]
          - generic [ref=e632]:
            - paragraph [ref=e633]: KJB preacher and Bible teacher on YouTube.
            - link "YouTube" [ref=e634] [cursor=pointer]:
              - /url: https://youtube.com/@jamesbrayall3?si=nXkuHAhyVvC_0KVg
              - button "Copy text" [ref=e640]
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
      |           ^ Error: /salvation @ 320px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```