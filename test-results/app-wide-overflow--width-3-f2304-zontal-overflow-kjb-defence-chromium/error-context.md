# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 320px] >> no horizontal overflow: /kjb-defence
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /kjb-defence @ 320px overflows horizontally by 0px:
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
      - generic [ref=e22]:
        - generic [ref=e23]:
          - heading "KJB Defence" [level=1] [ref=e27]
          - paragraph [ref=e28]: Resources defending the King James Bible as the preserved, infallible Word of God — and exposing the corruption of modern versions.
          - generic [ref=e30]:
            - button "Collapse All" [ref=e31] [cursor=pointer]
            - button "Copy All" [ref=e32] [cursor=pointer]
            - button "Print" [ref=e36] [cursor=pointer]
        - paragraph [ref=e45]:
          - strong [ref=e46]: "For educational purposes:"
          - text: These resources are shared for study and reference. I do not necessarily endorse every doctrine or teaching found on the linked sites — please exercise discernment and compare all things with the scripture.
        - textbox "Search defence resources..." [ref=e51]
        - generic [ref=e52]:
          - generic [ref=e53]:
            - button "KJB Defence (6)" [ref=e54] [cursor=pointer]:
              - generic [ref=e55]:
                - generic [ref=e56]:
                  - heading "KJB Defence" [level=2] [ref=e59]
                  - generic [ref=e60]: (6)
                - button "Copy" [ref=e62]
            - generic [ref=e68]:
              - generic [ref=e70]:
                - generic [ref=e71]:
                  - heading "FPGM - KJV Defense Training" [level=3] [ref=e73]
                  - paragraph [ref=e74]: Training resource defending the King James Version from Free Presbyterian Global Ministries.
                  - link "fpgm.org →" [ref=e75] [cursor=pointer]:
                    - /url: https://fpgm.org/training/kjv-defense/
                - generic [ref=e76]:
                  - button "Copy" [ref=e77] [cursor=pointer]
                  - link "Open" [ref=e81] [cursor=pointer]:
                    - /url: https://fpgm.org/training/kjv-defense/
              - generic [ref=e87]:
                - generic [ref=e88]:
                  - 'heading "King James Bible: Pure Cambridge Edition & Free Download" [level=3] [ref=e90]'
                  - paragraph [ref=e91]: The definitive electronic text of the Pure Cambridge Edition of the KJB — bibleprotector.com. Free downloads available in PDF, ePub, and TXT formats.
                  - link "bibleprotector.com →" [ref=e92] [cursor=pointer]:
                    - /url: https://www.bibleprotector.com
                - generic [ref=e93]:
                  - button "Copy" [ref=e94] [cursor=pointer]
                  - link "Open" [ref=e98] [cursor=pointer]:
                    - /url: https://www.bibleprotector.com
              - generic [ref=e104]:
                - generic [ref=e105]:
                  - heading "The Word of God Will Keep Its Infallibility (Archive.org)" [level=3] [ref=e107]
                  - paragraph [ref=e108]: Historical book demonstrating that the King James Bible is infallible — full text available on Archive.org.
                  - link "Read on Archive.org →" [ref=e109] [cursor=pointer]:
                    - /url: https://archive.org/details/wordgodwillkeepi0000faus/page/18/mode/1up?q=%22King+James+Bible+is+infallible%22
                - generic [ref=e110]:
                  - button "Copy" [ref=e111] [cursor=pointer]
                  - link "Open" [ref=e115] [cursor=pointer]:
                    - /url: https://archive.org/details/wordgodwillkeepi0000faus/page/18/mode/1up?q=%22King+James+Bible+is+infallible%22
              - generic [ref=e121]:
                - generic [ref=e122]:
                  - heading "KJV Compare" [level=3] [ref=e124]
                  - paragraph [ref=e125]: Go through hundreds of changes made in modern versions of the Bible — verse-by-verse.
                  - link "kjvcompare.com →" [ref=e126] [cursor=pointer]:
                    - /url: https://kjvcompare.com/
                - generic [ref=e127]:
                  - button "Copy" [ref=e128] [cursor=pointer]
                  - link "Open" [ref=e132] [cursor=pointer]:
                    - /url: https://kjvcompare.com/
              - generic [ref=e138]:
                - generic [ref=e139]:
                  - heading "Scion of Zion — KJB Comparisons" [level=3] [ref=e141]
                  - paragraph [ref=e142]: Detailed comparisons of the KJB with modern versions, exposing corruptions and omissions.
                  - link "scionofzion.com →" [ref=e143] [cursor=pointer]:
                    - /url: https://www.scionofzion.com/kjcomparisons.html
                - generic [ref=e144]:
                  - button "Copy" [ref=e145] [cursor=pointer]
                  - link "Open" [ref=e149] [cursor=pointer]:
                    - /url: https://www.scionofzion.com/kjcomparisons.html
              - generic [ref=e155]:
                - generic [ref=e156]:
                  - heading "1 John 5:7 Defence" [level=3] [ref=e158]
                  - paragraph [ref=e159]: Resources defending the Johannine Comma (1 John 5:7) — the Trinitarian verse attacked by modern versions.
                  - link "Read defence →" [ref=e160] [cursor=pointer]:
                    - /url: https://www.scionofzion.com/1_john_5_7.htm
                - generic [ref=e161]:
                  - button "Copy" [ref=e162] [cursor=pointer]
                  - link "Open" [ref=e166] [cursor=pointer]:
                    - /url: https://www.scionofzion.com/1_john_5_7.htm
          - generic [ref=e171]:
            - button "Why Modern Versions Are Corrupt (9)" [ref=e172] [cursor=pointer]:
              - generic [ref=e173]:
                - generic [ref=e174]:
                  - heading "Why Modern Versions Are Corrupt" [level=2] [ref=e177]
                  - generic [ref=e178]: (9)
                - button "Copy" [ref=e180]
            - generic [ref=e186]:
              - generic [ref=e188]:
                - generic [ref=e189]:
                  - heading "The Critical Text & Westcott-Hort" [level=3] [ref=e191]
                  - paragraph [ref=e192]: Westcott and Hort created the Critical Text based on Vatican and Egyptian manuscripts with hundreds of errors, deletions and additions to the Bible, attacking doctrines such as the Trinity and deity of Christ. Their text was used in the Revised Version of 1881.
                  - link "Theological Heresies of Westcott & Hort (PDF) →" [ref=e193] [cursor=pointer]:
                    - /url: https://faithsaves.net/wp-content/uploads/2016/01/Theological-Heresies-of-Westcott-and-Hort-Waite.pdf
                - generic [ref=e194]:
                  - button "Copy" [ref=e195] [cursor=pointer]
                  - link "Open" [ref=e199] [cursor=pointer]:
                    - /url: https://faithsaves.net/wp-content/uploads/2016/01/Theological-Heresies-of-Westcott-and-Hort-Waite.pdf
              - generic [ref=e205]:
                - generic [ref=e206]:
                  - heading "NKJV Exposed" [level=3] [ref=e208]
                  - paragraph [ref=e209]: The NKJV is NOT the same as the King James Bible. Resources exposing the New King James Version.
                  - link "scionofzion.com/nkjv →" [ref=e210] [cursor=pointer]:
                    - /url: https://www.scionofzion.com/nkjv.htm
                - generic [ref=e211]:
                  - button "Copy" [ref=e212] [cursor=pointer]
                  - link "Open" [ref=e216] [cursor=pointer]:
                    - /url: https://www.scionofzion.com/nkjv.htm
              - generic [ref=e222]:
                - generic [ref=e223]:
                  - heading "A Lamp in the Dark — Full Documentary" [level=3] [ref=e225]
                  - paragraph [ref=e226]: The untold history of the Bible — a documentary exposing the corruption of modern Bible translations.
                  - link "Watch on YouTube →" [ref=e227] [cursor=pointer]:
                    - /url: https://www.youtube.com/watch?v=RmXBj2N9fhY&list=PLiMliTxa3H172BW4ANpBAavcIGVz-KXFW
                - generic [ref=e228]:
                  - button "Copy" [ref=e229] [cursor=pointer]
                  - link "Open" [ref=e233] [cursor=pointer]:
                    - /url: https://www.youtube.com/watch?v=RmXBj2N9fhY&list=PLiMliTxa3H172BW4ANpBAavcIGVz-KXFW
              - generic [ref=e239]:
                - generic [ref=e240]:
                  - heading "KJB Defence Playlist" [level=3] [ref=e242]
                  - paragraph [ref=e243]: Comprehensive playlist defending the King James Bible as the infallible, perfect words of God in the English Language.
                  - link "Watch Playlist →" [ref=e244] [cursor=pointer]:
                    - /url: https://youtube.com/playlist?list=PLNGhZnJavRf01ILv3TJu_ke4IPYcKcpJm&si=w73gmQRdA_3QbE48
                - generic [ref=e245]:
                  - button "Copy" [ref=e246] [cursor=pointer]
                  - link "Open" [ref=e250] [cursor=pointer]:
                    - /url: https://youtube.com/playlist?list=PLNGhZnJavRf01ILv3TJu_ke4IPYcKcpJm&si=w73gmQRdA_3QbE48
              - generic [ref=e256]:
                - generic [ref=e257]:
                  - heading "Gail Riplinger — The Sword Slays the Dragon" [level=3] [ref=e259]
                  - paragraph [ref=e260]: Gail Riplinger's powerful defence of the King James Bible against modern version corruption.
                  - link "Watch on YouTube →" [ref=e261] [cursor=pointer]:
                    - /url: https://www.youtube.com/watch?v=fyN680Y0Vwc
                - generic [ref=e262]:
                  - button "Copy" [ref=e263] [cursor=pointer]
                  - link "Open" [ref=e267] [cursor=pointer]:
                    - /url: https://www.youtube.com/watch?v=fyN680Y0Vwc
              - generic [ref=e273]:
                - generic [ref=e274]:
                  - 'heading "Irrefutable Proof: The KJB Superseded Hebrew and Greek" [level=3] [ref=e276]'
                  - paragraph [ref=e277]: Truth is Christ channel — demonstrating the superiority and authority of the King James Bible.
                  - link "Watch on YouTube →" [ref=e278] [cursor=pointer]:
                    - /url: https://www.youtube.com/watch?v=t6ck6KrVPIk
                - generic [ref=e279]:
                  - button "Copy" [ref=e280] [cursor=pointer]
                  - link "Open" [ref=e284] [cursor=pointer]:
                    - /url: https://www.youtube.com/watch?v=t6ck6KrVPIk
              - generic [ref=e290]:
                - generic [ref=e291]:
                  - heading "AV1611 Articles" [level=3] [ref=e293]
                  - paragraph [ref=e294]: Articles defending the Authorised Version — King James Bible defence resources.
                  - link "av1611.org/articles →" [ref=e295] [cursor=pointer]:
                    - /url: https://www.av1611.org/articles
                - generic [ref=e296]:
                  - button "Copy" [ref=e297] [cursor=pointer]
                  - link "Open" [ref=e301] [cursor=pointer]:
                    - /url: https://www.av1611.org/articles
              - generic [ref=e307]:
                - generic [ref=e308]:
                  - heading "Preserved Words" [level=3] [ref=e310]
                  - paragraph [ref=e311]: Another King James Bible Believer — resources and articles defending the preserved Word of God.
                  - link "preservedwords.com →" [ref=e312] [cursor=pointer]:
                    - /url: https://www.preservedwords.com/bp/index.html
                - generic [ref=e313]:
                  - button "Copy" [ref=e314] [cursor=pointer]
                  - link "Open" [ref=e318] [cursor=pointer]:
                    - /url: https://www.preservedwords.com/bp/index.html
              - generic [ref=e324]:
                - generic [ref=e325]:
                  - heading "Brandplucked — KJB Articles" [level=3] [ref=e327]
                  - paragraph [ref=e328]: Extensive collection of articles defending the King James Bible.
                  - link "brandplucked.com →" [ref=e329] [cursor=pointer]:
                    - /url: https://brandplucked.com/kjbarticles.htm
                - generic [ref=e330]:
                  - button "Copy" [ref=e331] [cursor=pointer]
                  - link "Open" [ref=e335] [cursor=pointer]:
                    - /url: https://brandplucked.com/kjbarticles.htm
          - generic [ref=e340]:
            - button "1 John 5:7 Defence (4)" [ref=e341] [cursor=pointer]:
              - generic [ref=e342]:
                - generic [ref=e343]:
                  - heading "1 John 5:7 Defence" [level=2] [ref=e346]
                  - generic [ref=e347]: (4)
                - button "Copy" [ref=e349]
            - generic [ref=e355]:
              - generic [ref=e357]:
                - generic [ref=e358]:
                  - heading "1 John 5:7 - The 1st Century Latin/Spain Connection" [level=3] [ref=e360]
                  - paragraph [ref=e361]: Historical evidence connecting 1 John 5:7 to early Christian manuscripts and tradition.
                  - link "Read article →" [ref=e362] [cursor=pointer]:
                    - /url: https://kjvdebate.com/blog/f/i-john-57-the-1st-century-latinspain-connection
                - generic [ref=e363]:
                  - button "Copy" [ref=e364] [cursor=pointer]
                  - link "Open" [ref=e368] [cursor=pointer]:
                    - /url: https://kjvdebate.com/blog/f/i-john-57-the-1st-century-latinspain-connection
              - generic [ref=e374]:
                - generic [ref=e375]:
                  - heading "The Authenticity of 1 John 5:7" [level=3] [ref=e377]
                  - paragraph [ref=e378]: Historical evidence and church tradition supporting the Johannine Comma.
                  - link "Read article →" [ref=e379] [cursor=pointer]:
                    - /url: https://catalog.obitel-minsk.com/blog/2021/08/the-authenticity-of-1-john-57-historical-evidence-and-the-church-tradition
                - generic [ref=e380]:
                  - button "Copy" [ref=e381] [cursor=pointer]
                  - link "Open" [ref=e385] [cursor=pointer]:
                    - /url: https://catalog.obitel-minsk.com/blog/2021/08/the-authenticity-of-1-john-57-historical-evidence-and-the-church-tradition
              - generic [ref=e391]:
                - generic [ref=e392]:
                  - heading "Textus Receptus - 1 John 5:7" [level=3] [ref=e394]
                  - paragraph [ref=e395]: Wiki entry on 1 John 5:7 in the Textus Receptus (Received Text).
                  - link "textus-receptus.com →" [ref=e396] [cursor=pointer]:
                    - /url: https://textus-receptus.com/wiki/1_John_5:7
                - generic [ref=e397]:
                  - button "Copy" [ref=e398] [cursor=pointer]
                  - link "Open" [ref=e402] [cursor=pointer]:
                    - /url: https://textus-receptus.com/wiki/1_John_5:7
              - generic [ref=e408]:
                - generic [ref=e409]:
                  - heading "KJV Debate - 1 John 5:7 PDF" [level=3] [ref=e411]
                  - paragraph [ref=e412]: Comprehensive PDF resource defending 1 John 5:7.
                  - link "Download PDF →" [ref=e413] [cursor=pointer]:
                    - /url: https://kjvdebate.com/pdf
                - generic [ref=e414]:
                  - button "Copy" [ref=e415] [cursor=pointer]
                  - link "Open" [ref=e419] [cursor=pointer]:
                    - /url: https://kjvdebate.com/pdf
          - generic [ref=e424]:
            - button "Westcott & Hort Heresies (4)" [ref=e425] [cursor=pointer]:
              - generic [ref=e426]:
                - generic [ref=e427]:
                  - heading "Westcott & Hort Heresies" [level=2] [ref=e430]
                  - generic [ref=e431]: (4)
                - button "Copy" [ref=e433]
            - generic [ref=e439]:
              - generic [ref=e441]:
                - generic [ref=e442]:
                  - heading "Theological Heresies of Westcott and Hort" [level=3] [ref=e444]
                  - paragraph [ref=e445]: Detailed examination of the heretical beliefs held by Westcott and Hort, whose critical text corrupted Bible translations.
                  - link "Download PDF →" [ref=e446] [cursor=pointer]:
                    - /url: https://faithsaves.net/wp-content/uploads/2016/01/Theological-Heresies-of-Westcott-and-Hort-Waite.pdf
                - generic [ref=e447]:
                  - button "Copy" [ref=e448] [cursor=pointer]
                  - link "Open" [ref=e452] [cursor=pointer]:
                    - /url: https://faithsaves.net/wp-content/uploads/2016/01/Theological-Heresies-of-Westcott-and-Hort-Waite.pdf
              - generic [ref=e458]:
                - generic [ref=e459]:
                  - heading "Scattered Christians - Westcott & Hort" [level=3] [ref=e461]
                  - paragraph [ref=e462]: Analysis of Westcott and Hort's influence on modern Bible versions.
                  - link "Read article →" [ref=e463] [cursor=pointer]:
                    - /url: https://scatteredchristians.org/WescottHort.html
                - generic [ref=e464]:
                  - button "Copy" [ref=e465] [cursor=pointer]
                  - link "Open" [ref=e469] [cursor=pointer]:
                    - /url: https://scatteredchristians.org/WescottHort.html
              - generic [ref=e475]:
                - generic [ref=e476]:
                  - heading "Textus Receptus Bibles - Editorial Issues" [level=3] [ref=e478]
                  - paragraph [ref=e479]: Information on editorial changes and textual issues in modern versions.
                  - link "Read more →" [ref=e480] [cursor=pointer]:
                    - /url: https://textusreceptusbibles.com/Editorial/Umlauts
                - generic [ref=e481]:
                  - button "Copy" [ref=e482] [cursor=pointer]
                  - link "Open" [ref=e486] [cursor=pointer]:
                    - /url: https://textusreceptusbibles.com/Editorial/Umlauts
              - generic [ref=e492]:
                - generic [ref=e493]:
                  - heading "Differences Between Textus Receptus and NA/UBS" [level=3] [ref=e495]
                  - paragraph [ref=e496]: Detailed comparison of the Greek texts used in different Bible versions.
                  - link "Compare texts →" [ref=e497] [cursor=pointer]:
                    - /url: https://textusreceptusbibles.com/Differences_Between_Textus_Receptus_and_NaUbs
                - generic [ref=e498]:
                  - button "Copy" [ref=e499] [cursor=pointer]
                  - link "Open" [ref=e503] [cursor=pointer]:
                    - /url: https://textusreceptusbibles.com/Differences_Between_Textus_Receptus_and_NaUbs
          - generic [ref=e508]:
            - button "NKJV Exposed (5)" [ref=e509] [cursor=pointer]:
              - generic [ref=e510]:
                - generic [ref=e511]:
                  - heading "NKJV Exposed" [level=2] [ref=e514]
                  - generic [ref=e515]: (5)
                - button "Copy" [ref=e517]
            - generic [ref=e523]:
              - generic [ref=e525]:
                - generic [ref=e526]:
                  - heading "AV1611 - NKJV Exposed" [level=3] [ref=e528]
                  - paragraph [ref=e529]: Comprehensive analysis showing the NKJV is not the King James Bible.
                  - link "av1611.org →" [ref=e530] [cursor=pointer]:
                    - /url: https://www.av1611.org/nkjv.html
                - generic [ref=e531]:
                  - button "Copy" [ref=e532] [cursor=pointer]
                  - link "Open" [ref=e536] [cursor=pointer]:
                    - /url: https://www.av1611.org/nkjv.html
              - generic [ref=e542]:
                - generic [ref=e543]:
                  - heading "TBS - What Today's Christian Needs to Know About NKJV" [level=3] [ref=e545]
                  - paragraph [ref=e546]: Official resource from The Bible For Today highlighting NKJV issues.
                  - link "Read article →" [ref=e547] [cursor=pointer]:
                    - /url: https://www.tbsbibles.org/page/WhatTodaysChristianNeedsToKnowAboutTheNewKingJamesVersion
                - generic [ref=e548]:
                  - button "Copy" [ref=e549] [cursor=pointer]
                  - link "Open" [ref=e553] [cursor=pointer]:
                    - /url: https://www.tbsbibles.org/page/WhatTodaysChristianNeedsToKnowAboutTheNewKingJamesVersion
              - generic [ref=e559]:
                - generic [ref=e560]:
                  - heading "TBS - Does the NKJV Live Up to Its Claims?" [level=3] [ref=e562]
                  - paragraph [ref=e563]: Critical examination of NKJV translation claims and accuracy.
                  - link "Read article →" [ref=e564] [cursor=pointer]:
                    - /url: https://www.tbsbibles.org/page/DoesTheNKJVLiveUpToItsClaims
                - generic [ref=e565]:
                  - button "Copy" [ref=e566] [cursor=pointer]
                  - link "Open" [ref=e570] [cursor=pointer]:
                    - /url: https://www.tbsbibles.org/page/DoesTheNKJVLiveUpToItsClaims
              - generic [ref=e576]:
                - generic [ref=e577]:
                  - heading "TBS - The New King James Version Overview" [level=3] [ref=e579]
                  - paragraph [ref=e580]: Detailed overview of NKJV problems and textual issues.
                  - link "Read article →" [ref=e581] [cursor=pointer]:
                    - /url: https://www.tbsbibles.org/page/TheNewKingJamesVersion
                - generic [ref=e582]:
                  - button "Copy" [ref=e583] [cursor=pointer]
                  - link "Open" [ref=e587] [cursor=pointer]:
                    - /url: https://www.tbsbibles.org/page/TheNewKingJamesVersion
              - generic [ref=e593]:
                - generic [ref=e594]:
                  - heading "TBS - An Examination of the NKJV (Parts 1 & 2)" [level=3] [ref=e596]
                  - paragraph [ref=e597]: Comprehensive two-part examination of NKJV translation errors.
                  - link "Download PDFs →" [ref=e598] [cursor=pointer]:
                    - /url: https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/An-Examination-of-NKJV-Part-1.pdf
                - generic [ref=e599]:
                  - button "Copy" [ref=e600] [cursor=pointer]
                  - link "Open" [ref=e604] [cursor=pointer]:
                    - /url: https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/An-Examination-of-NKJV-Part-1.pdf
          - generic [ref=e609]:
            - button "Living Bible Exposed (3)" [ref=e610] [cursor=pointer]:
              - generic [ref=e611]:
                - generic [ref=e612]:
                  - heading "Living Bible Exposed" [level=2] [ref=e615]
                  - generic [ref=e616]: (3)
                - button "Copy" [ref=e618]
            - generic [ref=e624]:
              - generic [ref=e626]:
                - generic [ref=e627]:
                  - heading "TBS - The Living Bible Exposed" [level=3] [ref=e629]
                  - paragraph [ref=e630]: Official resource exposing errors and problems in the Living Bible paraphrase.
                  - link "Download PDF →" [ref=e631] [cursor=pointer]:
                    - /url: https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/The-Living-Bible.pdf
                - generic [ref=e632]:
                  - button "Copy" [ref=e633] [cursor=pointer]
                  - link "Open" [ref=e637] [cursor=pointer]:
                    - /url: https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/The-Living-Bible.pdf
              - generic [ref=e643]:
                - generic [ref=e644]:
                  - heading "Jesus is Savior - Living Bible Exposed" [level=3] [ref=e646]
                  - paragraph [ref=e647]: Comprehensive resource exposing the Living Bible's doctrinal problems.
                  - link "Read article →" [ref=e648] [cursor=pointer]:
                    - /url: https://www.jesus-is-savior.com/Bible/Living%20Bible/lb_exposed.htm
                - generic [ref=e649]:
                  - button "Copy" [ref=e650] [cursor=pointer]
                  - link "Open" [ref=e654] [cursor=pointer]:
                    - /url: https://www.jesus-is-savior.com/Bible/Living%20Bible/lb_exposed.htm
              - generic [ref=e660]:
                - generic [ref=e661]:
                  - heading "Jesus is Savior - NLT Bible Exposed" [level=3] [ref=e663]
                  - paragraph [ref=e664]: Detailed analysis of the New Living Translation's translation errors.
                  - link "Read article →" [ref=e665] [cursor=pointer]:
                    - /url: https://jesus-is-savior.com/Bible/NLT/nlt_exposed.htm
                - generic [ref=e666]:
                  - button "Copy" [ref=e667] [cursor=pointer]
                  - link "Open" [ref=e671] [cursor=pointer]:
                    - /url: https://jesus-is-savior.com/Bible/NLT/nlt_exposed.htm
          - generic [ref=e676]:
            - button "ESV & NIV Exposed (7)" [ref=e677] [cursor=pointer]:
              - generic [ref=e678]:
                - generic [ref=e679]:
                  - heading "ESV & NIV Exposed" [level=2] [ref=e682]
                  - generic [ref=e683]: (7)
                - button "Copy" [ref=e685]
            - generic [ref=e691]:
              - generic [ref=e693]:
                - generic [ref=e694]:
                  - heading "Brandplucked - Is the ESV Inerrant?" [level=3] [ref=e696]
                  - paragraph [ref=e697]: Critical analysis of ESV translation choices and inerrancy claims.
                  - link "Read article →" [ref=e698] [cursor=pointer]:
                    - /url: https://brandplucked.com/is-the-esv-inerrant.html
                - generic [ref=e699]:
                  - button "Copy" [ref=e700] [cursor=pointer]
                  - link "Open" [ref=e704] [cursor=pointer]:
                    - /url: https://brandplucked.com/is-the-esv-inerrant.html
              - generic [ref=e710]:
                - generic [ref=e711]:
                  - heading "Brandplucked - The ESV Examined" [level=3] [ref=e713]
                  - paragraph [ref=e714]: Comprehensive examination of ESV translation problems.
                  - link "Read article →" [ref=e715] [cursor=pointer]:
                    - /url: https://brandplucked.com/theesv.htm
                - generic [ref=e716]:
                  - button "Copy" [ref=e717] [cursor=pointer]
                  - link "Open" [ref=e721] [cursor=pointer]:
                    - /url: https://brandplucked.com/theesv.htm
              - generic [ref=e727]:
                - generic [ref=e728]:
                  - heading "TBS - English Standard Version" [level=3] [ref=e730]
                  - paragraph [ref=e731]: Official analysis of ESV translation issues.
                  - link "Read article →" [ref=e732] [cursor=pointer]:
                    - /url: https://www.tbsbibles.org/page/EnglishStandardVersion
                - generic [ref=e733]:
                  - button "Copy" [ref=e734] [cursor=pointer]
                  - link "Open" [ref=e738] [cursor=pointer]:
                    - /url: https://www.tbsbibles.org/page/EnglishStandardVersion
              - generic [ref=e744]:
                - generic [ref=e745]:
                  - heading "AV1611 - NIV Exposed" [level=3] [ref=e747]
                  - paragraph [ref=e748]: Detailed comparison of NIV problems and doctrinal deletions.
                  - link "Read article →" [ref=e749] [cursor=pointer]:
                    - /url: https://www.av1611.org/kjv/nivteen.html
                - generic [ref=e750]:
                  - button "Copy" [ref=e751] [cursor=pointer]
                  - link "Open" [ref=e755] [cursor=pointer]:
                    - /url: https://www.av1611.org/kjv/nivteen.html
              - generic [ref=e761]:
                - generic [ref=e762]:
                  - heading "Jesus is Precious - NIV Missing Verses" [level=3] [ref=e764]
                  - paragraph [ref=e765]: Documentation of verses omitted from the NIV translation.
                  - link "Read article →" [ref=e766] [cursor=pointer]:
                    - /url: https://www.jesusisprecious.org/bible/niv/acts_8-37_missing.htm
                - generic [ref=e767]:
                  - button "Copy" [ref=e768] [cursor=pointer]
                  - link "Open" [ref=e772] [cursor=pointer]:
                    - /url: https://www.jesusisprecious.org/bible/niv/acts_8-37_missing.htm
              - generic [ref=e778]:
                - generic [ref=e779]:
                  - heading "Scion of Zion - NIV 1984 vs 2011" [level=3] [ref=e781]
                  - paragraph [ref=e782]: Comparison of changes made between NIV versions.
                  - link "Compare versions →" [ref=e783] [cursor=pointer]:
                    - /url: https://www.scionofzion.com/niv%201984%20and%202011.html
                - generic [ref=e784]:
                  - button "Copy" [ref=e785] [cursor=pointer]
                  - link "Open" [ref=e789] [cursor=pointer]:
                    - /url: https://www.scionofzion.com/niv%201984%20and%202011.html
              - generic [ref=e795]:
                - generic [ref=e796]:
                  - heading "Jesus is Savior - NIV Exposed" [level=3] [ref=e798]
                  - paragraph [ref=e799]: Comprehensive resource exposing the NIV's doctrinal corruptions.
                  - link "Read article →" [ref=e800] [cursor=pointer]:
                    - /url: https://www.jesus-is-savior.com/Bible/NIV/new_international_version_exposed.htm
                - generic [ref=e801]:
                  - button "Copy" [ref=e802] [cursor=pointer]
                  - link "Open" [ref=e806] [cursor=pointer]:
                    - /url: https://www.jesus-is-savior.com/Bible/NIV/new_international_version_exposed.htm
    - navigation [ref=e811]:
      - generic [ref=e813]:
        - button "Home" [ref=e814] [cursor=pointer]
        - button "Contents" [ref=e819] [cursor=pointer]
        - button "Read" [ref=e822] [cursor=pointer]
        - button "Gospel" [ref=e826] [cursor=pointer]
        - button "Toggle navigation rows" [ref=e830] [cursor=pointer]
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
      |           ^ Error: /kjb-defence @ 320px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```