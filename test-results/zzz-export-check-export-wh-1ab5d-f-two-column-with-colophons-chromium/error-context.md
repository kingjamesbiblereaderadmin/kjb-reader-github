# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: zzz-export-check.spec.js >> export whole bible pdf, two-column, with colophons
- Location: tests/zzz-export-check.spec.js:4:1

# Error details

```
TimeoutError: locator.waitFor: Timeout 15000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /^Two$/ }) to be visible

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
          - heading "Settings" [level=1] [ref=e28]
          - paragraph [ref=e29]: Customise your experience
          - button "Expand All" [ref=e31] [cursor=pointer]
        - generic [ref=e32]:
          - button [ref=e33] [cursor=pointer]:
            - generic [ref=e34]:
              - heading "Display" [level=2] [ref=e35]
              - paragraph [ref=e36]: Customise text size, zoom, font and rotation
          - generic [ref=e39]:
            - generic [ref=e41]:
              - generic [ref=e42]:
                - paragraph [ref=e43]: "Text Size: 100%"
                - paragraph [ref=e44]: Default size
              - generic [ref=e45]:
                - button "Decrease text size" [ref=e46] [cursor=pointer]
                - button "Increase text size" [ref=e50] [cursor=pointer]
            - generic [ref=e55]:
              - generic [ref=e56]:
                - paragraph [ref=e57]: "App Zoom: 100%"
                - paragraph [ref=e58]: Scales the whole app's layout on every page — not just the reader
              - generic [ref=e59]:
                - button "Decrease app zoom" [ref=e60] [cursor=pointer]
                - button "Increase app zoom" [ref=e64] [cursor=pointer]
            - generic [ref=e69]:
              - generic [ref=e74]:
                - paragraph [ref=e75]: Auto Rotate
                - paragraph [ref=e76]: Allow the screen to rotate with your device
              - switch [checked] [ref=e77] [cursor=pointer]
            - generic [ref=e78]:
              - paragraph [ref=e82]: Font Family
              - generic [ref=e83]:
                - button "Serif (Merriweather)" [ref=e84] [cursor=pointer]
                - button "Sans Serif (Inter)" [ref=e85] [cursor=pointer]
                - button "Mono" [ref=e86] [cursor=pointer]
                - button "Cursive" [ref=e87] [cursor=pointer]
                - button "Comic Sans" [ref=e88] [cursor=pointer]
                - button "Times New Roman" [ref=e89] [cursor=pointer]
        - generic [ref=e90]:
          - button [ref=e91] [cursor=pointer]:
            - generic [ref=e92]:
              - heading "Accessibility" [level=2] [ref=e93]
              - paragraph [ref=e94]: Reading fonts for the whole app
          - generic [ref=e97]:
            - paragraph [ref=e105]: Accessibility Font
            - paragraph [ref=e106]: Applies across the entire app — menus, pages, and scripture.
            - generic [ref=e107]:
              - button [ref=e108] [cursor=pointer]:
                - generic [ref=e109]:
                  - paragraph [ref=e110]: OpenDyslexic
                  - paragraph [ref=e111]: Designed for readers with dyslexia
              - button [ref=e112] [cursor=pointer]:
                - generic [ref=e113]:
                  - paragraph [ref=e114]: Atkinson Hyperlegible
                  - paragraph [ref=e115]: High legibility for low vision
        - generic [ref=e116]:
          - button [ref=e117] [cursor=pointer]:
            - generic [ref=e118]:
              - heading "Keyboard Shortcuts" [level=2] [ref=e119]
              - paragraph [ref=e120]: Quick keys for navigation and search
          - generic [ref=e123]:
            - generic [ref=e124]:
              - generic [ref=e125]:
                - generic [ref=e126]:
                  - generic [ref=e127]: Focus the search bar
                  - generic [ref=e128]:
                    - generic [ref=e129]: Ctrl
                    - generic [ref=e130]: F
                - generic [ref=e131]:
                  - generic [ref=e132]: Go back
                  - generic [ref=e133]:
                    - generic [ref=e134]: Alt
                    - generic [ref=e135]: ←
                - generic [ref=e136]:
                  - generic [ref=e137]: Go to Home
                  - generic [ref=e138]:
                    - generic [ref=e139]: Alt
                    - generic [ref=e140]: H
                - generic [ref=e141]:
                  - generic [ref=e142]: Show keyboard shortcuts
                  - generic [ref=e143]: "?"
              - generic [ref=e145]:
                - paragraph [ref=e146]: Search results
                - generic [ref=e147]:
                  - generic [ref=e148]: Navigate verses & book headers
                  - generic [ref=e149]:
                    - generic [ref=e150]: ↑
                    - generic [ref=e151]: ↓
                - generic [ref=e152]:
                  - generic [ref=e153]: Navigate verses & book headers
                  - generic [ref=e154]:
                    - generic [ref=e155]: J
                    - generic [ref=e156]: K
                - generic [ref=e157]:
                  - generic [ref=e158]: Open a verse · collapse / expand a book
                  - generic [ref=e159]: Enter
            - button "Open Shortcuts Overlay" [ref=e161] [cursor=pointer]
        - generic [ref=e164]:
          - button [ref=e165] [cursor=pointer]:
            - generic [ref=e166]:
              - heading "Appearance" [level=2] [ref=e167]
              - paragraph [ref=e168]: Customise the look and feel
          - generic [ref=e171]:
            - generic [ref=e172]:
              - heading "Theme" [level=3] [ref=e173]
              - generic [ref=e174]:
                - button "☀️ Light" [ref=e175] [cursor=pointer]
                - button "🌙 Dark" [ref=e176] [cursor=pointer]
                - button "🕐 Auto" [ref=e177] [cursor=pointer]
                - button "📱 System" [ref=e178] [cursor=pointer]
              - paragraph [ref=e179]: "📱 System: follows your device setting"
            - generic [ref=e181]:
              - heading "Theme Colour" [level=3] [ref=e182]
              - generic [ref=e189]:
                - button "Indigo" [ref=e190] [cursor=pointer]
                - button "Sapphire" [ref=e193] [cursor=pointer]
                - button "Sky" [ref=e196] [cursor=pointer]
                - button "Teal" [ref=e199] [cursor=pointer]
                - button "Forest" [ref=e202] [cursor=pointer]
                - button "Amethyst" [ref=e205] [cursor=pointer]
                - button "Rose" [ref=e208] [cursor=pointer]
                - button "Crimson" [ref=e211] [cursor=pointer]
                - button "Amber" [ref=e214] [cursor=pointer]
                - button "Gold Leaf" [ref=e217] [cursor=pointer]
                - button "Burgundy" [ref=e220] [cursor=pointer]
                - button "Slate" [ref=e223] [cursor=pointer]
                - button "Antique" [ref=e226] [cursor=pointer]
                - generic "Custom colour" [ref=e229] [cursor=pointer]:
                  - textbox "Custom" [ref=e231]: "#b8860b"
                  - generic [ref=e232]: Custom
        - generic [ref=e233]:
          - button [ref=e234] [cursor=pointer]:
            - generic [ref=e235]:
              - heading "Offline Library" [level=2] [ref=e236]
              - paragraph [ref=e237]: Not available in preview mode
          - paragraph [ref=e242]:
            - generic [ref=e245]: Offline downloads are not available in private/incognito mode. The cache would be deleted when you close the private window. Open this app in a normal window to download the Bible for offline reading.
        - button [active] [ref=e247] [cursor=pointer]:
          - generic [ref=e248]:
            - heading "Download Bible" [level=2] [ref=e249]
            - paragraph [ref=e250]: Whole Bible with layout options
        - generic [ref=e253]:
          - button [ref=e254] [cursor=pointer]:
            - generic [ref=e255]:
              - heading "Old Browser & Offline Options" [level=2] [ref=e256]
              - paragraph [ref=e257]: Standalone HTML file and Legacy Reader for IE & old devices
          - generic [ref=e260]:
            - generic [ref=e261]:
              - paragraph [ref=e262]: Download the entire King James Bible as a single, self-contained HTML file (all 66 books, plus Gospel, Resources and About). It needs no internet, no app and no JavaScript — perfect for very old computers and browsers, or for hosting on your own website.
              - button "Download HTML File" [ref=e263] [cursor=pointer]
              - generic [ref=e267]:
                - paragraph [ref=e274]: How to use it
                - list [ref=e275]:
                  - listitem [ref=e276]: Tap Download HTML File above and save it to your device.
                  - listitem [ref=e277]: Open the saved file by double-tapping it — it opens in any web browser, even offline.
                  - listitem [ref=e278]: Use the quick links at the top to jump to any book, chapter, or the Gospel.
                  - listitem [ref=e279]: To keep it handy, bookmark it or save it to your Home Screen / Desktop.
                - paragraph [ref=e283]: About 6 MB. You can rename it to index.html and upload it to any web host to share it as a website.
            - link [ref=e285] [cursor=pointer]:
              - /url: /legacy
              - generic [ref=e290]:
                - paragraph [ref=e291]: Open Legacy Reader
                - paragraph [ref=e292]: Tested on Internet Explorer 11 / Windows 8.1. Old iOS, macOS, and Android are untested — email kingjamesbiblereader@outlook.sg to report any issues.
        - generic [ref=e297]:
          - button [ref=e298] [cursor=pointer]:
            - generic [ref=e299]:
              - heading "App Info" [level=2] [ref=e300]
              - paragraph [ref=e301]: Version and features
          - generic [ref=e304]:
            - generic [ref=e309]:
              - paragraph [ref=e310]: Automatic Updates
              - paragraph [ref=e311]: This app connects to the internet in the background to automatically apply new features, typo corrections, and security fixes. You never have to refresh manually!
            - generic [ref=e312]:
              - generic [ref=e313]:
                - generic [ref=e314]: Bible Text
                - generic [ref=e315]: King James Bible (PCE)
              - generic [ref=e316]:
                - generic [ref=e317]: Last Updated
                - generic [ref=e318]: September 4th, 2026
              - generic [ref=e319]:
                - generic [ref=e320]: Offline Support
                - generic [ref=e321]: Unavailable
              - generic [ref=e324]:
                - generic [ref=e325]: PWA Status
                - generic [ref=e326]: Browser
              - generic [ref=e329]:
                - generic [ref=e330]: Theme
                - generic [ref=e331]: 📱 System
            - generic [ref=e332]:
              - generic [ref=e336]: "Admin Access:"
              - button "Sign In" [ref=e337] [cursor=pointer]
            - generic [ref=e339]:
              - generic [ref=e343]:
                - paragraph [ref=e344]: Startup Diagnostics
                - paragraph [ref=e345]: Shows a small on-screen debug button at launch, for troubleshooting
              - switch [ref=e346] [cursor=pointer]
            - generic [ref=e347]:
              - button "Reset All Settings" [ref=e348] [cursor=pointer]
              - button "Clear Cache & Reload" [ref=e352] [cursor=pointer]
        - link [ref=e356] [cursor=pointer]:
          - /url: /credits
          - generic [ref=e358]:
            - heading "About & Credits" [level=2] [ref=e359]
            - paragraph [ref=e360]: Attributions, licences and acknowledgements
        - generic [ref=e363]:
          - button [ref=e364] [cursor=pointer]:
            - generic [ref=e365]:
              - heading "Contact & Feedback" [level=2] [ref=e366]
              - paragraph [ref=e367]: Report bugs or share feedback
          - generic [ref=e370]:
            - button [ref=e371] [cursor=pointer]:
              - generic [ref=e375]:
                - paragraph [ref=e376]: Privacy Policy
                - paragraph [ref=e377]: How your data is handled
            - button [ref=e382] [cursor=pointer]:
              - generic [ref=e387]:
                - paragraph [ref=e388]: Terms of Service
                - paragraph [ref=e389]: View our terms
            - generic [ref=e394]:
              - link [ref=e395] [cursor=pointer]:
                - /url: https://godisgracious1031ministriescom.odoo.com/
                - generic [ref=e400]:
                  - paragraph [ref=e401]: God is Gracious 1031 Ministries
                  - paragraph [ref=e402]: Ministry Website
              - link [ref=e407] [cursor=pointer]:
                - /url: https://youtube.com/@shawnr325av?si=zC_gQm4I2S_xj-NS
                - generic [ref=e412]:
                  - paragraph [ref=e413]: YouTube
                  - paragraph [ref=e414]: "@shawnr325av"
              - link [ref=e419] [cursor=pointer]:
                - /url: https://rumble.com/user/Godisgracious1031
                - generic [ref=e424]:
                  - paragraph [ref=e425]: Rumble
                  - paragraph [ref=e426]: Godisgracious1031
              - link [ref=e431] [cursor=pointer]:
                - /url: https://www.tiktok.com/@svdbyfaithinr325av
                - generic [ref=e435]:
                  - paragraph [ref=e436]: TikTok
                  - paragraph [ref=e437]: "@svdbyfaithinr325av"
              - link [ref=e442] [cursor=pointer]:
                - /url: https://www.instagram.com/svdbyfaithinhisbloodr325av/
                - generic [ref=e446]:
                  - paragraph [ref=e447]: Instagram
                  - paragraph [ref=e448]: "@svdbyfaithinhisbloodr325av"
              - link [ref=e453] [cursor=pointer]:
                - /url: https://discord.com/users/faithinhisbloodr325av
                - generic [ref=e457]:
                  - paragraph [ref=e458]: Discord
                  - paragraph [ref=e459]: faithinhisbloodr325av
              - link [ref=e464] [cursor=pointer]:
                - /url: https://linktr.ee/shawnr325av
                - generic [ref=e468]:
                  - paragraph [ref=e469]: Linktree
                  - paragraph [ref=e470]: linktr.ee/shawnr325av
              - link [ref=e475] [cursor=pointer]:
                - /url: mailto:kingjamesbiblereader@outlook.sg
                - generic [ref=e480]:
                  - paragraph [ref=e481]: Email
                  - paragraph [ref=e482]: kingjamesbiblereader@outlook.sg
    - contentinfo [ref=e487]:
      - generic [ref=e488]:
        - button [ref=e490] [cursor=pointer]
        - generic [ref=e493]:
          - link "Home" [ref=e494] [cursor=pointer]:
            - /url: /
          - link "Contents" [ref=e498] [cursor=pointer]:
            - /url: /contents
          - link "Read" [ref=e500] [cursor=pointer]:
            - /url: /read
          - link "Gospel" [ref=e503] [cursor=pointer]:
            - /url: /gospel
          - link "Resources" [ref=e506] [cursor=pointer]:
            - /url: /resources
          - link "Saved" [ref=e509] [cursor=pointer]:
            - /url: /saved
          - link "About" [ref=e512] [cursor=pointer]:
            - /url: /about
          - link "Settings" [ref=e515] [cursor=pointer]:
            - /url: /settings
        - paragraph [ref=e519]:
          - text: Bible text from
          - link "bibleprotector.com" [ref=e520] [cursor=pointer]:
            - /url: https://bibleprotector.com
          - text: · Created with
          - link "Base44" [ref=e521] [cursor=pointer]:
            - /url: https://base44.com
        - paragraph [ref=e522]:
          - link "Privacy" [ref=e523] [cursor=pointer]:
            - /url: /privacy
          - text: ·
          - link "Terms" [ref=e524] [cursor=pointer]:
            - /url: /terms
          - text: ·
          - link "Changelog" [ref=e525] [cursor=pointer]:
            - /url: /extension/change-log
          - text: ·
          - link "Contact" [ref=e526] [cursor=pointer]:
            - /url: /contact
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test } from '@playwright/test';
  2  | import fs from 'fs/promises';
  3  | 
  4  | test('export whole bible pdf, two-column, with colophons', async ({ page }) => {
  5  |   test.setTimeout(180000);
  6  |   await page.goto('/settings');
  7  |   const header = page.getByText('Download Bible', { exact: false }).first();
  8  |   await header.click().catch(() => {});
  9  |   const twoBtn = page.getByRole('button', { name: /^Two$/ });
> 10 |   await twoBtn.waitFor({ timeout: 15000 });
     |                ^ TimeoutError: locator.waitFor: Timeout 15000ms exceeded.
  11 |   await twoBtn.click();
  12 | 
  13 |   const dlBtn = page.getByRole('button', { name: /Download Bible \(PDF\)/ });
  14 |   const [download] = await Promise.all([
  15 |     page.waitForEvent('download', { timeout: 150000 }),
  16 |     dlBtn.click(),
  17 |   ]);
  18 |   const p = await download.path();
  19 |   await fs.copyFile(p, '/tmp/whole-bible-export.pdf');
  20 |   console.log('SAVED_TO:/tmp/whole-bible-export.pdf');
  21 | });
  22 | 
```