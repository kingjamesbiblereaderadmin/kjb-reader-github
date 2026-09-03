# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: deep-feature-coverage.spec.js >> Select mode — bulk actions in the reader >> Print Full Page and Print Selected Verses do not throw (window.print stubbed)
- Location: tests/deep-feature-coverage.spec.js:147:3

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('button', { name: /^Print/ }) resolved to 2 elements:
    1) <button title="Print" class="kjb-fixed-btn flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 touch-manipulation h-10 whitespace-nowrap">…</button> aka getByRole('button', { name: 'Print', description: 'Print' })
    2) <button type="button" id="radix-:r8:" data-state="closed" aria-haspopup="menu" aria-expanded="false" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap">…</button> aka getByRole('button', { name: 'Print' }).nth(1)

Call log:
  - waiting for getByRole('button', { name: /^Print/ })

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
        - generic [ref=e23]:
          - generic [ref=e24]:
            - button "John" [ref=e26] [cursor=pointer]
            - button "Ch.3" [ref=e31] [cursor=pointer]
            - button "2 selected" [ref=e36] [cursor=pointer]
            - button "100%" [ref=e42] [cursor=pointer]
            - button "Font family" [ref=e48] [cursor=pointer]
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
            - generic [ref=e89]: 2/36 selected
            - button "All" [ref=e90] [cursor=pointer]
            - button "Cancel" [ref=e94] [cursor=pointer]
            - button "Copy" [ref=e98] [cursor=pointer]
            - button "Share" [ref=e102] [cursor=pointer]
            - button "Print" [ref=e109] [cursor=pointer]
            - button "Save" [ref=e114] [cursor=pointer]
            - button "Highlight" [ref=e117] [cursor=pointer]
            - button "Read Selected" [ref=e121] [cursor=pointer]
            - button "Show Full Chapter" [ref=e125] [cursor=pointer]
        - generic [ref=e127]:
          - heading "The Gospel According to Saint John" [level=1] [ref=e128]
          - paragraph [ref=e129]: Chapter 3
        - generic [ref=e131]:
          - generic [ref=e133] [cursor=pointer]:
            - superscript: "1"
            - generic [ref=e134]: "THERE was a man of the Pharisees, named Nicodemus, a ruler of the Jews:"
          - generic [ref=e140] [cursor=pointer]:
            - superscript: "2"
            - generic [ref=e141]: "The same came to Jesus by night, and said unto him, Rabbi, we know that thou art a teacher come from God: for no man can do these miracles that thou doest, except God be with him."
          - generic [ref=e147] [cursor=pointer]:
            - superscript: "3"
            - generic [ref=e148]: Jesus answered and said unto him, Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God.
          - generic [ref=e154] [cursor=pointer]:
            - superscript: "4"
            - generic [ref=e155]: Nicodemus saith unto him, How can a man be born when he is old? can he enter the second time into his mother's womb, and be born?
          - generic [ref=e161] [cursor=pointer]:
            - superscript: "5"
            - generic [ref=e167]:
              - text: Jesus answered, Verily, verily, I say unto thee, Except a man be born of water and
              - emphasis [ref=e168]: of
              - text: the Spirit, he cannot enter into the kingdom of God.
          - generic [ref=e170] [cursor=pointer]:
            - superscript: "6"
            - generic [ref=e171]: That which is born of the flesh is flesh; and that which is born of the Spirit is spirit.
          - generic [ref=e177] [cursor=pointer]:
            - superscript: "7"
            - generic [ref=e178]: Marvel not that I said unto thee, Ye must be born again.
          - generic [ref=e184] [cursor=pointer]:
            - superscript: "8"
            - generic [ref=e185]: "The wind bloweth where it listeth, and thou hearest the sound thereof, but canst not tell whence it cometh, and whither it goeth: so is every one that is born of the Spirit."
          - generic [ref=e191] [cursor=pointer]:
            - superscript: "9"
            - generic [ref=e192]: Nicodemus answered and said unto him, How can these things be?
          - generic [ref=e198] [cursor=pointer]:
            - superscript: "10"
            - generic [ref=e199]: Jesus answered and said unto him, Art thou a master of Israel, and knowest not these things?
          - generic [ref=e205] [cursor=pointer]:
            - superscript: "11"
            - generic [ref=e206]: Verily, verily, I say unto thee, We speak that we do know, and testify that we have seen; and ye receive not our witness.
          - generic [ref=e212] [cursor=pointer]:
            - superscript: "12"
            - generic [ref=e218]:
              - text: If I have told you earthly things, and ye believe not, how shall ye believe, if I tell you
              - emphasis [ref=e219]: of
              - text: heavenly things?
          - generic [ref=e221] [cursor=pointer]:
            - superscript: "13"
            - generic [ref=e227]:
              - text: And no man hath ascended up to heaven, but he that came down from heaven,
              - emphasis [ref=e228]: even
              - text: the Son of man which is in heaven.
          - generic [ref=e230] [cursor=pointer]:
            - superscript: "14"
            - generic [ref=e231]: "¶ And as Moses lifted up the serpent in the wilderness, even so must the Son of man be lifted up:"
          - generic [ref=e238] [cursor=pointer]:
            - superscript: "15"
            - generic [ref=e239]: That whosoever believeth in him should not perish, but have eternal life.
          - generic [ref=e245] [cursor=pointer]:
            - superscript: "16"
            - generic [ref=e246]: ¶ For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.
          - generic [ref=e253] [cursor=pointer]:
            - superscript: "17"
            - generic [ref=e254]: For God sent not his Son into the world to condemn the world; but that the world through him might be saved.
          - generic [ref=e261] [cursor=pointer]:
            - superscript: "18"
            - generic [ref=e262]: "¶ He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God."
          - generic [ref=e270] [cursor=pointer]:
            - superscript: "19"
            - generic [ref=e271]: And this is the condemnation, that light is come into the world, and men loved darkness rather than light, because their deeds were evil.
          - generic [ref=e277] [cursor=pointer]:
            - superscript: "20"
            - generic [ref=e278]: For every one that doeth evil hateth the light, neither cometh to the light, lest his deeds should be reproved.
          - generic [ref=e284] [cursor=pointer]:
            - superscript: "21"
            - generic [ref=e285]: But he that doeth truth cometh to the light, that his deeds may be made manifest, that they are wrought in God.
          - generic [ref=e291] [cursor=pointer]:
            - superscript: "22"
            - generic [ref=e292]: ¶ After these things came Jesus and his disciples into the land of Judæa; and there he tarried with them, and baptized.
          - generic [ref=e299] [cursor=pointer]:
            - superscript: "23"
            - generic [ref=e300]: "¶ And John also was baptizing in Ænon near to Salim, because there was much water there: and they came, and were baptized."
          - generic [ref=e307] [cursor=pointer]:
            - superscript: "24"
            - generic [ref=e308]: For John was not yet cast into prison.
          - generic [ref=e314] [cursor=pointer]:
            - superscript: "25"
            - generic [ref=e320]:
              - text: ¶ Then there arose a question between
              - emphasis [ref=e321]: some
              - text: of John's disciples and the Jews about purifying.
          - generic [ref=e323] [cursor=pointer]:
            - superscript: "26"
            - generic [ref=e329]:
              - text: And they came unto John, and said unto him, Rabbi, he that was with thee beyond Jordan, to whom thou barest witness, behold, the same baptizeth, and all
              - emphasis [ref=e330]: men
              - text: come to him.
          - generic [ref=e332] [cursor=pointer]:
            - superscript: "27"
            - generic [ref=e333]: John answered and said, A man can receive nothing, except it be given him from heaven.
          - generic [ref=e339] [cursor=pointer]:
            - superscript: "28"
            - generic [ref=e340]: Ye yourselves bear me witness, that I said, I am not the Christ, but that I am sent before him.
          - generic [ref=e346] [cursor=pointer]:
            - superscript: "29"
            - generic [ref=e347]: "He that hath the bride is the bridegroom: but the friend of the bridegroom, which standeth and heareth him, rejoiceth greatly because of the bridegroom's voice: this my joy therefore is fulfilled."
          - generic [ref=e353] [cursor=pointer]:
            - superscript: "30"
            - generic [ref=e359]:
              - text: He must increase, but I
              - emphasis [ref=e360]: must
              - text: decrease.
          - generic [ref=e362] [cursor=pointer]:
            - superscript: "31"
            - generic [ref=e363]: "He that cometh from above is above all: he that is of the earth is earthly, and speaketh of the earth: he that cometh from heaven is above all."
          - generic [ref=e369] [cursor=pointer]:
            - superscript: "32"
            - generic [ref=e370]: And what he hath seen and heard, that he testifieth; and no man receiveth his testimony.
          - generic [ref=e376] [cursor=pointer]:
            - superscript: "33"
            - generic [ref=e377]: He that hath received his testimony hath set to his seal that God is true.
          - generic [ref=e383] [cursor=pointer]:
            - superscript: "34"
            - generic [ref=e389]:
              - text: "For he whom God hath sent speaketh the words of God: for God giveth not the Spirit by measure"
              - emphasis [ref=e390]: unto him
              - text: .
          - generic [ref=e392] [cursor=pointer]:
            - superscript: "35"
            - generic [ref=e393]: The Father loveth the Son, and hath given all things into his hand.
          - generic [ref=e399] [cursor=pointer]:
            - superscript: "36"
            - generic [ref=e400]: "He that believeth on the Son hath everlasting life: and he that believeth not the Son shall not see life; but the wrath of God abideth on him."
        - generic [ref=e405]:
          - button [ref=e406] [cursor=pointer]
          - button [ref=e409] [cursor=pointer]
    - navigation [ref=e412]:
      - generic [ref=e414]:
        - button "Home" [ref=e415] [cursor=pointer]
        - button "Contents" [ref=e420] [cursor=pointer]
        - button "Read" [ref=e423] [cursor=pointer]
        - button "Gospel" [ref=e428] [cursor=pointer]
        - button "Toggle navigation rows" [ref=e432] [cursor=pointer]
    - button "Scroll to top" [ref=e435] [cursor=pointer]
  - region "Notifications alt+T"
```

# Test source

```ts
  55  |       expect(dialog.type()).toBe('prompt');
  56  |       await dialog.accept('Study Notes');
  57  |     });
  58  |     await page.getByTitle('Move').first().click();
  59  |     await page.getByText('New Folder...').click();
  60  |     await page.waitForTimeout(500);
  61  | 
  62  |     // Creating a folder auto-switches the active filter to it (empty, since
  63  |     // the verse hasn't been moved yet) -- that hides the verse card, and
  64  |     // with it the Move button. Switch back to All to see the card again
  65  |     // before moving the verse into the now-existing folder.
  66  |     await page.getByRole('button', { name: 'All', exact: true }).click();
  67  |     await page.waitForTimeout(300);
  68  |     await page.getByTitle('Move').first().click();
  69  |     await page.getByRole('menuitem', { name: 'Study Notes' }).click();
  70  |     await page.waitForTimeout(500);
  71  | 
  72  |     // Filter to that folder and confirm the verse shows there.
  73  |     const folderTab = page.getByRole('button', { name: 'Study Notes', exact: true }).first();
  74  |     if (await folderTab.count()) {
  75  |       await folderTab.click();
  76  |       await assertNoOverflow(page, 'filtered to Study Notes folder');
  77  |       await expect(page.locator('body')).toContainText(/John/i);
  78  |     }
  79  | 
  80  |     const stored = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  81  |     expect(stored).toContain('Study Notes');
  82  |   });
  83  | });
  84  | 
  85  | test.describe('Select mode — bulk actions in the reader', () => {
  86  |   test.use({ viewport: { width: 393, height: 900 } });
  87  | 
  88  |   test.beforeEach(async ({ page }) => {
  89  |     await page.addInitScript(() => {
  90  |       try {
  91  |         localStorage.removeItem('kjb-saved-verses');
  92  |         localStorage.removeItem('kjb-verse-highlights');
  93  |       } catch {}
  94  |     });
  95  |     await page.goto('/read?book=JHN&chapter=3');
  96  |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  97  |     // Enter select mode via a verse's popover, then select a small range.
  98  |     await verseLocator(page, 16).click();
  99  |     const selectBtn = page.getByTitle('Select verses');
  100 |     await selectBtn.click();
  101 |     await verseLocator(page, 17).click().catch(() => {});
  102 |     await verseLocator(page, 18).click().catch(() => {});
  103 |   });
  104 | 
  105 |   test('bulk action bar renders with no overflow and shows a real selection count', async ({ page }) => {
  106 |     await assertNoOverflow(page, 'select mode action bar');
  107 |     await expect(page.locator('body')).toContainText(/selected/);
  108 |   });
  109 | 
  110 |   test('Copy (Passage) and Copy (Per Verse) do not throw', async ({ page }) => {
  111 |     const errors = [];
  112 |     page.on('pageerror', (e) => errors.push(e.message));
  113 | 
  114 |     await page.getByRole('button', { name: /^Copy/ }).click();
  115 |     await page.getByText('Copy (Passage)').click();
  116 |     await page.waitForTimeout(300);
  117 | 
  118 |     await page.getByRole('button', { name: /Copied!|^Copy/ }).click();
  119 |     const perVerseItem = page.getByText('Copy (Per Verse)');
  120 |     if (await perVerseItem.count()) {
  121 |       await perVerseItem.click();
  122 |       await page.waitForTimeout(300);
  123 |     }
  124 | 
  125 |     expect(errors, `errors during bulk copy:\n${errors.join('\n')}`).toEqual([]);
  126 |   });
  127 | 
  128 |   test('bulk Save persists all selected verses to localStorage', async ({ page }) => {
  129 |     await page.getByRole('button', { name: /^Save/ }).click();
  130 |     await page.waitForTimeout(500);
  131 |     const stored = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  132 |     expect(stored).toBeTruthy();
  133 |     const parsed = JSON.parse(stored);
  134 |     expect(parsed.length).toBeGreaterThanOrEqual(2);
  135 |   });
  136 | 
  137 |   test('bulk Highlight applies a color to the selection', async ({ page }) => {
  138 |     await page.getByRole('button', { name: /^Highlight/ }).click();
  139 |     const firstColor = page.getByRole('menuitem').first();
  140 |     await firstColor.waitFor({ state: 'visible', timeout: 5000 });
  141 |     await firstColor.click();
  142 |     await page.waitForTimeout(500);
  143 |     const stored = await page.evaluate(() => localStorage.getItem('kjb-verse-highlights'));
  144 |     expect(stored).toBeTruthy();
  145 |   });
  146 | 
  147 |   test('Print Full Page and Print Selected Verses do not throw (window.print stubbed)', async ({ page }) => {
  148 |     const errors = [];
  149 |     page.on('pageerror', (e) => errors.push(e.message));
  150 |     // window.print() would otherwise try to open a real OS print dialog,
  151 |     // which hangs a headless run — stub it to confirm the app's own code
  152 |     // around the call doesn't throw, without actually invoking print UI.
  153 |     await page.evaluate(() => { window.print = () => {}; });
  154 | 
> 155 |     await page.getByRole('button', { name: /^Print/ }).click();
      |                                                        ^ Error: locator.click: Error: strict mode violation: getByRole('button', { name: /^Print/ }) resolved to 2 elements:
  156 |     await page.getByText('Print Full Page').click();
  157 |     await page.waitForTimeout(300);
  158 | 
  159 |     await page.getByRole('button', { name: /^Print/ }).click();
  160 |     const printSelected = page.getByText('Print Selected Verses');
  161 |     if (await printSelected.count()) {
  162 |       await printSelected.click();
  163 |       await page.waitForTimeout(300);
  164 |     }
  165 | 
  166 |     expect(errors, `errors during print:\n${errors.join('\n')}`).toEqual([]);
  167 |   });
  168 | 
  169 |   test('Read Selected and Show Full Chapter change what is displayed', async ({ page }) => {
  170 |     await page.getByRole('button', { name: /Read Selected/ }).click();
  171 |     await page.waitForTimeout(500);
  172 |     await assertNoOverflow(page, 'after Read Selected');
  173 | 
  174 |     const showFullBtn = page.getByRole('button', { name: /Show Full Chapter/ });
  175 |     if (await showFullBtn.count()) {
  176 |       await showFullBtn.click();
  177 |       await page.waitForTimeout(500);
  178 |       await assertNoOverflow(page, 'after Show Full Chapter');
  179 |     }
  180 |   });
  181 | });
  182 | 
  183 | test.describe('Toolbar Print dropdown (outside select mode)', () => {
  184 |   test.use({ viewport: { width: 393, height: 900 } });
  185 | 
  186 |   test('opens and both print options run without throwing', async ({ page }) => {
  187 |     const errors = [];
  188 |     page.on('pageerror', (e) => errors.push(e.message));
  189 | 
  190 |     await page.goto('/read?book=GEN&chapter=1');
  191 |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  192 |     await page.evaluate(() => { window.print = () => {}; });
  193 | 
  194 |     const printBtn = page.getByTitle('Print');
  195 |     await printBtn.click();
  196 |     await assertNoOverflow(page, 'print dropdown open');
  197 | 
  198 |     await page.getByText('Print Full Page').click();
  199 |     await page.waitForTimeout(300);
  200 | 
  201 |     await printBtn.click();
  202 |     const contentsOption = page.locator('text=/Print .*Contents/');
  203 |     if (await contentsOption.count()) {
  204 |       await contentsOption.click();
  205 |       await page.waitForTimeout(300);
  206 |     }
  207 | 
  208 |     expect(errors, `errors during toolbar print:\n${errors.join('\n')}`).toEqual([]);
  209 |   });
  210 | });
  211 | 
  212 | test.describe('Download Bible — an actual export, not just the controls', () => {
  213 |   test('New Testament as .txt downloads a real, non-trivial file', async ({ page }) => {
  214 |     await page.goto('/settings');
  215 |     const expandAll = page.getByRole('button', { name: /expand all/i });
  216 |     if (await expandAll.count()) await expandAll.click();
  217 | 
  218 |     await page.getByRole('button', { name: 'New Test.', exact: true }).click();
  219 |     await page.getByRole('button', { name: 'Text', exact: true }).click();
  220 | 
  221 |     const downloadBtn = page.getByRole('button', { name: /Download Bible \(TXT\)/i });
  222 |     await downloadBtn.waitFor({ state: 'visible', timeout: 10000 });
  223 | 
  224 |     const [download] = await Promise.all([
  225 |       page.waitForEvent('download', { timeout: 60000 }),
  226 |       downloadBtn.click(),
  227 |     ]);
  228 | 
  229 |     const path = await download.path();
  230 |     expect(path, 'Download Bible did not produce a file').toBeTruthy();
  231 |     const fs = await import('fs/promises');
  232 |     const bytes = await fs.readFile(path);
  233 |     // New Testament as plain text should comfortably be several hundred KB.
  234 |     expect(bytes.length).toBeGreaterThan(100000);
  235 |   });
  236 | });
  237 | 
  238 | test.describe('About page — Statement of Faith accordions', () => {
  239 |   test.use({ viewport: { width: 393, height: 900 } });
  240 | 
  241 |   test('accordion sections open and close without overflow', async ({ page }) => {
  242 |     await page.goto('/about');
  243 |     await assertNoOverflow(page, 'about page initial');
  244 | 
  245 |     // Named accordion sections (AccordionSection title="...") — targeted by
  246 |     // their actual heading text rather than every button on the page, which
  247 |     // would also hit nav links and theme toggles.
  248 |     for (const title of ['Pagan Holidays & Traditions', 'Why I Am Not... Series']) {
  249 |       const header = page.getByText(title, { exact: true });
  250 |       if (await header.count()) {
  251 |         await header.click();
  252 |         await page.waitForTimeout(200);
  253 |         await assertNoOverflow(page, `about page: "${title}" expanded`);
  254 |         // Toggle closed again to leave state as found.
  255 |         await header.click();
```