# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: verse-actions.spec.js >> Verse actions [360px] >> tap verse, highlight it, then unhighlight — popover has no overflow
- Location: tests/verse-actions.spec.js:31:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTitle('Highlight')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByTitle('Highlight')

```

```yaml
- banner:
  - button "Back":
    - img
  - link "Home":
    - /url: /
    - img
  - img
  - textbox "Search..."
  - button "Toggle fullscreen":
    - img
  - button "Toggle theme":
    - img
  - button "Open menu":
    - img
- main:
  - button "John":
    - text: John
    - img
  - button "Ch.3":
    - text: Ch.3
    - img
  - button "Verse":
    - text: Verse
    - img
  - button "100%":
    - img
    - text: 100%
  - button "Font family":
    - img
  - button "Switch to paragraph":
    - img
  - button "Switch to two-column":
    - img
  - button "Select verses":
    - img
  - button "Share":
    - img
  - button "Print":
    - img
  - button:
    - img
  - button:
    - img
  - button "Exit fullscreen":
    - img
  - button "Hide header":
    - img
  - text: John 3:16
  - button "Highlight":
    - img
    - text: Highlight
    - img
  - button "Copy":
    - img
    - text: Copy
  - button "Share":
    - img
    - text: Share
  - button "Save":
    - img
    - text: Save
  - button "Close":
    - img
    - text: Close
  - heading "The Gospel According to Saint John" [level=1]
  - paragraph: Chapter 3
  - superscript: "1"
  - text: "T HERE was a man of the Pharisees, named Nicodemus, a ruler of the Jews:"
  - superscript: "2"
  - text: "The same came to Jesus by night, and said unto him, Rabbi, we know that thou art a teacher come from God: for no man can do these miracles that thou doest, except God be with him."
  - superscript: "3"
  - text: Jesus answered and said unto him, Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God.
  - superscript: "4"
  - text: Nicodemus saith unto him, How can a man be born when he is old? can he enter the second time into his mother's womb, and be born?
  - superscript: "5"
  - text: Jesus answered, Verily, verily, I say unto thee, Except a man be born of water and
  - emphasis: of
  - text: the Spirit, he cannot enter into the kingdom of God.
  - superscript: "6"
  - text: That which is born of the flesh is flesh; and that which is born of the Spirit is spirit.
  - superscript: "7"
  - text: Marvel not that I said unto thee, Ye must be born again.
  - superscript: "8"
  - text: "The wind bloweth where it listeth, and thou hearest the sound thereof, but canst not tell whence it cometh, and whither it goeth: so is every one that is born of the Spirit."
  - superscript: "9"
  - text: Nicodemus answered and said unto him, How can these things be?
  - superscript: "10"
  - text: Jesus answered and said unto him, Art thou a master of Israel, and knowest not these things?
  - superscript: "11"
  - text: Verily, verily, I say unto thee, We speak that we do know, and testify that we have seen; and ye receive not our witness.
  - superscript: "12"
  - text: If I have told you earthly things, and ye believe not, how shall ye believe, if I tell you
  - emphasis: of
  - text: heavenly things?
  - superscript: "13"
  - text: And no man hath ascended up to heaven, but he that came down from heaven,
  - emphasis: even
  - text: the Son of man which is in heaven.
  - superscript: "14"
  - text: "¶ And as Moses lifted up the serpent in the wilderness, even so must the Son of man be lifted up:"
  - superscript: "15"
  - text: That whosoever believeth in him should not perish, but have eternal life.
  - superscript: "16"
  - text: ¶ For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.
  - superscript: "17"
  - text: For God sent not his Son into the world to condemn the world; but that the world through him might be saved.
  - superscript: "18"
  - text: "¶ He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God."
  - superscript: "19"
  - text: And this is the condemnation, that light is come into the world, and men loved darkness rather than light, because their deeds were evil.
  - superscript: "20"
  - text: For every one that doeth evil hateth the light, neither cometh to the light, lest his deeds should be reproved.
  - superscript: "21"
  - text: But he that doeth truth cometh to the light, that his deeds may be made manifest, that they are wrought in God.
  - superscript: "22"
  - text: ¶ After these things came Jesus and his disciples into the land of Judæa; and there he tarried with them, and baptized.
  - superscript: "23"
  - text: "¶ And John also was baptizing in Ænon near to Salim, because there was much water there: and they came, and were baptized."
  - superscript: "24"
  - text: For John was not yet cast into prison.
  - superscript: "25"
  - text: ¶ Then there arose a question between
  - emphasis: some
  - text: of John's disciples and the Jews about purifying.
  - superscript: "26"
  - text: And they came unto John, and said unto him, Rabbi, he that was with thee beyond Jordan, to whom thou barest witness, behold, the same baptizeth, and all
  - emphasis: men
  - text: come to him.
  - superscript: "27"
  - text: John answered and said, A man can receive nothing, except it be given him from heaven.
  - superscript: "28"
  - text: Ye yourselves bear me witness, that I said, I am not the Christ, but that I am sent before him.
  - superscript: "29"
  - text: "He that hath the bride is the bridegroom: but the friend of the bridegroom, which standeth and heareth him, rejoiceth greatly because of the bridegroom's voice: this my joy therefore is fulfilled."
  - superscript: "30"
  - text: He must increase, but I
  - emphasis: must
  - text: decrease.
  - superscript: "31"
  - text: "He that cometh from above is above all: he that is of the earth is earthly, and speaketh of the earth: he that cometh from heaven is above all."
  - superscript: "32"
  - text: And what he hath seen and heard, that he testifieth; and no man receiveth his testimony.
  - superscript: "33"
  - text: He that hath received his testimony hath set to his seal that God is true.
  - superscript: "34"
  - text: "For he whom God hath sent speaketh the words of God: for God giveth not the Spirit by measure"
  - emphasis: unto him
  - text: .
  - superscript: "35"
  - text: The Father loveth the Son, and hath given all things into his hand.
  - superscript: "36"
  - text: "He that believeth on the Son hath everlasting life: and he that believeth not the Son shall not see life; but the wrath of God abideth on him."
  - button:
    - img
  - button:
    - img
- navigation:
  - button "Home":
    - img
    - text: Home
  - button "Contents":
    - img
    - text: Contents
  - button "Read":
    - img
    - text: Read
  - button "Gospel":
    - img
    - text: Gospel
  - button "Toggle navigation rows":
    - img
- button "Scroll to top":
  - img
- region "Notifications alt+T"
```

# Test source

```ts
  1   | /**
  2   |  * Verse action tests — tap a verse, use the popover (Highlight/Copy/Share/
  3   |  * Save/Select), verify Select mode's bulk action bar, and confirm the
  4   |  * Saved Verses page reflects saves and deletions correctly (round-trips
  5   |  * through real localStorage, not mocked).
  6   |  */
  7   | import { test, expect } from '@playwright/test';
  8   | import { checkOverflow } from './utils/overflow.js';
  9   | 
  10  | const WIDTHS = [360, 393];
  11  | const TOLERANCE_PX = 1.5;
  12  | 
  13  | async function assertNoOverflow(page, label) {
  14  |   const offenders = await page.evaluate(checkOverflow, TOLERANCE_PX);
  15  |   expect(offenders, `${label}: horizontal overflow:\n` + offenders.map((o) => `  <${o.tag}> "${o.text}" (over by ${o.overBy}px)`).join('\n')).toEqual([]);
  16  | }
  17  | 
  18  | for (const width of WIDTHS) {
  19  |   test.describe(`Verse actions [${width}px]`, () => {
  20  |     test.use({ viewport: { width, height: 900 } });
  21  | 
  22  |     test.beforeEach(async ({ page }) => {
  23  |       await page.addInitScript(() => {
  24  |         try {
  25  |           localStorage.removeItem('kjb-saved-verses');
  26  |           localStorage.removeItem('kjb-highlighted-verses');
  27  |         } catch {}
  28  |       });
  29  |     });
  30  | 
  31  |     test('tap verse, highlight it, then unhighlight — popover has no overflow', async ({ page }) => {
  32  |       await page.goto('/read?book=JHN&chapter=3');
  33  |       await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  34  | 
  35  |       await page.locator('#v16').click();
  36  |       const highlightBtn = page.getByTitle('Highlight');
> 37  |       await expect(highlightBtn).toBeVisible();
      |                                  ^ Error: expect(locator).toBeVisible() failed
  38  |       await assertNoOverflow(page, 'verse popover open');
  39  | 
  40  |       await highlightBtn.click();
  41  |       await expect(page.getByTitle('Unhighlight')).toBeVisible();
  42  | 
  43  |       await page.getByTitle('Unhighlight').click();
  44  |       await expect(page.getByTitle('Highlight')).toBeVisible();
  45  |     });
  46  | 
  47  |     test('copy and share actions do not throw', async ({ page }) => {
  48  |       const errors = [];
  49  |       page.on('pageerror', (e) => errors.push(e.message));
  50  | 
  51  |       await page.goto('/read?book=JHN&chapter=3');
  52  |       await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  53  |       await page.locator('#v16').click();
  54  | 
  55  |       await page.getByTitle('Copy').click();
  56  |       await page.waitForTimeout(300);
  57  | 
  58  |       await page.getByTitle('Share').click().catch(() => {});
  59  |       await page.waitForTimeout(300);
  60  | 
  61  |       expect(errors, `errors during copy/share:\n${errors.join('\n')}`).toEqual([]);
  62  |     });
  63  | 
  64  |     test('save a verse via the popover, see it on Saved Verses, then remove it', async ({ page }) => {
  65  |       await page.goto('/read?book=JHN&chapter=3');
  66  |       await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  67  | 
  68  |       await page.locator('#v16').click();
  69  |       await page.getByTitle('Save').click();
  70  | 
  71  |       const folderOption = page.locator('[role="menuitem"], button').filter({ hasText: /no folder|default|save/i }).first();
  72  |       if (await folderOption.count()) {
  73  |         await folderOption.click().catch(() => {});
  74  |       }
  75  | 
  76  |       await page.waitForTimeout(500);
  77  |       const saved = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  78  |       expect(saved, 'verse was not persisted after Save').toBeTruthy();
  79  | 
  80  |       await page.goto('/saved');
  81  |       await assertNoOverflow(page, 'saved verses list');
  82  |       await expect(page.locator('body')).toContainText(/John/i);
  83  | 
  84  |       const removeBtn = page.getByTitle('Remove').first();
  85  |       if (await removeBtn.count()) {
  86  |         await removeBtn.click();
  87  |         await page.waitForTimeout(300);
  88  |         const savedAfterRemove = await page.evaluate(() => localStorage.getItem('kjb-saved-verses'));
  89  |         const parsed = savedAfterRemove ? JSON.parse(savedAfterRemove) : [];
  90  |         expect(parsed.length, 'verse still present in storage after removing').toBe(0);
  91  |       }
  92  |     });
  93  | 
  94  |     test('select mode: multi-select verses and use the bulk action bar without overflow', async ({ page }) => {
  95  |       await page.goto('/read?book=JHN&chapter=3');
  96  |       await page.waitForSelector('.kjb-verse-text', { timeout: 15000 });
  97  | 
  98  |       await page.locator('#v16').click();
  99  |       const selectBtn = page.getByTitle('Select verses');
  100 |       if (await selectBtn.count()) {
  101 |         await selectBtn.click();
  102 |         await page.locator('#v17').click().catch(() => {});
  103 |         await page.locator('#v18').click().catch(() => {});
  104 |         await assertNoOverflow(page, 'select mode with multiple verses');
  105 | 
  106 |         const cancelBtn = page.getByRole('button', { name: /cancel|done|close/i }).first();
  107 |         if (await cancelBtn.count()) await cancelBtn.click().catch(() => {});
  108 |       }
  109 |     });
  110 |   });
  111 | }
  112 | 
```