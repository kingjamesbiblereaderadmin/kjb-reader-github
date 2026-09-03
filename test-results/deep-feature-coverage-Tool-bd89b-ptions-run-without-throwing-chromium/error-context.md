# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: deep-feature-coverage.spec.js >> Toolbar Print dropdown (outside select mode) >> opens and both print options run without throwing
- Location: tests/deep-feature-coverage.spec.js:191:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByText('Print Full Page')

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
          - button "Font family" [ref=e47] [cursor=pointer]
          - button "Switch to paragraph" [ref=e50] [cursor=pointer]
          - button "Switch to two-column" [ref=e52] [cursor=pointer]
          - button "Select verses" [ref=e54] [cursor=pointer]
          - button "Share" [ref=e58] [cursor=pointer]
          - button "Print" [ref=e65] [cursor=pointer]
          - generic [ref=e70]:
            - button [ref=e71] [cursor=pointer]
            - button [ref=e74] [cursor=pointer]
          - generic [ref=e77]:
            - button "Exit fullscreen" [ref=e78] [cursor=pointer]
            - button "Hide header" [ref=e84] [cursor=pointer]
        - generic [ref=e87]:
          - heading "The First Book of Moses, called Genesis" [level=1] [ref=e88]
          - paragraph [ref=e89]: Chapter 1
        - generic [ref=e91]:
          - generic [ref=e93] [cursor=pointer]:
            - superscript: "1"
            - generic [ref=e95]:
              - generic [ref=e96]: I
              - text: N the beginning God created the heaven and the earth.
          - generic [ref=e99] [cursor=pointer]:
            - superscript: "2"
            - generic [ref=e102]:
              - text: And the earth was without form, and void; and darkness
              - emphasis [ref=e103]: was
              - text: upon the face of the deep. And the Spirit of God moved upon the face of the waters.
          - generic [ref=e105] [cursor=pointer]:
            - superscript: "3"
            - generic [ref=e106]: "And God said, Let there be light: and there was light."
          - generic [ref=e109] [cursor=pointer]:
            - superscript: "4"
            - generic [ref=e112]:
              - text: And God saw the light, that
              - emphasis [ref=e113]: it was
              - text: "good: and God divided the light from the darkness."
          - generic [ref=e115] [cursor=pointer]:
            - superscript: "5"
            - generic [ref=e116]: And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.
          - generic [ref=e119] [cursor=pointer]:
            - superscript: "6"
            - generic [ref=e120]: ¶ And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.
          - generic [ref=e124] [cursor=pointer]:
            - superscript: "7"
            - generic [ref=e127]:
              - text: And God made the firmament, and divided the waters which
              - emphasis [ref=e128]: were
              - text: under the firmament from the waters which
              - emphasis [ref=e129]: were
              - text: "above the firmament: and it was so."
          - generic [ref=e131] [cursor=pointer]:
            - superscript: "8"
            - generic [ref=e132]: And God called the firmament Heaven.
          - generic [ref=e135] [cursor=pointer]:
            - superscript: "9"
            - generic [ref=e138]:
              - text: ¶ And God said, Let the waters under the heaven be gathered together unto one place, and let the dry
              - emphasis [ref=e139]: land
              - text: "appear: and it was so."
          - generic [ref=e141] [cursor=pointer]:
            - superscript: "10"
            - generic [ref=e144]:
              - text: And God called the dry
              - emphasis [ref=e145]: land
              - text: "Earth; and the gathering together of the waters called he Seas: and God saw that"
              - emphasis [ref=e146]: it was
              - text: good.
          - generic [ref=e148] [cursor=pointer]:
            - superscript: "11"
            - generic [ref=e151]:
              - text: And God said, Let the earth bring forth grass, the herb yielding seed,
              - emphasis [ref=e152]: and
              - text: the fruit tree yielding fruit after his kind, whose seed
              - emphasis [ref=e153]: is
              - text: "in itself, upon the earth: and it was so."
          - generic [ref=e155] [cursor=pointer]:
            - superscript: "12"
            - generic [ref=e158]:
              - text: And the earth brought forth grass,
              - emphasis [ref=e159]: and
              - text: herb yielding seed after his kind, and the tree yielding fruit, whose seed
              - emphasis [ref=e160]: was
              - text: "in itself, after his kind: and God saw that"
              - emphasis [ref=e161]: it was
              - text: good.
          - generic [ref=e163] [cursor=pointer]:
            - superscript: "13"
            - generic [ref=e164]: And the evening and the morning were the third day.
          - generic [ref=e167] [cursor=pointer]:
            - superscript: "14"
            - generic [ref=e168]: "¶ And God said, Let there be lights in the firmament of the heaven to divide the day from the night; and let them be for signs, and for seasons, and for days, and years:"
          - generic [ref=e172] [cursor=pointer]:
            - superscript: "15"
            - generic [ref=e173]: "And let them be for lights in the firmament of the heaven to give light upon the earth: and it was so."
          - generic [ref=e176] [cursor=pointer]:
            - superscript: "16"
            - generic [ref=e179]:
              - text: "And God made two great lights; the greater light to rule the day, and the lesser light to rule the night:"
              - emphasis [ref=e180]: he made
              - text: the stars also.
          - generic [ref=e182] [cursor=pointer]:
            - superscript: "17"
            - generic [ref=e183]: And God set them in the firmament of the heaven to give light upon the earth,
          - generic [ref=e186] [cursor=pointer]:
            - superscript: "18"
            - generic [ref=e189]:
              - text: "And to rule over the day and over the night, and to divide the light from the darkness: and God saw that"
              - emphasis [ref=e190]: it was
              - text: good.
          - generic [ref=e192] [cursor=pointer]:
            - superscript: "19"
            - generic [ref=e193]: And the evening and the morning were the fourth day.
          - generic [ref=e196] [cursor=pointer]:
            - superscript: "20"
            - generic [ref=e199]:
              - text: And God said, Let the waters bring forth abundantly the moving creature that hath life, and fowl
              - emphasis [ref=e200]: that
              - text: may fly above the earth in the open firmament of heaven.
          - generic [ref=e202] [cursor=pointer]:
            - superscript: "21"
            - generic [ref=e205]:
              - text: "And God created great whales, and every living creature that moveth, which the waters brought forth abundantly, after their kind, and every winged fowl after his kind: and God saw that"
              - emphasis [ref=e206]: it was
              - text: good.
          - generic [ref=e208] [cursor=pointer]:
            - superscript: "22"
            - generic [ref=e209]: And God blessed them, saying, Be fruitful, and multiply, and fill the waters in the seas, and let fowl multiply in the earth.
          - generic [ref=e212] [cursor=pointer]:
            - superscript: "23"
            - generic [ref=e213]: And the evening and the morning were the fifth day.
          - generic [ref=e216] [cursor=pointer]:
            - superscript: "24"
            - generic [ref=e217]: "¶ And God said, Let the earth bring forth the living creature after his kind, cattle, and creeping thing, and beast of the earth after his kind: and it was so."
          - generic [ref=e221] [cursor=pointer]:
            - superscript: "25"
            - generic [ref=e224]:
              - text: "And God made the beast of the earth after his kind, and cattle after their kind, and every thing that creepeth upon the earth after his kind: and God saw that"
              - emphasis [ref=e225]: it was
              - text: good.
          - generic [ref=e227] [cursor=pointer]:
            - superscript: "26"
            - generic [ref=e228]: "¶ And God said, Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the fowl of the air, and over the cattle, and over all the earth, and over every creeping thing that creepeth upon the earth."
          - generic [ref=e232] [cursor=pointer]:
            - superscript: "27"
            - generic [ref=e235]:
              - text: So God created man in his
              - emphasis [ref=e236]: own
              - text: image, in the image of God created he him; male and female created he them.
          - generic [ref=e238] [cursor=pointer]:
            - superscript: "28"
            - generic [ref=e239]: "And God blessed them, and God said unto them, Be fruitful, and multiply, and replenish the earth, and subdue it: and have dominion over the fish of the sea, and over the fowl of the air, and over every living thing that moveth upon the earth."
          - generic [ref=e242] [cursor=pointer]:
            - superscript: "29"
            - generic [ref=e245]:
              - text: ¶ And God said, Behold, I have given you every herb bearing seed, which
              - emphasis [ref=e246]: is
              - text: upon the face of all the earth, and every tree, in the which
              - emphasis [ref=e247]: is
              - text: the fruit of a tree yielding seed; to you it shall be for meat.
          - generic [ref=e249] [cursor=pointer]:
            - superscript: "30"
            - generic [ref=e252]:
              - text: And to every beast of the earth, and to every fowl of the air, and to every thing that creepeth upon the earth, wherein
              - emphasis [ref=e253]: there is
              - text: life,
              - emphasis [ref=e254]: I have given
              - text: "every green herb for meat: and it was so."
          - generic [ref=e256] [cursor=pointer]:
            - superscript: "31"
            - generic [ref=e259]:
              - text: And God saw every thing that he had made, and, behold,
              - emphasis [ref=e260]: it was
              - text: very good. And the evening and the morning were the sixth day.
        - generic [ref=e261]:
          - button [ref=e262] [cursor=pointer]
          - button [ref=e265] [cursor=pointer]
    - navigation [ref=e268]:
      - generic [ref=e270]:
        - button "Home" [ref=e271] [cursor=pointer]
        - button "Contents" [ref=e276] [cursor=pointer]
        - button "Read" [ref=e279] [cursor=pointer]
        - button "Gospel" [ref=e284] [cursor=pointer]
        - button "Toggle navigation rows" [ref=e288] [cursor=pointer]
  - region "Notifications alt+T"
```

# Test source

```ts
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
  155 |     // Two "Print" buttons coexist here: the sticky toolbar's standalone
  156 |     // print button, and the select-mode action bar's Print dropdown
  157 |     // trigger. Scope to the select bar's one specifically, since it's the
  158 |     // one under test.
  159 |     const selectBarPrint = page.getByRole('button', { name: /^Print/ }).last();
  160 |     await selectBarPrint.click();
  161 |     await page.getByText('Print Full Page').click();
  162 |     await page.waitForTimeout(300);
  163 | 
  164 |     await selectBarPrint.click();
  165 |     const printSelected = page.getByText('Print Selected Verses');
  166 |     if (await printSelected.count()) {
  167 |       await printSelected.click();
  168 |       await page.waitForTimeout(300);
  169 |     }
  170 | 
  171 |     expect(errors, `errors during print:\n${errors.join('\n')}`).toEqual([]);
  172 |   });
  173 | 
  174 |   test('Read Selected and Show Full Chapter change what is displayed', async ({ page }) => {
  175 |     await page.getByRole('button', { name: /Read Selected/ }).click();
  176 |     await page.waitForTimeout(500);
  177 |     await assertNoOverflow(page, 'after Read Selected');
  178 | 
  179 |     const showFullBtn = page.getByRole('button', { name: /Show Full Chapter/ });
  180 |     if (await showFullBtn.count()) {
  181 |       await showFullBtn.click();
  182 |       await page.waitForTimeout(500);
  183 |       await assertNoOverflow(page, 'after Show Full Chapter');
  184 |     }
  185 |   });
  186 | });
  187 | 
  188 | test.describe('Toolbar Print dropdown (outside select mode)', () => {
  189 |   test.use({ viewport: { width: 393, height: 900 } });
  190 | 
  191 |   test('opens and both print options run without throwing', async ({ page }) => {
  192 |     const errors = [];
  193 |     page.on('pageerror', (e) => errors.push(e.message));
  194 | 
  195 |     await page.goto('/read?book=GEN&chapter=1');
  196 |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  197 |     await page.evaluate(() => { window.print = () => {}; });
  198 | 
  199 |     const printBtn = page.getByTitle('Print');
  200 |     await printBtn.click();
  201 |     await assertNoOverflow(page, 'print dropdown open');
  202 | 
> 203 |     await page.getByText('Print Full Page').click();
      |                                             ^ Error: locator.click: Test timeout of 30000ms exceeded.
  204 |     await page.waitForTimeout(300);
  205 | 
  206 |     await printBtn.click();
  207 |     const contentsOption = page.locator('text=/Print .*Contents/');
  208 |     if (await contentsOption.count()) {
  209 |       await contentsOption.click();
  210 |       await page.waitForTimeout(300);
  211 |     }
  212 | 
  213 |     expect(errors, `errors during toolbar print:\n${errors.join('\n')}`).toEqual([]);
  214 |   });
  215 | });
  216 | 
  217 | test.describe('Download Bible — an actual export, not just the controls', () => {
  218 |   test('New Testament as .txt downloads a real, non-trivial file', async ({ page }) => {
  219 |     await page.goto('/settings');
  220 |     const expandAll = page.getByRole('button', { name: /expand all/i });
  221 |     if (await expandAll.count()) await expandAll.click();
  222 | 
  223 |     await page.getByRole('button', { name: 'New Test.', exact: true }).click();
  224 |     await page.getByRole('button', { name: 'Text', exact: true }).click();
  225 | 
  226 |     const downloadBtn = page.getByRole('button', { name: /Download Bible \(TXT\)/i });
  227 |     await downloadBtn.waitFor({ state: 'visible', timeout: 10000 });
  228 | 
  229 |     const [download] = await Promise.all([
  230 |       page.waitForEvent('download', { timeout: 60000 }),
  231 |       downloadBtn.click(),
  232 |     ]);
  233 | 
  234 |     const path = await download.path();
  235 |     expect(path, 'Download Bible did not produce a file').toBeTruthy();
  236 |     const fs = await import('fs/promises');
  237 |     const bytes = await fs.readFile(path);
  238 |     // New Testament as plain text should comfortably be several hundred KB.
  239 |     expect(bytes.length).toBeGreaterThan(100000);
  240 |   });
  241 | });
  242 | 
  243 | test.describe('About page — Statement of Faith accordions', () => {
  244 |   test.use({ viewport: { width: 393, height: 900 } });
  245 | 
  246 |   test('accordion sections open and close without overflow', async ({ page }) => {
  247 |     await page.goto('/about');
  248 |     await assertNoOverflow(page, 'about page initial');
  249 | 
  250 |     // Named accordion sections (AccordionSection title="...") — targeted by
  251 |     // their actual heading text rather than every button on the page, which
  252 |     // would also hit nav links and theme toggles.
  253 |     for (const title of ['Pagan Holidays & Traditions', 'Why I Am Not... Series']) {
  254 |       const header = page.getByText(title, { exact: true });
  255 |       if (await header.count()) {
  256 |         await header.click();
  257 |         await page.waitForTimeout(200);
  258 |         await assertNoOverflow(page, `about page: "${title}" expanded`);
  259 |         // Toggle closed again to leave state as found.
  260 |         await header.click();
  261 |         await page.waitForTimeout(200);
  262 |       }
  263 |     }
  264 |   });
  265 | });
  266 | 
```