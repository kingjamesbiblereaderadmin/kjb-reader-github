# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 768px] >> no horizontal overflow: /read?book=GEN&chapter=1
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /read?book=GEN&chapter=1 @ 768px overflows horizontally by 0px:
  <div class="kjb-slide-forward"> "GenesisCh.1Verse100%SerifLines1-ColSelectSharePrintPrevNextE" (over by 24px)

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 8

- Array []
+ Array [
+   Object {
+     "cls": "kjb-slide-forward",
+     "overBy": 24,
+     "tag": "div",
+     "text": "GenesisCh.1Verse100%SerifLines1-ColSelectSharePrintPrevNextE",
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
      - generic [ref=e22]:
        - generic [ref=e24]:
          - button "Genesis" [ref=e26] [cursor=pointer]
          - button "Ch.1" [ref=e31] [cursor=pointer]
          - button "Verse" [ref=e36] [cursor=pointer]
          - button "100%" [ref=e41] [cursor=pointer]
          - button "Serif" [ref=e47] [cursor=pointer]
          - button "Switch to paragraph" [ref=e51] [cursor=pointer]
          - button "Switch to two-column" [ref=e53] [cursor=pointer]
          - button "Select verses" [ref=e55] [cursor=pointer]
          - button "Share" [ref=e59] [cursor=pointer]
          - button "Print" [ref=e66] [cursor=pointer]
          - generic [ref=e71]:
            - button [ref=e72] [cursor=pointer]
            - button [ref=e75] [cursor=pointer]
          - generic [ref=e78]:
            - button "Exit fullscreen" [ref=e79] [cursor=pointer]
            - button "Hide header" [ref=e85] [cursor=pointer]
        - generic [ref=e88]:
          - heading "The First Book of Moses, called Genesis" [level=1] [ref=e89]
          - paragraph [ref=e90]: Chapter 1
        - generic [ref=e92]:
          - generic [ref=e94] [cursor=pointer]:
            - superscript: "1"
            - generic [ref=e96]:
              - generic [ref=e97]: I
              - text: N the beginning God created the heaven and the earth.
          - generic [ref=e100] [cursor=pointer]:
            - superscript: "2"
            - generic [ref=e103]:
              - text: And the earth was without form, and void; and darkness
              - emphasis [ref=e104]: was
              - text: upon the face of the deep. And the Spirit of God moved upon the face of the waters.
          - generic [ref=e106] [cursor=pointer]:
            - superscript: "3"
            - generic [ref=e107]: "And God said, Let there be light: and there was light."
          - generic [ref=e110] [cursor=pointer]:
            - superscript: "4"
            - generic [ref=e113]:
              - text: And God saw the light, that
              - emphasis [ref=e114]: it was
              - text: "good: and God divided the light from the darkness."
          - generic [ref=e116] [cursor=pointer]:
            - superscript: "5"
            - generic [ref=e117]: And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.
          - generic [ref=e120] [cursor=pointer]:
            - superscript: "6"
            - generic [ref=e121]: ¶ And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.
          - generic [ref=e125] [cursor=pointer]:
            - superscript: "7"
            - generic [ref=e128]:
              - text: And God made the firmament, and divided the waters which
              - emphasis [ref=e129]: were
              - text: under the firmament from the waters which
              - emphasis [ref=e130]: were
              - text: "above the firmament: and it was so."
          - generic [ref=e132] [cursor=pointer]:
            - superscript: "8"
            - generic [ref=e133]: And God called the firmament Heaven.
          - generic [ref=e136] [cursor=pointer]:
            - superscript: "9"
            - generic [ref=e139]:
              - text: ¶ And God said, Let the waters under the heaven be gathered together unto one place, and let the dry
              - emphasis [ref=e140]: land
              - text: "appear: and it was so."
          - generic [ref=e142] [cursor=pointer]:
            - superscript: "10"
            - generic [ref=e145]:
              - text: And God called the dry
              - emphasis [ref=e146]: land
              - text: "Earth; and the gathering together of the waters called he Seas: and God saw that"
              - emphasis [ref=e147]: it was
              - text: good.
          - generic [ref=e149] [cursor=pointer]:
            - superscript: "11"
            - generic [ref=e152]:
              - text: And God said, Let the earth bring forth grass, the herb yielding seed,
              - emphasis [ref=e153]: and
              - text: the fruit tree yielding fruit after his kind, whose seed
              - emphasis [ref=e154]: is
              - text: "in itself, upon the earth: and it was so."
          - generic [ref=e156] [cursor=pointer]:
            - superscript: "12"
            - generic [ref=e159]:
              - text: And the earth brought forth grass,
              - emphasis [ref=e160]: and
              - text: herb yielding seed after his kind, and the tree yielding fruit, whose seed
              - emphasis [ref=e161]: was
              - text: "in itself, after his kind: and God saw that"
              - emphasis [ref=e162]: it was
              - text: good.
          - generic [ref=e164] [cursor=pointer]:
            - superscript: "13"
            - generic [ref=e165]: And the evening and the morning were the third day.
          - generic [ref=e168] [cursor=pointer]:
            - superscript: "14"
            - generic [ref=e169]: "¶ And God said, Let there be lights in the firmament of the heaven to divide the day from the night; and let them be for signs, and for seasons, and for days, and years:"
          - generic [ref=e173] [cursor=pointer]:
            - superscript: "15"
            - generic [ref=e174]: "And let them be for lights in the firmament of the heaven to give light upon the earth: and it was so."
          - generic [ref=e177] [cursor=pointer]:
            - superscript: "16"
            - generic [ref=e180]:
              - text: "And God made two great lights; the greater light to rule the day, and the lesser light to rule the night:"
              - emphasis [ref=e181]: he made
              - text: the stars also.
          - generic [ref=e183] [cursor=pointer]:
            - superscript: "17"
            - generic [ref=e184]: And God set them in the firmament of the heaven to give light upon the earth,
          - generic [ref=e187] [cursor=pointer]:
            - superscript: "18"
            - generic [ref=e190]:
              - text: "And to rule over the day and over the night, and to divide the light from the darkness: and God saw that"
              - emphasis [ref=e191]: it was
              - text: good.
          - generic [ref=e193] [cursor=pointer]:
            - superscript: "19"
            - generic [ref=e194]: And the evening and the morning were the fourth day.
          - generic [ref=e197] [cursor=pointer]:
            - superscript: "20"
            - generic [ref=e200]:
              - text: And God said, Let the waters bring forth abundantly the moving creature that hath life, and fowl
              - emphasis [ref=e201]: that
              - text: may fly above the earth in the open firmament of heaven.
          - generic [ref=e203] [cursor=pointer]:
            - superscript: "21"
            - generic [ref=e206]:
              - text: "And God created great whales, and every living creature that moveth, which the waters brought forth abundantly, after their kind, and every winged fowl after his kind: and God saw that"
              - emphasis [ref=e207]: it was
              - text: good.
          - generic [ref=e209] [cursor=pointer]:
            - superscript: "22"
            - generic [ref=e210]: And God blessed them, saying, Be fruitful, and multiply, and fill the waters in the seas, and let fowl multiply in the earth.
          - generic [ref=e213] [cursor=pointer]:
            - superscript: "23"
            - generic [ref=e214]: And the evening and the morning were the fifth day.
          - generic [ref=e217] [cursor=pointer]:
            - superscript: "24"
            - generic [ref=e218]: "¶ And God said, Let the earth bring forth the living creature after his kind, cattle, and creeping thing, and beast of the earth after his kind: and it was so."
          - generic [ref=e222] [cursor=pointer]:
            - superscript: "25"
            - generic [ref=e225]:
              - text: "And God made the beast of the earth after his kind, and cattle after their kind, and every thing that creepeth upon the earth after his kind: and God saw that"
              - emphasis [ref=e226]: it was
              - text: good.
          - generic [ref=e228] [cursor=pointer]:
            - superscript: "26"
            - generic [ref=e229]: "¶ And God said, Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the fowl of the air, and over the cattle, and over all the earth, and over every creeping thing that creepeth upon the earth."
          - generic [ref=e233] [cursor=pointer]:
            - superscript: "27"
            - generic [ref=e236]:
              - text: So God created man in his
              - emphasis [ref=e237]: own
              - text: image, in the image of God created he him; male and female created he them.
          - generic [ref=e239] [cursor=pointer]:
            - superscript: "28"
            - generic [ref=e240]: "And God blessed them, and God said unto them, Be fruitful, and multiply, and replenish the earth, and subdue it: and have dominion over the fish of the sea, and over the fowl of the air, and over every living thing that moveth upon the earth."
          - generic [ref=e243] [cursor=pointer]:
            - superscript: "29"
            - generic [ref=e246]:
              - text: ¶ And God said, Behold, I have given you every herb bearing seed, which
              - emphasis [ref=e247]: is
              - text: upon the face of all the earth, and every tree, in the which
              - emphasis [ref=e248]: is
              - text: the fruit of a tree yielding seed; to you it shall be for meat.
          - generic [ref=e250] [cursor=pointer]:
            - superscript: "30"
            - generic [ref=e253]:
              - text: And to every beast of the earth, and to every fowl of the air, and to every thing that creepeth upon the earth, wherein
              - emphasis [ref=e254]: there is
              - text: life,
              - emphasis [ref=e255]: I have given
              - text: "every green herb for meat: and it was so."
          - generic [ref=e257] [cursor=pointer]:
            - superscript: "31"
            - generic [ref=e260]:
              - text: And God saw every thing that he had made, and, behold,
              - emphasis [ref=e261]: it was
              - text: very good. And the evening and the morning were the sixth day.
        - generic [ref=e262]:
          - button "Old Testament Title Page" [ref=e263] [cursor=pointer]
          - button "Chapter 2" [ref=e267] [cursor=pointer]
    - contentinfo [ref=e271]:
      - generic [ref=e272]:
        - button [ref=e274] [cursor=pointer]
        - generic [ref=e277]:
          - link "Home" [ref=e278] [cursor=pointer]:
            - /url: /
          - link "Contents" [ref=e282] [cursor=pointer]:
            - /url: /contents
          - link "Read" [ref=e284] [cursor=pointer]:
            - /url: /read
          - link "Gospel" [ref=e287] [cursor=pointer]:
            - /url: /gospel
          - link "Resources" [ref=e290] [cursor=pointer]:
            - /url: /resources
          - link "Saved" [ref=e293] [cursor=pointer]:
            - /url: /saved
          - link "About" [ref=e296] [cursor=pointer]:
            - /url: /about
          - link "Settings" [ref=e299] [cursor=pointer]:
            - /url: /settings
        - paragraph [ref=e303]:
          - text: Bible text from
          - link "bibleprotector.com" [ref=e304] [cursor=pointer]:
            - /url: https://bibleprotector.com
          - text: · Created with
          - link "Base44" [ref=e305] [cursor=pointer]:
            - /url: https://base44.com
        - paragraph [ref=e306]:
          - link "Privacy" [ref=e307] [cursor=pointer]:
            - /url: /privacy
          - text: ·
          - link "Terms" [ref=e308] [cursor=pointer]:
            - /url: /terms
          - text: ·
          - link "Changelog" [ref=e309] [cursor=pointer]:
            - /url: /extension/change-log
          - text: ·
          - link "Contact" [ref=e310] [cursor=pointer]:
            - /url: /contact
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
      |           ^ Error: /read?book=GEN&chapter=1 @ 768px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```