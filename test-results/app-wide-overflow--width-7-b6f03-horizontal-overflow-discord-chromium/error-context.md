# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 768px] >> no horizontal overflow: /discord
- Location: tests/app-wide-overflow.spec.js:64:7

# Error details

```
Error: browser.newContext: Target page, context or browser has been closed
Browser logs:

[pid=15226][err] [0902/224033.987196:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 5 in Hebrews, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224033.987442:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 6 in Hebrews, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224033.987713:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 7 in Hebrews, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224033.987913:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 8 in Hebrews, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224033.989296:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 9 in Hebrews, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224033.990094:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 10 in Hebrews, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224033.991505:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 11 in Hebrews, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224033.992398:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 12 in Hebrews, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224033.993079:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 13 in Hebrews, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224033.993898:INFO:CONSOLE:276] "[PCE-PARSE] ✓ Book detected: James", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224033.994431:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 1 in James, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224033.995173:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 2 in James, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224033.996272:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 3 in James, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.004002:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 4 in James, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.008067:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 5 in James, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.012644:INFO:CONSOLE:276] "[PCE-PARSE] ✓ Book detected: 1 Peter", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.014071:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 1 in 1 Peter, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.014380:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 2 in 1 Peter, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.015296:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 3 in 1 Peter, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.016163:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 4 in 1 Peter, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.016753:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 5 in 1 Peter, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.017041:INFO:CONSOLE:276] "[PCE-PARSE] ✓ Book detected: 2 Peter", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.017304:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 1 in 2 Peter, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.018148:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 2 in 2 Peter, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.019686:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 3 in 2 Peter, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.019993:INFO:CONSOLE:276] "[PCE-PARSE] ✓ Book detected: 1 John", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.020196:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 1 in 1 John, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.020477:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 2 in 1 John, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.020827:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 3 in 1 John, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.021433:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 4 in 1 John, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.021975:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 5 in 1 John, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.022206:INFO:CONSOLE:276] "[PCE-PARSE] ✓ Book detected: 2 John", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.022726:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 1 in 2 John, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.023257:INFO:CONSOLE:276] "[PCE-PARSE] ✓ Book detected: 3 John", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.023672:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 1 in 3 John, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.024255:INFO:CONSOLE:276] "[PCE-PARSE] ✓ Book detected: Jude", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.024640:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 1 in Jude, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.024846:INFO:CONSOLE:276] "[PCE-PARSE] ✓ Book detected: Revelation", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.025178:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 1 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.025481:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 2 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.025738:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 3 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.026265:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 4 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.026904:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 5 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.027179:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 6 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.027290:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 7 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.027829:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 8 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.027945:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 9 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.028043:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 10 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.028127:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 11 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.028219:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 12 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.028301:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 13 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.028586:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 14 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.029002:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 15 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.029411:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 16 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.029856:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 17 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.030146:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 18 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.030667:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 19 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.030989:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 20 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.031463:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 21 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.031752:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 22 in Revelation, superscript=false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.032122:INFO:CONSOLE:276] "[PCE-PARSE] ✓ 31102 verses across 66 books", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.032513:INFO:CONSOLE:276] "[PCE-PARSE] Books: Genesis:50ch, Exodus:40ch, Leviticus:27ch, Numbers:36ch, Deuteronomy:34ch, Joshua:24ch, Judges:21ch, Ruth:4ch, 1 Samuel:31ch, 2 Samuel:24ch, 1 Kings:22ch, 2 Kings:25ch, 1 Chronicles:29ch, 2 Chronicles:36ch, Ezra:10ch, Nehemiah:13ch, Esther:10ch, Job:42ch, Psalms:150ch, Proverbs:31ch, Ecclesiastes:12ch, Song of Solomon:8ch, Isaiah:66ch, Jeremiah:52ch, Lamentations:5ch, Ezekiel:48ch, Daniel:12ch, Hosea:14ch, Joel:3ch, Amos:9ch, Obadiah:1ch, Jonah:4ch, Micah:7ch, Nahum:3ch, Habakkuk:3ch, Zephaniah:3ch, Haggai:2ch, Zechariah:14ch, Malachi:4ch, Matthew:28ch, Mark:16ch, Luke:24ch, John:21ch, Acts:28ch, Romans:16ch, 1 Corinthians:16ch, 2 Corinthians:13ch, Galatians:6ch, Ephesians:6ch, Philippians:4ch, Colossians:4ch, 1 Thessalonians:5ch, 2 Thessalonians:3ch, 1 Timothy:6ch, 2 Timothy:4ch, Titus:3ch, Philemon:1ch, Hebrews:13ch, James:5ch, 1 Peter:5ch, 2 Peter:3ch, 1 John:5ch, 2 John:1ch, 3 John:1ch, Jude:1ch, Revelation:22ch", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.033051:INFO:CONSOLE:276] "[PCE-PARSE] Colophons: 14 entries", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.033371:INFO:CONSOLE:276] "[VERIFY] Genesis 1:1: And the earth was without form, and void; and darkness [was] upon the face of the deep. And the Spirit of God moved upon the face of the waters.", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.033855:INFO:CONSOLE:276] "[VERIFY] Has brackets? true", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.034338:INFO:CONSOLE:276] "[VERIFY] Has pilcrows? false", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.035204:INFO:CONSOLE:276] "[VERIFY] Verses with pilcrows: 2970", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.035441:INFO:CONSOLE:276] "[VERIFY] Verses with brackets (italics): 14234", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.988252:INFO:CONSOLE:274] "IndexedDB: Cleared Bible cache", source: http://localhost:4173/assets/index-WAXb40gJ.js (274)
[pid=15226][err] [0902/224034.990521:INFO:CONSOLE:274] "IndexedDB: Saved Bible data successfully", source: http://localhost:4173/assets/index-WAXb40gJ.js (274)
[pid=15226][err] [0902/224034.990776:INFO:CONSOLE:276] "[CACHE] ✓ Saved to IndexedDB, version: v20260815_copy_repair , 14 colophons", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224034.991197:INFO:CONSOLE:276] "[CACHE] ✓ Fresh data saved", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224039.187383:INFO:CONSOLE:281] "[SW] Prewarm requested for 165 assets", source: http://localhost:4173/assets/index-WAXb40gJ.js (281)
[pid=15226][err] [0902/224040.332373:INFO:CONSOLE:281] "[SW] Registered: http://localhost:4173/", source: http://localhost:4173/assets/index-WAXb40gJ.js (281)
[pid=15226][err] [0902/224040.388142:INFO:CONSOLE:276] "[KJB Splash] Mode: subsequent Incognito: true", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224040.388350:INFO:CONSOLE:276] "[KJB Splash] WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224040.857312:INFO:CONSOLE:252] "App state check failed: Base44Error: Request failed with status code 404", source: http://localhost:4173/assets/index-WAXb40gJ.js (252)
[pid=15226][err] [0902/224041.006413:INFO:CONSOLE:34] "Unrecognized feature: 'web-share'.", source: http://localhost:4173/assets/index-WAXb40gJ.js (34)
[pid=15226][err] [0902/224041.907036:INFO:CONSOLE:276] "[Splash] Summary", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224041.907555:INFO:CONSOLE:276] "1. WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224041.907989:INFO:CONSOLE:276] "console.groupEnd", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224043.871761:INFO:CONSOLE:252] "[Auth] Loading timeout - allowing app to continue", source: http://localhost:4173/assets/index-WAXb40gJ.js (252)
[pid=15226][err] [0902/224044.909552:ERROR:dbus/bus.cc:405] Failed to connect to the bus: Failed to connect to socket /run/dbus/system_bus_socket: No such file or directory
[pid=15226][err] [0902/224044.910023:ERROR:dbus/bus.cc:405] Failed to connect to the bus: Failed to connect to socket /run/dbus/system_bus_socket: No such file or directory
[pid=15226][err] [0902/224044.910026:WARNING:dbus/property.cc:94] Failed to connect to PropertiesChangedsignal.
[pid=15226][err] [0902/224044.910312:ERROR:dbus/object_proxy.cc:572] Failed to call method: org.freedesktop.DBus.Properties.GetAll: object_path= /org/freedesktop/UPower/devices/DisplayDevice: unknown error type: 
[pid=15226][err] [0902/224044.910425:WARNING:dbus/property.cc:174] GetAll request failed for: org.freedesktop.UPower.Device
[pid=15226][err] [0902/224048.373586:ERROR:content/public/browser/web_contents_delegate.cc:310] WebContentsDelegate::CheckMediaAccessPermission: Not supported.
[pid=15226][err] [0902/224048.373639:ERROR:content/public/browser/web_contents_delegate.cc:310] WebContentsDelegate::CheckMediaAccessPermission: Not supported.
[pid=15226][err] [0902/224048.455696:ERROR:content/public/browser/web_contents_delegate.cc:310] WebContentsDelegate::CheckMediaAccessPermission: Not supported.
[pid=15226][err] [0902/224048.455999:ERROR:content/public/browser/web_contents_delegate.cc:310] WebContentsDelegate::CheckMediaAccessPermission: Not supported.
[pid=15226][err] [0902/224048.984796:ERROR:content/public/browser/web_contents_delegate.cc:310] WebContentsDelegate::CheckMediaAccessPermission: Not supported.
[pid=15226][err] [0902/224048.984891:ERROR:content/public/browser/web_contents_delegate.cc:310] WebContentsDelegate::CheckMediaAccessPermission: Not supported.
[pid=15226][err] [0902/224049.157180:INFO:CONSOLE:281] "[SW] Prewarm requested for 165 assets", source: http://localhost:4173/assets/index-WAXb40gJ.js (281)
[pid=15226][err] [0902/224049.297925:INFO:CONSOLE:0] "No available adapters.", source: https://www.youtube-nocookie.com/embed/rW7cF6T8LSs?rel=0&modestbranding=1&playsinline=1 (0)
[pid=15226][err] [0902/224049.314453:INFO:CONSOLE:0] "No available adapters.", source: https://www.youtube-nocookie.com/embed/Vpn00jurClA?rel=0&modestbranding=1&playsinline=1 (0)
[pid=15226][err] [0902/224049.332936:INFO:CONSOLE:0] "No available adapters.", source: https://www.youtube-nocookie.com/embed/6ZCvPnYxn0A?rel=0&modestbranding=1&playsinline=1 (0)
[pid=15226][err] [0902/224052.251102:INFO:CONSOLE:281] "[SW] Registered: http://localhost:4173/", source: http://localhost:4173/assets/index-WAXb40gJ.js (281)
[pid=15226][err] [0902/224052.331378:INFO:CONSOLE:252] "App state check failed: Base44Error: Request failed with status code 404", source: http://localhost:4173/assets/index-WAXb40gJ.js (252)
[pid=15226][err] [0902/224052.335469:INFO:CONSOLE:276] "[KJB Splash] Mode: subsequent Incognito: true", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224052.336010:INFO:CONSOLE:276] "[KJB Splash] WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224053.862968:INFO:CONSOLE:276] "[Splash] Summary", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224053.864972:INFO:CONSOLE:276] "1. WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224053.865597:INFO:CONSOLE:276] "console.groupEnd", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224055.239432:INFO:CONSOLE:252] "[Auth] Loading timeout - allowing app to continue", source: http://localhost:4173/assets/index-WAXb40gJ.js (252)
[pid=15226][err] [0902/224057.936950:INFO:CONSOLE:281] "[SW] Registered: http://localhost:4173/", source: http://localhost:4173/assets/index-WAXb40gJ.js (281)
[pid=15226][err] [0902/224057.948323:INFO:CONSOLE:252] "App state check failed: Base44Error: Request failed with status code 404", source: http://localhost:4173/assets/index-WAXb40gJ.js (252)
[pid=15226][err] [0902/224058.062797:INFO:CONSOLE:276] "[KJB Splash] Mode: subsequent Incognito: true", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224058.063686:INFO:CONSOLE:276] "[KJB Splash] WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224059.861404:INFO:CONSOLE:276] "[Splash] Summary", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224059.862361:INFO:CONSOLE:276] "1. WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224059.862701:INFO:CONSOLE:276] "console.groupEnd", source: http://localhost:4173/assets/index-WAXb40gJ.js (276)
[pid=15226][err] [0902/224100.893689:INFO:CONSOLE:252] "[Auth] Loading timeout - allowing app to continue", source: http://localhost:4173/assets/index-WAXb40gJ.js (252)
[pid=15226][err] Received signal 11 SEGV_MAPERR 0000000001b0
[pid=15226][err] #0 0x5590d4946413 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4265412)
[pid=15226][err] #1 0x5590d7c2cdf4 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x754bdf3)
[pid=15226][err] #2 0x2b2cc7b71050 (/usr/lib/x86_64-linux-gnu/libc.so.6+0x3c04f)
[pid=15226][err] #3 0x5590d723a19a (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x6b59199)
[pid=15226][err] #4 0x5590d7201a29 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x6b20a28)
[pid=15226][err] #5 0x5590d70596d2 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x69786d1)
[pid=15226][err] #6 0x5590d705517c (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x697417b)
[pid=15226][err] #7 0x5590d3d87ead (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a6eac)
[pid=15226][err] #8 0x5590d3d87ac4 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a6ac3)
[pid=15226][err] #9 0x5590d5415474 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4d34473)
[pid=15226][err] #10 0x5590d3d87e1f (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a6e1e)
[pid=15226][err] #11 0x5590d3d822de (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a12dd)
[pid=15226][err] #12 0x5590d3d815ed (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a05ec)
[pid=15226][err] #13 0x5590d71b16f5 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x6ad06f4)
[pid=15226][err] #14 0x5590d2544035 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x1e63034)
[pid=15226][err] #15 0x5590d2552bf1 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x1e71bf0)
[pid=15226][err] #16 0x2b2cc70ec789 (/usr/lib/x86_64-linux-gnu/libglib-2.0.so.0.7400.6+0x54788)
[pid=15226][err] #17 0x298000031b60 ([anon:partition_alloc]+0x298000031b5f)
[pid=15226][err] #18 0x5590d38acfe9 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x31cbfe8)
[pid=15226][err] #19 0x5590d38ac701 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x31cb700)
[pid=15226][err] #20 0x5590d4b557ef (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x44747ee)
[pid=15226][err] #21 0x5590d49af356 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42ce355)
[pid=15226][err] #22 0x5590d49af4d6 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42ce4d5)
[pid=15226][err] #23 0x5590d49b1d1e (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42d0d1d)
[pid=15226][err] #24 0x5590d49af839 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42ce838)
[pid=15226][err] #25 0x5590d49aec0e (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42cdc0d)
[pid=15226][err] #26 0x5590d53fea70 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4d1da6f)
[pid=15226][err] #27 0x5590d53ffc32 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4d1ec31)
[pid=15226][err] #28 0x2b2cc7b5c24a (/usr/lib/x86_64-linux-gnu/libc.so.6+0x27249)
[pid=15226][err]   r8: 0000000000000070  r9: 000000000000002f r10: 0000000000000009 r11: 00002984019ddec0
[pid=15226][err]  r12: 0000000000000000 r13: 0000298401078b40 r14: 00000000000000a8 r15: 0000000000000000
[pid=15226][err]   di: 00007eda8c58ad78  si: 00000000000000a8  bp: 00007eda8c58ac20  bx: 00007eda8c58ad78
[pid=15226][err]   dx: 0000000000000009  ax: 0000000000000000  cx: 74736f686c61636f  sp: 00007eda8c58aa20
[pid=15226][err]   ip: 00005590d35093cd efl: 0000000000010202 cgf: 002b000000000033 erf: 0000000000000000
[pid=15226][err]  trp: 0000000000000000 msk: 0000000000000000 cr2: 00000000000001b0
[pid=15226][err] [end of stack trace]
```