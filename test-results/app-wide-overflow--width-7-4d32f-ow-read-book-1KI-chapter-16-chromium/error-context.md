# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 768px] >> no horizontal overflow: /read?book=1KI&chapter=16
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /read?book=1KI&chapter=16 @ 768px overflows horizontally by 0px:
  <div class="kjb-slide-forward"> "1 KingsCh.16Verse100%SerifLines1-ColSelectSharePrintPrevNext" (over by 24px)

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 8

- Array []
+ Array [
+   Object {
+     "cls": "kjb-slide-forward",
+     "overBy": 24,
+     "tag": "div",
+     "text": "1 KingsCh.16Verse100%SerifLines1-ColSelectSharePrintPrevNext",
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
          - button "1 Kings" [ref=e26] [cursor=pointer]
          - button "Ch.16" [ref=e31] [cursor=pointer]
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
          - heading "The First Book Of The Kings, Commonly called, The Third Book Of The Kings" [level=1] [ref=e89]
          - paragraph [ref=e90]: Chapter 16
        - generic [ref=e92]:
          - generic [ref=e94] [cursor=pointer]:
            - superscript: "1"
            - generic [ref=e96]:
              - generic [ref=e97]: T
              - text: HEN the word of the LORD came to Jehu the son of Hanani against Baasha, saying,
          - generic [ref=e100] [cursor=pointer]:
            - superscript: "2"
            - generic [ref=e101]: Forasmuch as I exalted thee out of the dust, and made thee prince over my people Israel; and thou hast walked in the way of Jeroboam, and hast made my people Israel to sin, to provoke me to anger with their sins;
          - generic [ref=e104] [cursor=pointer]:
            - superscript: "3"
            - generic [ref=e105]: Behold, I will take away the posterity of Baasha, and the posterity of his house; and will make thy house like the house of Jeroboam the son of Nebat.
          - generic [ref=e108] [cursor=pointer]:
            - superscript: "4"
            - generic [ref=e109]: Him that dieth of Baasha in the city shall the dogs eat; and him that dieth of his in the fields shall the fowls of the air eat.
          - generic [ref=e112] [cursor=pointer]:
            - superscript: "5"
            - generic [ref=e115]:
              - text: Now the rest of the acts of Baasha, and what he did, and his might,
              - emphasis [ref=e116]: are
              - text: they not written in the book of the chronicles of the kings of Israel?
          - generic [ref=e118] [cursor=pointer]:
            - superscript: "6"
            - generic [ref=e119]: "So Baasha slept with his fathers, and was buried in Tirzah: and Elah his son reigned in his stead."
          - generic [ref=e122] [cursor=pointer]:
            - superscript: "7"
            - generic [ref=e123]: And also by the hand of the prophet Jehu the son of Hanani came the word of the LORD against Baasha, and against his house, even for all the evil that he did in the sight of the LORD, in provoking him to anger with the work of his hands, in being like the house of Jeroboam; and because he killed him.
          - generic [ref=e126] [cursor=pointer]:
            - superscript: "8"
            - generic [ref=e127]: ¶ In the twenty and sixth year of Asa king of Judah began Elah the son of Baasha to reign over Israel in Tirzah, two years.
          - generic [ref=e131] [cursor=pointer]:
            - superscript: "9"
            - generic [ref=e134]:
              - text: And his servant Zimri, captain of half
              - emphasis [ref=e135]: his
              - text: chariots, conspired against him, as he was in Tirzah, drinking himself drunk in the house of Arza steward of
              - emphasis [ref=e136]: his
              - text: house in Tirzah.
          - generic [ref=e138] [cursor=pointer]:
            - superscript: "10"
            - generic [ref=e139]: And Zimri went in and smote him, and killed him, in the twenty and seventh year of Asa king of Judah, and reigned in his stead.
          - generic [ref=e142] [cursor=pointer]:
            - superscript: "11"
            - generic [ref=e145]:
              - text: ¶ And it came to pass, when he began to reign, as soon as he sat on his throne,
              - emphasis [ref=e146]: that
              - text: "he slew all the house of Baasha: he left him not one that pisseth against a wall, neither of his kinsfolks, nor of his friends."
          - generic [ref=e148] [cursor=pointer]:
            - superscript: "12"
            - generic [ref=e149]: Thus did Zimri destroy all the house of Baasha, according to the word of the LORD, which he spake against Baasha by Jehu the prophet,
          - generic [ref=e152] [cursor=pointer]:
            - superscript: "13"
            - generic [ref=e153]: For all the sins of Baasha, and the sins of Elah his son, by which they sinned, and by which they made Israel to sin, in provoking the LORD God of Israel to anger with their vanities.
          - generic [ref=e156] [cursor=pointer]:
            - superscript: "14"
            - generic [ref=e159]:
              - text: Now the rest of the acts of Elah, and all that he did,
              - emphasis [ref=e160]: are
              - text: they not written in the book of the chronicles of the kings of Israel?
          - generic [ref=e162] [cursor=pointer]:
            - superscript: "15"
            - generic [ref=e165]:
              - text: ¶ In the twenty and seventh year of Asa king of Judah did Zimri reign seven days in Tirzah. And the people
              - emphasis [ref=e166]: were
              - text: encamped against Gibbethon, which
              - emphasis [ref=e167]: belonged
              - text: to the Philistines.
          - generic [ref=e169] [cursor=pointer]:
            - superscript: "16"
            - generic [ref=e172]:
              - text: And the people
              - emphasis [ref=e173]: that were
              - text: "encamped heard say, Zimri hath conspired, and hath also slain the king: wherefore all Israel made Omri, the captain of the host, king over Israel that day in the camp."
          - generic [ref=e175] [cursor=pointer]:
            - superscript: "17"
            - generic [ref=e176]: And Omri went up from Gibbethon, and all Israel with him, and they besieged Tirzah.
          - generic [ref=e179] [cursor=pointer]:
            - superscript: "18"
            - generic [ref=e180]: And it came to pass, when Zimri saw that the city was taken, that he went into the palace of the king's house, and burnt the king's house over him with fire, and died,
          - generic [ref=e183] [cursor=pointer]:
            - superscript: "19"
            - generic [ref=e184]: For his sins which he sinned in doing evil in the sight of the LORD, in walking in the way of Jeroboam, and in his sin which he did, to make Israel to sin.
          - generic [ref=e187] [cursor=pointer]:
            - superscript: "20"
            - generic [ref=e190]:
              - text: Now the rest of the acts of Zimri, and his treason that he wrought,
              - emphasis [ref=e191]: are
              - text: they not written in the book of the chronicles of the kings of Israel?
          - generic [ref=e193] [cursor=pointer]:
            - superscript: "21"
            - generic [ref=e194]: "¶ Then were the people of Israel divided into two parts: half of the people followed Tibni the son of Ginath, to make him king; and half followed Omri."
          - generic [ref=e198] [cursor=pointer]:
            - superscript: "22"
            - generic [ref=e199]: "But the people that followed Omri prevailed against the people that followed Tibni the son of Ginath: so Tibni died, and Omri reigned."
          - generic [ref=e202] [cursor=pointer]:
            - superscript: "23"
            - generic [ref=e203]: "¶ In the thirty and first year of Asa king of Judah began Omri to reign over Israel, twelve years: six years reigned he in Tirzah."
          - generic [ref=e207] [cursor=pointer]:
            - superscript: "24"
            - generic [ref=e208]: And he bought the hill Samaria of Shemer for two talents of silver, and built on the hill, and called the name of the city which he built, after the name of Shemer, owner of the hill, Samaria.
          - generic [ref=e211] [cursor=pointer]:
            - superscript: "25"
            - generic [ref=e214]:
              - text: ¶ But Omri wrought evil in the eyes of the LORD, and did worse than all that
              - emphasis [ref=e215]: were
              - text: before him.
          - generic [ref=e217] [cursor=pointer]:
            - superscript: "26"
            - generic [ref=e218]: For he walked in all the way of Jeroboam the son of Nebat, and in his sin wherewith he made Israel to sin, to provoke the LORD God of Israel to anger with their vanities.
          - generic [ref=e221] [cursor=pointer]:
            - superscript: "27"
            - generic [ref=e224]:
              - text: Now the rest of the acts of Omri which he did, and his might that he shewed,
              - emphasis [ref=e225]: are
              - text: they not written in the book of the chronicles of the kings of Israel?
          - generic [ref=e227] [cursor=pointer]:
            - superscript: "28"
            - generic [ref=e228]: "So Omri slept with his fathers, and was buried in Samaria: and Ahab his son reigned in his stead."
          - generic [ref=e231] [cursor=pointer]:
            - superscript: "29"
            - generic [ref=e232]: "¶ And in the thirty and eighth year of Asa king of Judah began Ahab the son of Omri to reign over Israel: and Ahab the son of Omri reigned over Israel in Samaria twenty and two years."
          - generic [ref=e236] [cursor=pointer]:
            - superscript: "30"
            - generic [ref=e239]:
              - text: And Ahab the son of Omri did evil in the sight of the LORD above all that
              - emphasis [ref=e240]: were
              - text: before him.
          - generic [ref=e242] [cursor=pointer]:
            - superscript: "31"
            - generic [ref=e243]: And it came to pass, as if it had been a light thing for him to walk in the sins of Jeroboam the son of Nebat, that he took to wife Jezebel the daughter of Ethbaal king of the Zidonians, and went and served Baal, and worshipped him.
          - generic [ref=e246] [cursor=pointer]:
            - superscript: "32"
            - generic [ref=e247]: And he reared up an altar for Baal in the house of Baal, which he had built in Samaria.
          - generic [ref=e250] [cursor=pointer]:
            - superscript: "33"
            - generic [ref=e251]: And Ahab made a grove; and Ahab did more to provoke the LORD God of Israel to anger than all the kings of Israel that were before him.
          - generic [ref=e254] [cursor=pointer]:
            - superscript: "34"
            - generic [ref=e257]:
              - text: "¶ In his days did Hiel the Beth-elite build Jericho: he laid the foundation thereof in Abiram his firstborn, and set up the gates thereof in his youngest"
              - emphasis [ref=e258]: son
              - text: Segub, according to the word of the LORD, which he spake by Joshua the son of Nun.
        - generic [ref=e259]:
          - button "Chapter 15" [ref=e260] [cursor=pointer]
          - button "Chapter 17" [ref=e264] [cursor=pointer]
    - contentinfo [ref=e268]:
      - generic [ref=e269]:
        - button [ref=e271] [cursor=pointer]
        - generic [ref=e274]:
          - link "Home" [ref=e275] [cursor=pointer]:
            - /url: /
          - link "Contents" [ref=e279] [cursor=pointer]:
            - /url: /contents
          - link "Read" [ref=e281] [cursor=pointer]:
            - /url: /read
          - link "Gospel" [ref=e284] [cursor=pointer]:
            - /url: /gospel
          - link "Resources" [ref=e287] [cursor=pointer]:
            - /url: /resources
          - link "Saved" [ref=e290] [cursor=pointer]:
            - /url: /saved
          - link "About" [ref=e293] [cursor=pointer]:
            - /url: /about
          - link "Settings" [ref=e296] [cursor=pointer]:
            - /url: /settings
        - paragraph [ref=e300]:
          - text: Bible text from
          - link "bibleprotector.com" [ref=e301] [cursor=pointer]:
            - /url: https://bibleprotector.com
          - text: · Created with
          - link "Base44" [ref=e302] [cursor=pointer]:
            - /url: https://base44.com
        - paragraph [ref=e303]:
          - link "Privacy" [ref=e304] [cursor=pointer]:
            - /url: /privacy
          - text: ·
          - link "Terms" [ref=e305] [cursor=pointer]:
            - /url: /terms
          - text: ·
          - link "Changelog" [ref=e306] [cursor=pointer]:
            - /url: /extension/change-log
          - text: ·
          - link "Contact" [ref=e307] [cursor=pointer]:
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
      |           ^ Error: /read?book=1KI&chapter=16 @ 768px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```