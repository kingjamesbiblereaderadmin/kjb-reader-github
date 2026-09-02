# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 360px] >> no horizontal overflow: /kjb-defence
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /kjb-defence @ 360px overflows horizontally by 0px:
  <div class="absolute top-0 h-full rounded-full"> "" (over by 49.9px)

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 8

- Array []
+ Array [
+   Object {
+     "cls": "absolute top-0 h-full rounded-full",
+     "overBy": 49.9,
+     "tag": "div",
+     "text": "",
+   },
+ ]
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - img "KJB Reader Logo" [ref=e5]
    - generic [ref=e6]: WELCOME BACK TO KJB READER.
  - generic [ref=e10]:
    - banner [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]:
          - button "Back" [ref=e14] [cursor=pointer]
          - link "Home" [ref=e15] [cursor=pointer]:
            - /url: /
        - textbox "Search..." [ref=e21]
        - generic [ref=e22]:
          - button "Toggle fullscreen" [ref=e23] [cursor=pointer]
          - button "Toggle theme" [ref=e24] [cursor=pointer]
          - button "Open menu" [ref=e25] [cursor=pointer]
    - main [ref=e26]:
      - generic [ref=e29]:
        - generic [ref=e30]:
          - heading "KJB Defence" [level=1] [ref=e34]
          - paragraph [ref=e35]: Resources defending the King James Bible as the preserved, infallible Word of God — and exposing the corruption of modern versions.
          - generic [ref=e37]:
            - button "Collapse All" [ref=e38] [cursor=pointer]
            - button "Copy All" [ref=e39] [cursor=pointer]
            - button "Print" [ref=e43] [cursor=pointer]
        - paragraph [ref=e52]:
          - strong [ref=e53]: "For educational purposes:"
          - text: These resources are shared for study and reference. I do not necessarily endorse every doctrine or teaching found on the linked sites — please exercise discernment and compare all things with the scripture.
        - textbox "Search defence resources..." [ref=e58]
        - generic [ref=e59]:
          - generic [ref=e60]:
            - button "KJB Defence (6)" [ref=e61] [cursor=pointer]:
              - generic [ref=e62]:
                - generic [ref=e63]:
                  - heading "KJB Defence" [level=2] [ref=e66]
                  - generic [ref=e67]: (6)
                - button "Copy" [ref=e69]
            - generic [ref=e75]:
              - generic [ref=e77]:
                - generic [ref=e78]:
                  - heading "FPGM - KJV Defense Training" [level=3] [ref=e80]
                  - paragraph [ref=e81]: Training resource defending the King James Version from Free Presbyterian Global Ministries.
                  - link "fpgm.org →" [ref=e82] [cursor=pointer]:
                    - /url: https://fpgm.org/training/kjv-defense/
                - generic [ref=e83]:
                  - button "Copy" [ref=e84] [cursor=pointer]
                  - link "Open" [ref=e88] [cursor=pointer]:
                    - /url: https://fpgm.org/training/kjv-defense/
              - generic [ref=e94]:
                - generic [ref=e95]:
                  - 'heading "King James Bible: Pure Cambridge Edition & Free Download" [level=3] [ref=e97]'
                  - paragraph [ref=e98]: The definitive electronic text of the Pure Cambridge Edition of the KJB — bibleprotector.com. Free downloads available in PDF, ePub, and TXT formats.
                  - link "bibleprotector.com →" [ref=e99] [cursor=pointer]:
                    - /url: https://www.bibleprotector.com
                - generic [ref=e100]:
                  - button "Copy" [ref=e101] [cursor=pointer]
                  - link "Open" [ref=e105] [cursor=pointer]:
                    - /url: https://www.bibleprotector.com
              - generic [ref=e111]:
                - generic [ref=e112]:
                  - heading "The Word of God Will Keep Its Infallibility (Archive.org)" [level=3] [ref=e114]
                  - paragraph [ref=e115]: Historical book demonstrating that the King James Bible is infallible — full text available on Archive.org.
                  - link "Read on Archive.org →" [ref=e116] [cursor=pointer]:
                    - /url: https://archive.org/details/wordgodwillkeepi0000faus/page/18/mode/1up?q=%22King+James+Bible+is+infallible%22
                - generic [ref=e117]:
                  - button "Copy" [ref=e118] [cursor=pointer]
                  - link "Open" [ref=e122] [cursor=pointer]:
                    - /url: https://archive.org/details/wordgodwillkeepi0000faus/page/18/mode/1up?q=%22King+James+Bible+is+infallible%22
              - generic [ref=e128]:
                - generic [ref=e129]:
                  - heading "KJV Compare" [level=3] [ref=e131]
                  - paragraph [ref=e132]: Go through hundreds of changes made in modern versions of the Bible — verse-by-verse.
                  - link "kjvcompare.com →" [ref=e133] [cursor=pointer]:
                    - /url: https://kjvcompare.com/
                - generic [ref=e134]:
                  - button "Copy" [ref=e135] [cursor=pointer]
                  - link "Open" [ref=e139] [cursor=pointer]:
                    - /url: https://kjvcompare.com/
              - generic [ref=e145]:
                - generic [ref=e146]:
                  - heading "Scion of Zion — KJB Comparisons" [level=3] [ref=e148]
                  - paragraph [ref=e149]: Detailed comparisons of the KJB with modern versions, exposing corruptions and omissions.
                  - link "scionofzion.com →" [ref=e150] [cursor=pointer]:
                    - /url: https://www.scionofzion.com/kjcomparisons.html
                - generic [ref=e151]:
                  - button "Copy" [ref=e152] [cursor=pointer]
                  - link "Open" [ref=e156] [cursor=pointer]:
                    - /url: https://www.scionofzion.com/kjcomparisons.html
              - generic [ref=e162]:
                - generic [ref=e163]:
                  - heading "1 John 5:7 Defence" [level=3] [ref=e165]
                  - paragraph [ref=e166]: Resources defending the Johannine Comma (1 John 5:7) — the Trinitarian verse attacked by modern versions.
                  - link "Read defence →" [ref=e167] [cursor=pointer]:
                    - /url: https://www.scionofzion.com/1_john_5_7.htm
                - generic [ref=e168]:
                  - button "Copy" [ref=e169] [cursor=pointer]
                  - link "Open" [ref=e173] [cursor=pointer]:
                    - /url: https://www.scionofzion.com/1_john_5_7.htm
          - generic [ref=e178]:
            - button "Why Modern Versions Are Corrupt (9)" [ref=e179] [cursor=pointer]:
              - generic [ref=e180]:
                - generic [ref=e181]:
                  - heading "Why Modern Versions Are Corrupt" [level=2] [ref=e184]
                  - generic [ref=e185]: (9)
                - button "Copy" [ref=e187]
            - generic [ref=e193]:
              - generic [ref=e195]:
                - generic [ref=e196]:
                  - heading "The Critical Text & Westcott-Hort" [level=3] [ref=e198]
                  - paragraph [ref=e199]: Westcott and Hort created the Critical Text based on Vatican and Egyptian manuscripts with hundreds of errors, deletions and additions to the Bible, attacking doctrines such as the Trinity and deity of Christ. Their text was used in the Revised Version of 1881.
                  - link "Theological Heresies of Westcott & Hort (PDF) →" [ref=e200] [cursor=pointer]:
                    - /url: https://faithsaves.net/wp-content/uploads/2016/01/Theological-Heresies-of-Westcott-and-Hort-Waite.pdf
                - generic [ref=e201]:
                  - button "Copy" [ref=e202] [cursor=pointer]
                  - link "Open" [ref=e206] [cursor=pointer]:
                    - /url: https://faithsaves.net/wp-content/uploads/2016/01/Theological-Heresies-of-Westcott-and-Hort-Waite.pdf
              - generic [ref=e212]:
                - generic [ref=e213]:
                  - heading "NKJV Exposed" [level=3] [ref=e215]
                  - paragraph [ref=e216]: The NKJV is NOT the same as the King James Bible. Resources exposing the New King James Version.
                  - link "scionofzion.com/nkjv →" [ref=e217] [cursor=pointer]:
                    - /url: https://www.scionofzion.com/nkjv.htm
                - generic [ref=e218]:
                  - button "Copy" [ref=e219] [cursor=pointer]
                  - link "Open" [ref=e223] [cursor=pointer]:
                    - /url: https://www.scionofzion.com/nkjv.htm
              - generic [ref=e229]:
                - generic [ref=e230]:
                  - heading "A Lamp in the Dark — Full Documentary" [level=3] [ref=e232]
                  - paragraph [ref=e233]: The untold history of the Bible — a documentary exposing the corruption of modern Bible translations.
                  - link "Watch on YouTube →" [ref=e234] [cursor=pointer]:
                    - /url: https://www.youtube.com/watch?v=RmXBj2N9fhY&list=PLiMliTxa3H172BW4ANpBAavcIGVz-KXFW
                - generic [ref=e235]:
                  - button "Copy" [ref=e236] [cursor=pointer]
                  - link "Open" [ref=e240] [cursor=pointer]:
                    - /url: https://www.youtube.com/watch?v=RmXBj2N9fhY&list=PLiMliTxa3H172BW4ANpBAavcIGVz-KXFW
              - generic [ref=e246]:
                - generic [ref=e247]:
                  - heading "KJB Defence Playlist" [level=3] [ref=e249]
                  - paragraph [ref=e250]: Comprehensive playlist defending the King James Bible as the infallible, perfect words of God in the English Language.
                  - link "Watch Playlist →" [ref=e251] [cursor=pointer]:
                    - /url: https://youtube.com/playlist?list=PLNGhZnJavRf01ILv3TJu_ke4IPYcKcpJm&si=w73gmQRdA_3QbE48
                - generic [ref=e252]:
                  - button "Copy" [ref=e253] [cursor=pointer]
                  - link "Open" [ref=e257] [cursor=pointer]:
                    - /url: https://youtube.com/playlist?list=PLNGhZnJavRf01ILv3TJu_ke4IPYcKcpJm&si=w73gmQRdA_3QbE48
              - generic [ref=e263]:
                - generic [ref=e264]:
                  - heading "Gail Riplinger — The Sword Slays the Dragon" [level=3] [ref=e266]
                  - paragraph [ref=e267]: Gail Riplinger's powerful defence of the King James Bible against modern version corruption.
                  - link "Watch on YouTube →" [ref=e268] [cursor=pointer]:
                    - /url: https://www.youtube.com/watch?v=fyN680Y0Vwc
                - generic [ref=e269]:
                  - button "Copy" [ref=e270] [cursor=pointer]
                  - link "Open" [ref=e274] [cursor=pointer]:
                    - /url: https://www.youtube.com/watch?v=fyN680Y0Vwc
              - generic [ref=e280]:
                - generic [ref=e281]:
                  - 'heading "Irrefutable Proof: The KJB Superseded Hebrew and Greek" [level=3] [ref=e283]'
                  - paragraph [ref=e284]: Truth is Christ channel — demonstrating the superiority and authority of the King James Bible.
                  - link "Watch on YouTube →" [ref=e285] [cursor=pointer]:
                    - /url: https://www.youtube.com/watch?v=t6ck6KrVPIk
                - generic [ref=e286]:
                  - button "Copy" [ref=e287] [cursor=pointer]
                  - link "Open" [ref=e291] [cursor=pointer]:
                    - /url: https://www.youtube.com/watch?v=t6ck6KrVPIk
              - generic [ref=e297]:
                - generic [ref=e298]:
                  - heading "AV1611 Articles" [level=3] [ref=e300]
                  - paragraph [ref=e301]: Articles defending the Authorised Version — King James Bible defence resources.
                  - link "av1611.org/articles →" [ref=e302] [cursor=pointer]:
                    - /url: https://www.av1611.org/articles
                - generic [ref=e303]:
                  - button "Copy" [ref=e304] [cursor=pointer]
                  - link "Open" [ref=e308] [cursor=pointer]:
                    - /url: https://www.av1611.org/articles
              - generic [ref=e314]:
                - generic [ref=e315]:
                  - heading "Preserved Words" [level=3] [ref=e317]
                  - paragraph [ref=e318]: Another King James Bible Believer — resources and articles defending the preserved Word of God.
                  - link "preservedwords.com →" [ref=e319] [cursor=pointer]:
                    - /url: https://www.preservedwords.com/bp/index.html
                - generic [ref=e320]:
                  - button "Copy" [ref=e321] [cursor=pointer]
                  - link "Open" [ref=e325] [cursor=pointer]:
                    - /url: https://www.preservedwords.com/bp/index.html
              - generic [ref=e331]:
                - generic [ref=e332]:
                  - heading "Brandplucked — KJB Articles" [level=3] [ref=e334]
                  - paragraph [ref=e335]: Extensive collection of articles defending the King James Bible.
                  - link "brandplucked.com →" [ref=e336] [cursor=pointer]:
                    - /url: https://brandplucked.com/kjbarticles.htm
                - generic [ref=e337]:
                  - button "Copy" [ref=e338] [cursor=pointer]
                  - link "Open" [ref=e342] [cursor=pointer]:
                    - /url: https://brandplucked.com/kjbarticles.htm
          - generic [ref=e347]:
            - button "1 John 5:7 Defence (4)" [ref=e348] [cursor=pointer]:
              - generic [ref=e349]:
                - generic [ref=e350]:
                  - heading "1 John 5:7 Defence" [level=2] [ref=e353]
                  - generic [ref=e354]: (4)
                - button "Copy" [ref=e356]
            - generic [ref=e362]:
              - generic [ref=e364]:
                - generic [ref=e365]:
                  - heading "1 John 5:7 - The 1st Century Latin/Spain Connection" [level=3] [ref=e367]
                  - paragraph [ref=e368]: Historical evidence connecting 1 John 5:7 to early Christian manuscripts and tradition.
                  - link "Read article →" [ref=e369] [cursor=pointer]:
                    - /url: https://kjvdebate.com/blog/f/i-john-57-the-1st-century-latinspain-connection
                - generic [ref=e370]:
                  - button "Copy" [ref=e371] [cursor=pointer]
                  - link "Open" [ref=e375] [cursor=pointer]:
                    - /url: https://kjvdebate.com/blog/f/i-john-57-the-1st-century-latinspain-connection
              - generic [ref=e381]:
                - generic [ref=e382]:
                  - heading "The Authenticity of 1 John 5:7" [level=3] [ref=e384]
                  - paragraph [ref=e385]: Historical evidence and church tradition supporting the Johannine Comma.
                  - link "Read article →" [ref=e386] [cursor=pointer]:
                    - /url: https://catalog.obitel-minsk.com/blog/2021/08/the-authenticity-of-1-john-57-historical-evidence-and-the-church-tradition
                - generic [ref=e387]:
                  - button "Copy" [ref=e388] [cursor=pointer]
                  - link "Open" [ref=e392] [cursor=pointer]:
                    - /url: https://catalog.obitel-minsk.com/blog/2021/08/the-authenticity-of-1-john-57-historical-evidence-and-the-church-tradition
              - generic [ref=e398]:
                - generic [ref=e399]:
                  - heading "Textus Receptus - 1 John 5:7" [level=3] [ref=e401]
                  - paragraph [ref=e402]: Wiki entry on 1 John 5:7 in the Textus Receptus (Received Text).
                  - link "textus-receptus.com →" [ref=e403] [cursor=pointer]:
                    - /url: https://textus-receptus.com/wiki/1_John_5:7
                - generic [ref=e404]:
                  - button "Copy" [ref=e405] [cursor=pointer]
                  - link "Open" [ref=e409] [cursor=pointer]:
                    - /url: https://textus-receptus.com/wiki/1_John_5:7
              - generic [ref=e415]:
                - generic [ref=e416]:
                  - heading "KJV Debate - 1 John 5:7 PDF" [level=3] [ref=e418]
                  - paragraph [ref=e419]: Comprehensive PDF resource defending 1 John 5:7.
                  - link "Download PDF →" [ref=e420] [cursor=pointer]:
                    - /url: https://kjvdebate.com/pdf
                - generic [ref=e421]:
                  - button "Copy" [ref=e422] [cursor=pointer]
                  - link "Open" [ref=e426] [cursor=pointer]:
                    - /url: https://kjvdebate.com/pdf
          - generic [ref=e431]:
            - button "Westcott & Hort Heresies (4)" [ref=e432] [cursor=pointer]:
              - generic [ref=e433]:
                - generic [ref=e434]:
                  - heading "Westcott & Hort Heresies" [level=2] [ref=e437]
                  - generic [ref=e438]: (4)
                - button "Copy" [ref=e440]
            - generic [ref=e446]:
              - generic [ref=e448]:
                - generic [ref=e449]:
                  - heading "Theological Heresies of Westcott and Hort" [level=3] [ref=e451]
                  - paragraph [ref=e452]: Detailed examination of the heretical beliefs held by Westcott and Hort, whose critical text corrupted Bible translations.
                  - link "Download PDF →" [ref=e453] [cursor=pointer]:
                    - /url: https://faithsaves.net/wp-content/uploads/2016/01/Theological-Heresies-of-Westcott-and-Hort-Waite.pdf
                - generic [ref=e454]:
                  - button "Copy" [ref=e455] [cursor=pointer]
                  - link "Open" [ref=e459] [cursor=pointer]:
                    - /url: https://faithsaves.net/wp-content/uploads/2016/01/Theological-Heresies-of-Westcott-and-Hort-Waite.pdf
              - generic [ref=e465]:
                - generic [ref=e466]:
                  - heading "Scattered Christians - Westcott & Hort" [level=3] [ref=e468]
                  - paragraph [ref=e469]: Analysis of Westcott and Hort's influence on modern Bible versions.
                  - link "Read article →" [ref=e470] [cursor=pointer]:
                    - /url: https://scatteredchristians.org/WescottHort.html
                - generic [ref=e471]:
                  - button "Copy" [ref=e472] [cursor=pointer]
                  - link "Open" [ref=e476] [cursor=pointer]:
                    - /url: https://scatteredchristians.org/WescottHort.html
              - generic [ref=e482]:
                - generic [ref=e483]:
                  - heading "Textus Receptus Bibles - Editorial Issues" [level=3] [ref=e485]
                  - paragraph [ref=e486]: Information on editorial changes and textual issues in modern versions.
                  - link "Read more →" [ref=e487] [cursor=pointer]:
                    - /url: https://textusreceptusbibles.com/Editorial/Umlauts
                - generic [ref=e488]:
                  - button "Copy" [ref=e489] [cursor=pointer]
                  - link "Open" [ref=e493] [cursor=pointer]:
                    - /url: https://textusreceptusbibles.com/Editorial/Umlauts
              - generic [ref=e499]:
                - generic [ref=e500]:
                  - heading "Differences Between Textus Receptus and NA/UBS" [level=3] [ref=e502]
                  - paragraph [ref=e503]: Detailed comparison of the Greek texts used in different Bible versions.
                  - link "Compare texts →" [ref=e504] [cursor=pointer]:
                    - /url: https://textusreceptusbibles.com/Differences_Between_Textus_Receptus_and_NaUbs
                - generic [ref=e505]:
                  - button "Copy" [ref=e506] [cursor=pointer]
                  - link "Open" [ref=e510] [cursor=pointer]:
                    - /url: https://textusreceptusbibles.com/Differences_Between_Textus_Receptus_and_NaUbs
          - generic [ref=e515]:
            - button "NKJV Exposed (5)" [ref=e516] [cursor=pointer]:
              - generic [ref=e517]:
                - generic [ref=e518]:
                  - heading "NKJV Exposed" [level=2] [ref=e521]
                  - generic [ref=e522]: (5)
                - button "Copy" [ref=e524]
            - generic [ref=e530]:
              - generic [ref=e532]:
                - generic [ref=e533]:
                  - heading "AV1611 - NKJV Exposed" [level=3] [ref=e535]
                  - paragraph [ref=e536]: Comprehensive analysis showing the NKJV is not the King James Bible.
                  - link "av1611.org →" [ref=e537] [cursor=pointer]:
                    - /url: https://www.av1611.org/nkjv.html
                - generic [ref=e538]:
                  - button "Copy" [ref=e539] [cursor=pointer]
                  - link "Open" [ref=e543] [cursor=pointer]:
                    - /url: https://www.av1611.org/nkjv.html
              - generic [ref=e549]:
                - generic [ref=e550]:
                  - heading "TBS - What Today's Christian Needs to Know About NKJV" [level=3] [ref=e552]
                  - paragraph [ref=e553]: Official resource from The Bible For Today highlighting NKJV issues.
                  - link "Read article →" [ref=e554] [cursor=pointer]:
                    - /url: https://www.tbsbibles.org/page/WhatTodaysChristianNeedsToKnowAboutTheNewKingJamesVersion
                - generic [ref=e555]:
                  - button "Copy" [ref=e556] [cursor=pointer]
                  - link "Open" [ref=e560] [cursor=pointer]:
                    - /url: https://www.tbsbibles.org/page/WhatTodaysChristianNeedsToKnowAboutTheNewKingJamesVersion
              - generic [ref=e566]:
                - generic [ref=e567]:
                  - heading "TBS - Does the NKJV Live Up to Its Claims?" [level=3] [ref=e569]
                  - paragraph [ref=e570]: Critical examination of NKJV translation claims and accuracy.
                  - link "Read article →" [ref=e571] [cursor=pointer]:
                    - /url: https://www.tbsbibles.org/page/DoesTheNKJVLiveUpToItsClaims
                - generic [ref=e572]:
                  - button "Copy" [ref=e573] [cursor=pointer]
                  - link "Open" [ref=e577] [cursor=pointer]:
                    - /url: https://www.tbsbibles.org/page/DoesTheNKJVLiveUpToItsClaims
              - generic [ref=e583]:
                - generic [ref=e584]:
                  - heading "TBS - The New King James Version Overview" [level=3] [ref=e586]
                  - paragraph [ref=e587]: Detailed overview of NKJV problems and textual issues.
                  - link "Read article →" [ref=e588] [cursor=pointer]:
                    - /url: https://www.tbsbibles.org/page/TheNewKingJamesVersion
                - generic [ref=e589]:
                  - button "Copy" [ref=e590] [cursor=pointer]
                  - link "Open" [ref=e594] [cursor=pointer]:
                    - /url: https://www.tbsbibles.org/page/TheNewKingJamesVersion
              - generic [ref=e600]:
                - generic [ref=e601]:
                  - heading "TBS - An Examination of the NKJV (Parts 1 & 2)" [level=3] [ref=e603]
                  - paragraph [ref=e604]: Comprehensive two-part examination of NKJV translation errors.
                  - link "Download PDFs →" [ref=e605] [cursor=pointer]:
                    - /url: https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/An-Examination-of-NKJV-Part-1.pdf
                - generic [ref=e606]:
                  - button "Copy" [ref=e607] [cursor=pointer]
                  - link "Open" [ref=e611] [cursor=pointer]:
                    - /url: https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/An-Examination-of-NKJV-Part-1.pdf
          - generic [ref=e616]:
            - button "Living Bible Exposed (3)" [ref=e617] [cursor=pointer]:
              - generic [ref=e618]:
                - generic [ref=e619]:
                  - heading "Living Bible Exposed" [level=2] [ref=e622]
                  - generic [ref=e623]: (3)
                - button "Copy" [ref=e625]
            - generic [ref=e631]:
              - generic [ref=e633]:
                - generic [ref=e634]:
                  - heading "TBS - The Living Bible Exposed" [level=3] [ref=e636]
                  - paragraph [ref=e637]: Official resource exposing errors and problems in the Living Bible paraphrase.
                  - link "Download PDF →" [ref=e638] [cursor=pointer]:
                    - /url: https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/The-Living-Bible.pdf
                - generic [ref=e639]:
                  - button "Copy" [ref=e640] [cursor=pointer]
                  - link "Open" [ref=e644] [cursor=pointer]:
                    - /url: https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/The-Living-Bible.pdf
              - generic [ref=e650]:
                - generic [ref=e651]:
                  - heading "Jesus is Savior - Living Bible Exposed" [level=3] [ref=e653]
                  - paragraph [ref=e654]: Comprehensive resource exposing the Living Bible's doctrinal problems.
                  - link "Read article →" [ref=e655] [cursor=pointer]:
                    - /url: https://www.jesus-is-savior.com/Bible/Living%20Bible/lb_exposed.htm
                - generic [ref=e656]:
                  - button "Copy" [ref=e657] [cursor=pointer]
                  - link "Open" [ref=e661] [cursor=pointer]:
                    - /url: https://www.jesus-is-savior.com/Bible/Living%20Bible/lb_exposed.htm
              - generic [ref=e667]:
                - generic [ref=e668]:
                  - heading "Jesus is Savior - NLT Bible Exposed" [level=3] [ref=e670]
                  - paragraph [ref=e671]: Detailed analysis of the New Living Translation's translation errors.
                  - link "Read article →" [ref=e672] [cursor=pointer]:
                    - /url: https://jesus-is-savior.com/Bible/NLT/nlt_exposed.htm
                - generic [ref=e673]:
                  - button "Copy" [ref=e674] [cursor=pointer]
                  - link "Open" [ref=e678] [cursor=pointer]:
                    - /url: https://jesus-is-savior.com/Bible/NLT/nlt_exposed.htm
          - generic [ref=e683]:
            - button "ESV & NIV Exposed (7)" [ref=e684] [cursor=pointer]:
              - generic [ref=e685]:
                - generic [ref=e686]:
                  - heading "ESV & NIV Exposed" [level=2] [ref=e689]
                  - generic [ref=e690]: (7)
                - button "Copy" [ref=e692]
            - generic [ref=e698]:
              - generic [ref=e700]:
                - generic [ref=e701]:
                  - heading "Brandplucked - Is the ESV Inerrant?" [level=3] [ref=e703]
                  - paragraph [ref=e704]: Critical analysis of ESV translation choices and inerrancy claims.
                  - link "Read article →" [ref=e705] [cursor=pointer]:
                    - /url: https://brandplucked.com/is-the-esv-inerrant.html
                - generic [ref=e706]:
                  - button "Copy" [ref=e707] [cursor=pointer]
                  - link "Open" [ref=e711] [cursor=pointer]:
                    - /url: https://brandplucked.com/is-the-esv-inerrant.html
              - generic [ref=e717]:
                - generic [ref=e718]:
                  - heading "Brandplucked - The ESV Examined" [level=3] [ref=e720]
                  - paragraph [ref=e721]: Comprehensive examination of ESV translation problems.
                  - link "Read article →" [ref=e722] [cursor=pointer]:
                    - /url: https://brandplucked.com/theesv.htm
                - generic [ref=e723]:
                  - button "Copy" [ref=e724] [cursor=pointer]
                  - link "Open" [ref=e728] [cursor=pointer]:
                    - /url: https://brandplucked.com/theesv.htm
              - generic [ref=e734]:
                - generic [ref=e735]:
                  - heading "TBS - English Standard Version" [level=3] [ref=e737]
                  - paragraph [ref=e738]: Official analysis of ESV translation issues.
                  - link "Read article →" [ref=e739] [cursor=pointer]:
                    - /url: https://www.tbsbibles.org/page/EnglishStandardVersion
                - generic [ref=e740]:
                  - button "Copy" [ref=e741] [cursor=pointer]
                  - link "Open" [ref=e745] [cursor=pointer]:
                    - /url: https://www.tbsbibles.org/page/EnglishStandardVersion
              - generic [ref=e751]:
                - generic [ref=e752]:
                  - heading "AV1611 - NIV Exposed" [level=3] [ref=e754]
                  - paragraph [ref=e755]: Detailed comparison of NIV problems and doctrinal deletions.
                  - link "Read article →" [ref=e756] [cursor=pointer]:
                    - /url: https://www.av1611.org/kjv/nivteen.html
                - generic [ref=e757]:
                  - button "Copy" [ref=e758] [cursor=pointer]
                  - link "Open" [ref=e762] [cursor=pointer]:
                    - /url: https://www.av1611.org/kjv/nivteen.html
              - generic [ref=e768]:
                - generic [ref=e769]:
                  - heading "Jesus is Precious - NIV Missing Verses" [level=3] [ref=e771]
                  - paragraph [ref=e772]: Documentation of verses omitted from the NIV translation.
                  - link "Read article →" [ref=e773] [cursor=pointer]:
                    - /url: https://www.jesusisprecious.org/bible/niv/acts_8-37_missing.htm
                - generic [ref=e774]:
                  - button "Copy" [ref=e775] [cursor=pointer]
                  - link "Open" [ref=e779] [cursor=pointer]:
                    - /url: https://www.jesusisprecious.org/bible/niv/acts_8-37_missing.htm
              - generic [ref=e785]:
                - generic [ref=e786]:
                  - heading "Scion of Zion - NIV 1984 vs 2011" [level=3] [ref=e788]
                  - paragraph [ref=e789]: Comparison of changes made between NIV versions.
                  - link "Compare versions →" [ref=e790] [cursor=pointer]:
                    - /url: https://www.scionofzion.com/niv%201984%20and%202011.html
                - generic [ref=e791]:
                  - button "Copy" [ref=e792] [cursor=pointer]
                  - link "Open" [ref=e796] [cursor=pointer]:
                    - /url: https://www.scionofzion.com/niv%201984%20and%202011.html
              - generic [ref=e802]:
                - generic [ref=e803]:
                  - heading "Jesus is Savior - NIV Exposed" [level=3] [ref=e805]
                  - paragraph [ref=e806]: Comprehensive resource exposing the NIV's doctrinal corruptions.
                  - link "Read article →" [ref=e807] [cursor=pointer]:
                    - /url: https://www.jesus-is-savior.com/Bible/NIV/new_international_version_exposed.htm
                - generic [ref=e808]:
                  - button "Copy" [ref=e809] [cursor=pointer]
                  - link "Open" [ref=e813] [cursor=pointer]:
                    - /url: https://www.jesus-is-savior.com/Bible/NIV/new_international_version_exposed.htm
    - navigation [ref=e818]:
      - generic [ref=e820]:
        - button "Home" [ref=e821] [cursor=pointer]
        - button "Contents" [ref=e826] [cursor=pointer]
        - button "Read" [ref=e829] [cursor=pointer]
        - button "Gospel" [ref=e833] [cursor=pointer]
        - button "Toggle navigation rows" [ref=e837] [cursor=pointer]
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
      |           ^ Error: /kjb-defence @ 360px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```