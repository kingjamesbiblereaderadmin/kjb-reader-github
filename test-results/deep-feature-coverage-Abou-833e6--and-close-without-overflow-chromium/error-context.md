# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: deep-feature-coverage.spec.js >> About page — Statement of Faith accordions >> accordion sections open and close without overflow
- Location: tests/deep-feature-coverage.spec.js:241:3

# Error details

```
Error: locator.click: Error: strict mode violation: getByText('Why I Am Not... Series', { exact: true }) resolved to 2 elements:
    1) <h3 class="font-serif text-lg font-semibold text-foreground">Why I Am Not... Series</h3> aka getByRole('button', { name: 'Why I Am Not... Series' })
    2) <p translate="no" class="notranslate font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors truncate">Why I Am Not... Series</p> aka getByRole('link', { name: 'Why I Am Not... Series 7-' })

Call log:
  - waiting for getByText('Why I Am Not... Series', { exact: true })

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
          - generic [ref=e65]:
            - button [active] [ref=e66] [cursor=pointer]:
              - heading "Why I Am Not... Series" [level=3] [ref=e67]
            - generic [ref=e70]:
              - paragraph [ref=e71]: I reject Catholicism, Calvinism, Pentecostalism, Church of God, Mormonism, Jehovah's Witnesses, etc. This video series by Robert Breaker examines why various religious movements depart from the truth of scripture.
              - link [ref=e72] [cursor=pointer]:
                - /url: https://youtube.com/playlist?list=PLNGhZnJavRf293XCMldBgwRpQ4U1o8uEf&si=U518NbpNw7HhaCBx
                - generic [ref=e77]:
                  - paragraph [ref=e78]: Why I Am Not... Series
                  - paragraph [ref=e79]: 7-video playlist · Robert Breaker
        - generic [ref=e84]:
          - heading "Links & Contact" [level=2] [ref=e85]
          - generic [ref=e86]:
            - link [ref=e87] [cursor=pointer]:
              - /url: https://godisgracious1031ministriescom.odoo.com/
              - generic [ref=e92]:
                - paragraph [ref=e93]: God is Gracious 1031 Ministries
                - paragraph [ref=e94]: Ministry Website
            - link [ref=e99] [cursor=pointer]:
              - /url: https://youtube.com/@shawnr325av?si=zC_gQm4I2S_xj-NS
              - generic [ref=e104]:
                - paragraph [ref=e105]: YouTube
                - paragraph [ref=e106]: "@shawnr325av"
            - link [ref=e111] [cursor=pointer]:
              - /url: https://rumble.com/user/Godisgracious1031
              - generic [ref=e116]:
                - paragraph [ref=e117]: Rumble
                - paragraph [ref=e118]: Godisgracious1031
            - link [ref=e123] [cursor=pointer]:
              - /url: https://www.tiktok.com/@svdbyfaithinr325av
              - generic [ref=e127]:
                - paragraph [ref=e128]: TikTok
                - paragraph [ref=e129]: "@svdbyfaithinr325av"
            - link [ref=e134] [cursor=pointer]:
              - /url: https://www.instagram.com/svdbyfaithinhisbloodr325av/
              - generic [ref=e138]:
                - paragraph [ref=e139]: Instagram
                - paragraph [ref=e140]: "@svdbyfaithinhisbloodr325av"
            - link [ref=e145] [cursor=pointer]:
              - /url: https://discord.com/users/faithinhisbloodr325av
              - generic [ref=e149]:
                - paragraph [ref=e150]: Discord
                - paragraph [ref=e151]: faithinhisbloodr325av
            - link [ref=e156] [cursor=pointer]:
              - /url: https://linktr.ee/shawnr325av
              - generic [ref=e160]:
                - paragraph [ref=e161]: Linktree
                - paragraph [ref=e162]: linktr.ee/shawnr325av
            - link [ref=e167] [cursor=pointer]:
              - /url: mailto:kingjamesbiblereader@outlook.sg
              - generic [ref=e172]:
                - paragraph [ref=e173]: Email
                - paragraph [ref=e174]: kingjamesbiblereader@outlook.sg
    - navigation [ref=e179]:
      - generic [ref=e181]:
        - button "Home" [ref=e182] [cursor=pointer]
        - button "Contents" [ref=e187] [cursor=pointer]
        - button "Read" [ref=e190] [cursor=pointer]
        - button "Gospel" [ref=e194] [cursor=pointer]
        - button "Toggle navigation rows" [ref=e198] [cursor=pointer]
  - region "Notifications alt+T"
```

# Test source

```ts
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
  188 | test.describe('Toolbar Print button (outside select mode)', () => {
  189 |   test.use({ viewport: { width: 393, height: 900 } });
  190 | 
  191 |   test('triggers printChapterContents without throwing', async ({ page }) => {
  192 |     // Unlike the select-mode action bar (a real dropdown with two options,
  193 |     // covered above), the standalone toolbar Print button is a single
  194 |     // direct action — it calls printChapterContents() straight from
  195 |     // onClick. There's no dropdown to open here (PrintDropdown.jsx exists
  196 |     // in the codebase but isn't actually wired up to this button).
  197 |     const errors = [];
  198 |     page.on('pageerror', (e) => errors.push(e.message));
  199 | 
  200 |     await page.goto('/read?book=GEN&chapter=1');
  201 |     await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  202 |     await page.evaluate(() => { window.print = () => {}; });
  203 | 
  204 |     await page.getByTitle('Print').click();
  205 |     await page.waitForTimeout(500);
  206 |     await assertNoOverflow(page, 'after triggering print');
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
> 255 |         await header.click();
      |                      ^ Error: locator.click: Error: strict mode violation: getByText('Why I Am Not... Series', { exact: true }) resolved to 2 elements:
  256 |         await page.waitForTimeout(200);
  257 |       }
  258 |     }
  259 |   });
  260 | });
  261 | 
```