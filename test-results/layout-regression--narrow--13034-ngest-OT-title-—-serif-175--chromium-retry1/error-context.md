# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layout-regression.spec.js >> [narrow-phone 360x780] >> 1 Kings 16 (longest OT title) — serif @ 175%
- Location: tests/layout-regression.spec.js:72:11

# Error details

```
Error: 1 Kings 16 (longest OT title) (serif @ 175%): text leaking across the column divider:
  "T" (left column, over by 4.4px)

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 7

- Array []
+ Array [
+   Object {
+     "overBy": 4.4,
+     "side": "left",
+     "text": "T",
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
          - button "175%" [ref=e41] [cursor=pointer]
          - button "Font family" [ref=e47] [cursor=pointer]
          - button "Switch to paragraph" [ref=e50] [cursor=pointer]
          - button "Switch to single column" [ref=e52] [cursor=pointer]
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
          - generic [ref=e90]:
            - generic [ref=e91]: The First Book Of The Kings, Commonly called, The Third Book Of The Kings
            - generic [ref=e93]: Chapter 16
          - generic [ref=e97]:
            - generic [ref=e99] [cursor=pointer]:
              - superscript: "1"
              - generic [ref=e101]:
                - generic [ref=e102]: T
                - text: HEN the word of the LORD came to Jehu the son of Hanani against Baasha, saying,
            - generic [ref=e105] [cursor=pointer]:
              - superscript: "2"
              - generic [ref=e106]: Forasmuch as I exalted thee out of the dust, and made thee prince over my people Israel; and thou hast walked in the way of Jeroboam, and hast made my people Israel to sin, to provoke me to anger with their sins;
            - generic [ref=e109] [cursor=pointer]:
              - superscript: "3"
              - generic [ref=e110]: Behold, I will take away the posterity of Baasha, and the posterity of his house; and will make thy house like the house of Jeroboam the son of Nebat.
            - generic [ref=e113] [cursor=pointer]:
              - superscript: "4"
              - generic [ref=e114]: Him that dieth of Baasha in the city shall the dogs eat; and him that dieth of his in the fields shall the fowls of the air eat.
            - generic [ref=e117] [cursor=pointer]:
              - superscript: "5"
              - generic [ref=e120]:
                - text: Now the rest of the acts of Baasha, and what he did, and his might,
                - emphasis [ref=e121]: are
                - text: they not written in the book of the chronicles of the kings of Israel?
            - generic [ref=e123] [cursor=pointer]:
              - superscript: "6"
              - generic [ref=e124]: "So Baasha slept with his fathers, and was buried in Tirzah: and Elah his son reigned in his stead."
            - generic [ref=e127] [cursor=pointer]:
              - superscript: "7"
              - generic [ref=e128]: And also by the hand of the prophet Jehu the son of Hanani came the word of the LORD against Baasha, and against his house, even for all the evil that he did in the sight of the LORD, in provoking him to anger with the work of his hands, in being like the house of Jeroboam; and because he killed him.
            - generic [ref=e131] [cursor=pointer]:
              - superscript: "8"
              - generic [ref=e132]: ¶ In the twenty and sixth year of Asa king of Judah began Elah the son of Baasha to reign over Israel in Tirzah, two years.
            - generic [ref=e136] [cursor=pointer]:
              - superscript: "9"
              - generic [ref=e139]:
                - text: And his servant Zimri, captain of half
                - emphasis [ref=e140]: his
                - text: chariots, conspired against him, as he was in Tirzah, drinking himself drunk in the house of Arza steward of
                - emphasis [ref=e141]: his
                - text: house in Tirzah.
            - generic [ref=e143] [cursor=pointer]:
              - superscript: "10"
              - generic [ref=e144]: And Zimri went in and smote him, and killed him, in the twenty and seventh year of Asa king of Judah, and reigned in his stead.
            - generic [ref=e147] [cursor=pointer]:
              - superscript: "11"
              - generic [ref=e150]:
                - text: ¶ And it came to pass, when he began to reign, as soon as he sat on his throne,
                - emphasis [ref=e151]: that
                - text: "he slew all the house of Baasha: he left him not one that pisseth against a wall, neither of his kinsfolks, nor of his friends."
            - generic [ref=e153] [cursor=pointer]:
              - superscript: "12"
              - generic [ref=e154]: Thus did Zimri destroy all the house of Baasha, according to the word of the LORD, which he spake against Baasha by Jehu the prophet,
            - generic [ref=e157] [cursor=pointer]:
              - superscript: "13"
              - generic [ref=e158]: For all the sins of Baasha, and the sins of Elah his son, by which they sinned, and by which they made Israel to sin, in provoking the LORD God of Israel to anger with their vanities.
            - generic [ref=e161] [cursor=pointer]:
              - superscript: "14"
              - generic [ref=e164]:
                - text: Now the rest of the acts of Elah, and all that he did,
                - emphasis [ref=e165]: are
                - text: they not written in the book of the chronicles of the kings of Israel?
            - generic [ref=e167] [cursor=pointer]:
              - superscript: "15"
              - generic [ref=e170]:
                - text: ¶ In the twenty and seventh year of Asa king of Judah did Zimri reign seven days in Tirzah. And the people
                - emphasis [ref=e171]: were
                - text: encamped against Gibbethon, which
                - emphasis [ref=e172]: belonged
                - text: to the Philistines.
            - generic [ref=e174] [cursor=pointer]:
              - superscript: "16"
              - generic [ref=e177]:
                - text: And the people
                - emphasis [ref=e178]: that were
                - text: "encamped heard say, Zimri hath conspired, and hath also slain the king: wherefore all Israel made Omri, the captain of the host, king over Israel that day in the camp."
            - generic [ref=e180] [cursor=pointer]:
              - superscript: "17"
              - generic [ref=e181]: And Omri went up from Gibbethon, and all Israel with him, and they besieged Tirzah.
            - generic [ref=e184] [cursor=pointer]:
              - superscript: "18"
              - generic [ref=e185]: And it came to pass, when Zimri saw that the city was taken, that he went into the palace of the king's house, and burnt the king's house over him with fire, and died,
            - generic [ref=e188] [cursor=pointer]:
              - superscript: "19"
              - generic [ref=e189]: For his sins which he sinned in doing evil in the sight of the LORD, in walking in the way of Jeroboam, and in his sin which he did, to make Israel to sin.
            - generic [ref=e192] [cursor=pointer]:
              - superscript: "20"
              - generic [ref=e195]:
                - text: Now the rest of the acts of Zimri, and his treason that he wrought,
                - emphasis [ref=e196]: are
                - text: they not written in the book of the chronicles of the kings of Israel?
            - generic [ref=e198] [cursor=pointer]:
              - superscript: "21"
              - generic [ref=e199]: "¶ Then were the people of Israel divided into two parts: half of the people followed Tibni the son of Ginath, to make him king; and half followed Omri."
            - generic [ref=e203] [cursor=pointer]:
              - superscript: "22"
              - generic [ref=e204]: "But the people that followed Omri prevailed against the people that followed Tibni the son of Ginath: so Tibni died, and Omri reigned."
            - generic [ref=e207] [cursor=pointer]:
              - superscript: "23"
              - generic [ref=e208]: "¶ In the thirty and first year of Asa king of Judah began Omri to reign over Israel, twelve years: six years reigned he in Tirzah."
            - generic [ref=e212] [cursor=pointer]:
              - superscript: "24"
              - generic [ref=e213]: And he bought the hill Samaria of Shemer for two talents of silver, and built on the hill, and called the name of the city which he built, after the name of Shemer, owner of the hill, Samaria.
            - generic [ref=e216] [cursor=pointer]:
              - superscript: "25"
              - generic [ref=e219]:
                - text: ¶ But Omri wrought evil in the eyes of the LORD, and did worse than all that
                - emphasis [ref=e220]: were
                - text: before him.
            - generic [ref=e222] [cursor=pointer]:
              - superscript: "26"
              - generic [ref=e223]: For he walked in all the way of Jeroboam the son of Nebat, and in his sin wherewith he made Israel to sin, to provoke the LORD God of Israel to anger with their vanities.
            - generic [ref=e226] [cursor=pointer]:
              - superscript: "27"
              - generic [ref=e229]:
                - text: Now the rest of the acts of Omri which he did, and his might that he shewed,
                - emphasis [ref=e230]: are
                - text: they not written in the book of the chronicles of the kings of Israel?
            - generic [ref=e232] [cursor=pointer]:
              - superscript: "28"
              - generic [ref=e233]: "So Omri slept with his fathers, and was buried in Samaria: and Ahab his son reigned in his stead."
            - generic [ref=e236] [cursor=pointer]:
              - superscript: "29"
              - generic [ref=e237]: "¶ And in the thirty and eighth year of Asa king of Judah began Ahab the son of Omri to reign over Israel: and Ahab the son of Omri reigned over Israel in Samaria twenty and two years."
            - generic [ref=e241] [cursor=pointer]:
              - superscript: "30"
              - generic [ref=e244]:
                - text: And Ahab the son of Omri did evil in the sight of the LORD above all that
                - emphasis [ref=e245]: were
                - text: before him.
            - generic [ref=e247] [cursor=pointer]:
              - superscript: "31"
              - generic [ref=e248]: And it came to pass, as if it had been a light thing for him to walk in the sins of Jeroboam the son of Nebat, that he took to wife Jezebel the daughter of Ethbaal king of the Zidonians, and went and served Baal, and worshipped him.
            - generic [ref=e251] [cursor=pointer]:
              - superscript: "32"
              - generic [ref=e252]: And he reared up an altar for Baal in the house of Baal, which he had built in Samaria.
            - generic [ref=e255] [cursor=pointer]:
              - superscript: "33"
              - generic [ref=e256]: And Ahab made a grove; and Ahab did more to provoke the LORD God of Israel to anger than all the kings of Israel that were before him.
            - generic [ref=e259] [cursor=pointer]:
              - superscript: "34"
              - generic [ref=e262]:
                - text: "¶ In his days did Hiel the Beth-elite build Jericho: he laid the foundation thereof in Abiram his firstborn, and set up the gates thereof in his youngest"
                - emphasis [ref=e263]: son
                - text: Segub, according to the word of the LORD, which he spake by Joshua the son of Nun.
        - generic [ref=e264]:
          - button [ref=e265] [cursor=pointer]
          - button [ref=e268] [cursor=pointer]
    - navigation [ref=e271]:
      - generic [ref=e273]:
        - button "Home" [ref=e274] [cursor=pointer]
        - button "Contents" [ref=e279] [cursor=pointer]
        - button "Read" [ref=e282] [cursor=pointer]
        - button "Gospel" [ref=e287] [cursor=pointer]
        - button "Toggle navigation rows" [ref=e291] [cursor=pointer]
  - region "Notifications alt+T"
```

# Test source

```ts
  76  |             const head = page.getByTestId('kjb-running-head');
  77  |             if (await head.count()) {
  78  |               const headBox = await head.boundingBox();
  79  |               const bookBox = await page.getByTestId('kjb-running-head-book').boundingBox();
  80  |               const chapterBox = await page.getByTestId('kjb-running-head-chapter').boundingBox();
  81  |               const stacked = (await head.getAttribute('data-stacked')) === 'true';
  82  | 
  83  |               expect(headBox, `${book.label}: RunningHead not visible`).toBeTruthy();
  84  |               expect(bookBox, `${book.label}: book title span not visible`).toBeTruthy();
  85  |               expect(chapterBox, `${book.label}: chapter span not visible`).toBeTruthy();
  86  | 
  87  |               if (!stacked) {
  88  |                 // Inline mode: the book title's right edge must sit at or
  89  |                 // before the chapter label's left edge — any overlap here is
  90  |                 // the exact bug we fixed twice already.
  91  |                 expect(
  92  |                   bookBox.x + bookBox.width,
  93  |                   `${book.label} (${font} @ ${zoom}%): book title overlaps "Chapter N" — RunningHead did not shrink/stack correctly`
  94  |                 ).toBeLessThanOrEqual(chapterBox.x + OVERFLOW_TOLERANCE_PX);
  95  |               } else {
  96  |                 // Stacked mode: chapter label must be fully below the book
  97  |                 // title, not beside or overlapping it.
  98  |                 expect(
  99  |                   bookBox.y + bookBox.height,
  100 |                   `${book.label} (${font} @ ${zoom}%): stacked RunningHead — chapter label overlaps book title vertically`
  101 |                 ).toBeLessThanOrEqual(chapterBox.y + OVERFLOW_TOLERANCE_PX);
  102 |               }
  103 | 
  104 |               // Neither span may spill outside the header's own box (this
  105 |               // would mean the internal shrink-to-fit measurement itself is
  106 |               // wrong, independent of the other span).
  107 |               for (const [name, box] of [['book title', bookBox], ['chapter label', chapterBox]]) {
  108 |                 expect(
  109 |                   box.x,
  110 |                   `${book.label} (${font} @ ${zoom}%): ${name} starts left of RunningHead container`
  111 |                 ).toBeGreaterThanOrEqual(headBox.x - OVERFLOW_TOLERANCE_PX);
  112 |                 expect(
  113 |                   box.x + box.width,
  114 |                   `${book.label} (${font} @ ${zoom}%): ${name} extends right of RunningHead container`
  115 |                 ).toBeLessThanOrEqual(headBox.x + headBox.width + OVERFLOW_TOLERANCE_PX);
  116 |               }
  117 |             }
  118 | 
  119 |             // ── Two-column verse text: nothing may cross into the divider ──
  120 |             const container = page.getByTestId('kjb-two-col-container');
  121 |             if (await container.count()) {
  122 |               const result = await container.evaluate((el, tolerance) => {
  123 |                 const containerRect = el.getBoundingClientRect();
  124 |                 const style = getComputedStyle(el);
  125 |                 const gapPx = parseFloat(style.columnGap) || 0;
  126 |                 const leftColumnRightEdge = containerRect.left + (containerRect.width - gapPx) / 2;
  127 |                 const rightColumnLeftEdge = leftColumnRightEdge + gapPx;
  128 |                 const containerCenter = containerRect.left + containerRect.width / 2;
  129 | 
  130 |                 const overflows = [];
  131 |                 // Any leaf element with visible text — this is what actually
  132 |                 // paints pixels, so it's what can visually "leak."
  133 |                 const candidates = el.querySelectorAll('*');
  134 |                 for (const node of candidates) {
  135 |                   if (node.children.length > 0) continue; // only leaves
  136 |                   const text = (node.textContent || '').trim();
  137 |                   if (!text) continue;
  138 |                   const rects = node.getClientRects();
  139 |                   for (const rect of rects) {
  140 |                     if (rect.width === 0 || rect.height === 0) continue;
  141 |                     const rectCenter = rect.left + rect.width / 2;
  142 |                     if (rectCenter < containerCenter) {
  143 |                       // Left column: right edge must not pass the divider's
  144 |                       // left-column boundary.
  145 |                       if (rect.right > leftColumnRightEdge + tolerance) {
  146 |                         overflows.push({
  147 |                           text: text.slice(0, 40),
  148 |                           side: 'left',
  149 |                           overBy: Math.round((rect.right - leftColumnRightEdge) * 10) / 10,
  150 |                         });
  151 |                       }
  152 |                     } else {
  153 |                       // Right column: left edge must not start before the
  154 |                       // divider's right-column boundary.
  155 |                       if (rect.left < rightColumnLeftEdge - tolerance) {
  156 |                         overflows.push({
  157 |                           text: text.slice(0, 40),
  158 |                           side: 'right',
  159 |                           overBy: Math.round((rightColumnLeftEdge - rect.left) * 10) / 10,
  160 |                         });
  161 |                       }
  162 |                     }
  163 |                   }
  164 |                 }
  165 |                 return {
  166 |                   overflows,
  167 |                   scrollWidth: el.scrollWidth,
  168 |                   clientWidth: el.clientWidth,
  169 |                 };
  170 |               }, OVERFLOW_TOLERANCE_PX);
  171 | 
  172 |               expect(
  173 |                 result.overflows,
  174 |                 `${book.label} (${font} @ ${zoom}%): text leaking across the column divider:\n` +
  175 |                   result.overflows.map((o) => `  "${o.text}" (${o.side} column, over by ${o.overBy}px)`).join('\n')
> 176 |               ).toEqual([]);
      |                 ^ Error: 1 Kings 16 (longest OT title) (serif @ 175%): text leaking across the column divider:
  177 | 
  178 |               // Whole-container overflow (e.g. a word too wide to break at
  179 |               // all) shows up as horizontal scroll on the container itself.
  180 |               expect(
  181 |                 result.scrollWidth,
  182 |                 `${book.label} (${font} @ ${zoom}%): two-column container has horizontal overflow`
  183 |               ).toBeLessThanOrEqual(result.clientWidth + OVERFLOW_TOLERANCE_PX);
  184 |             }
  185 |           });
  186 |         }
  187 |       }
  188 |     }
  189 |   });
  190 | }
  191 | 
```