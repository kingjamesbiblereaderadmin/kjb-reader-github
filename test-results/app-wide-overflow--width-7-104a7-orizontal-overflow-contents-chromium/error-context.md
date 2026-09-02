# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 768px] >> no horizontal overflow: /contents
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: browserContext.close: Test ended.
Browser logs:

[pid=28742][err] [0902/215833.482320:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 2 in 2 Peter, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482335:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 3 in 2 Peter, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482349:INFO:CONSOLE:276] "[PCE-PARSE] ✓ Book detected: 1 John", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482372:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 1 in 1 John, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482387:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 2 in 1 John, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482403:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 3 in 1 John, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482419:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 4 in 1 John, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482434:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 5 in 1 John, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482449:INFO:CONSOLE:276] "[PCE-PARSE] ✓ Book detected: 2 John", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482467:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 1 in 2 John, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482489:INFO:CONSOLE:276] "[PCE-PARSE] ✓ Book detected: 3 John", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482506:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 1 in 3 John, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482520:INFO:CONSOLE:276] "[PCE-PARSE] ✓ Book detected: Jude", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482536:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 1 in Jude, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482558:INFO:CONSOLE:276] "[PCE-PARSE] ✓ Book detected: Revelation", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482576:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 1 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482591:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 2 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482612:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 3 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482627:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 4 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482643:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 5 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482658:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 6 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482672:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 7 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482689:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 8 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482704:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 9 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482724:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 10 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482739:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 11 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482753:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 12 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482771:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 13 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482786:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 14 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482802:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 15 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482892:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 16 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482915:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 17 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482931:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 18 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482946:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 19 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482961:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 20 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482978:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 21 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.482993:INFO:CONSOLE:276] "[PCE-PARSE] Chapter 22 in Revelation, superscript=false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.483009:INFO:CONSOLE:276] "[PCE-PARSE] ✓ 31102 verses across 66 books", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.483045:INFO:CONSOLE:276] "[PCE-PARSE] Books: Genesis:50ch, Exodus:40ch, Leviticus:27ch, Numbers:36ch, Deuteronomy:34ch, Joshua:24ch, Judges:21ch, Ruth:4ch, 1 Samuel:31ch, 2 Samuel:24ch, 1 Kings:22ch, 2 Kings:25ch, 1 Chronicles:29ch, 2 Chronicles:36ch, Ezra:10ch, Nehemiah:13ch, Esther:10ch, Job:42ch, Psalms:150ch, Proverbs:31ch, Ecclesiastes:12ch, Song of Solomon:8ch, Isaiah:66ch, Jeremiah:52ch, Lamentations:5ch, Ezekiel:48ch, Daniel:12ch, Hosea:14ch, Joel:3ch, Amos:9ch, Obadiah:1ch, Jonah:4ch, Micah:7ch, Nahum:3ch, Habakkuk:3ch, Zephaniah:3ch, Haggai:2ch, Zechariah:14ch, Malachi:4ch, Matthew:28ch, Mark:16ch, Luke:24ch, John:21ch, Acts:28ch, Romans:16ch, 1 Corinthians:16ch, 2 Corinthians:13ch, Galatians:6ch, Ephesians:6ch, Philippians:4ch, Colossians:4ch, 1 Thessalonians:5ch, 2 Thessalonians:3ch, 1 Timothy:6ch, 2 Timothy:4ch, Titus:3ch, Philemon:1ch, Hebrews:13ch, James:5ch, 1 Peter:5ch, 2 Peter:3ch, 1 John:5ch, 2 John:1ch, 3 John:1ch, Jude:1ch, Revelation:22ch", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.483076:INFO:CONSOLE:276] "[PCE-PARSE] Colophons: 14 entries", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.483093:INFO:CONSOLE:276] "[VERIFY] Genesis 1:1: And the earth was without form, and void; and darkness [was] upon the face of the deep. And the Spirit of God moved upon the face of the waters.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.483116:INFO:CONSOLE:276] "[VERIFY] Has brackets? true", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.483131:INFO:CONSOLE:276] "[VERIFY] Has pilcrows? false", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.483147:INFO:CONSOLE:276] "[VERIFY] Verses with pilcrows: 2970", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215833.483162:INFO:CONSOLE:276] "[VERIFY] Verses with brackets (italics): 14234", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215834.069394:INFO:CONSOLE:274] "IndexedDB: Cleared Bible cache", source: http://localhost:4173/assets/index-CKevY52_.js (274)
[pid=28742][err] [0902/215834.340802:INFO:CONSOLE:274] "IndexedDB: Saved Bible data successfully", source: http://localhost:4173/assets/index-CKevY52_.js (274)
[pid=28742][err] [0902/215834.340849:INFO:CONSOLE:276] "[CACHE] ✓ Saved to IndexedDB, version: v20260815_copy_repair , 14 colophons", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215834.340872:INFO:CONSOLE:276] "[CACHE] ✓ Fresh data saved", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215834.340890:INFO:CONSOLE:1] "[fetchChapter] Got 31 verses for Genesis 1", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215834.340909:INFO:CONSOLE:1] "[fetchChapter] Sample verse 1: IN the beginning God created the heaven and the earth.", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215834.340925:INFO:CONSOLE:1] "[fetchChapter] Has brackets? true", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215834.472570:INFO:CONSOLE:1] "[RENDER] Sample verse with brackets: ¶ And God said, Let there be lights in the firmament of the heaven to divide the day from the night; and let them be for signs, and for seasons, and for days, and years:", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215834.472662:INFO:CONSOLE:1] "[RENDER] Has pilcrow (¶)? true", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215834.472694:INFO:CONSOLE:1] "[RENDER] Pilcrow count: 1", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215834.472776:INFO:CONSOLE:12] "[ToolbarState] Restore attempt - saved: null", source: http://localhost:4173/assets/BibleReader-DPNSpRjD.js (12)
[pid=28742][err] [0902/215835.427196:INFO:CONSOLE:1] "[RENDER] Sample verse with brackets: IN the beginning God created the heaven and the earth.", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215835.427301:INFO:CONSOLE:1] "[RENDER] Has pilcrow (¶)? false", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215835.427337:INFO:CONSOLE:1] "[RENDER] Pilcrow count: 0", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215835.427380:INFO:CONSOLE:1] "[RENDER] Sample verse with brackets: And the earth brought forth grass, [and] herb yielding seed after his kind, and the tree yielding fruit, whose seed [was] in itself, after his kind: and God saw that [it was] good.", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215835.427424:INFO:CONSOLE:1] "[RENDER] Has pilcrow (¶)? false", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215835.427457:INFO:CONSOLE:1] "[RENDER] Pilcrow count: 0", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215835.427487:INFO:CONSOLE:1] "[RENDER] Sample verse with brackets: And the evening and the morning were the fifth day.", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215835.427521:INFO:CONSOLE:1] "[RENDER] Has pilcrow (¶)? false", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215835.427551:INFO:CONSOLE:1] "[RENDER] Pilcrow count: 0", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215835.653351:INFO:CONSOLE:1] "[RENDER] Sample verse with brackets: And God made the firmament, and divided the waters which [were] under the firmament from the waters which [were] above the firmament: and it was so.", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215835.653411:INFO:CONSOLE:1] "[RENDER] Has pilcrow (¶)? false", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215835.653442:INFO:CONSOLE:1] "[RENDER] Pilcrow count: 0", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215835.653472:INFO:CONSOLE:1] "[RENDER] Sample verse with brackets: And God created great whales, and every living creature that moveth, which the waters brought forth abundantly, after their kind, and every winged fowl after his kind: and God saw that [it was] good.", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215835.653501:INFO:CONSOLE:1] "[RENDER] Has pilcrow (¶)? false", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215835.653528:INFO:CONSOLE:1] "[RENDER] Pilcrow count: 0", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215835.653555:INFO:CONSOLE:12] "[ToolbarState] Restore attempt - saved: null", source: http://localhost:4173/assets/BibleReader-DPNSpRjD.js (12)
[pid=28742][err] [0902/215835.653574:INFO:CONSOLE:1] "[RENDER] Sample verse with brackets: And the earth brought forth grass, [and] herb yielding seed after his kind, and the tree yielding fruit, whose seed [was] in itself, after his kind: and God saw that [it was] good.", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215835.653605:INFO:CONSOLE:1] "[RENDER] Has pilcrow (¶)? false", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215835.653632:INFO:CONSOLE:1] "[RENDER] Pilcrow count: 0", source: http://localhost:4173/assets/bibleApi-CptyZKCB.js (1)
[pid=28742][err] [0902/215841.958163:INFO:CONSOLE:276] "[REFRESH] Cache refresh due, checking for updates...", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215841.958244:INFO:CONSOLE:276] "[REFRESH] Cache refresh due, checking for updates...", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215842.188324:INFO:CONSOLE:281] "[SW] Registered: http://localhost:4173/", source: http://localhost:4173/assets/index-CKevY52_.js (281)
[pid=28742][err] [0902/215843.378410:INFO:CONSOLE:252] "App state check failed: Base44Error: Request failed with status code 404", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=28742][err] [0902/215843.989374:INFO:CONSOLE:276] "[KJB Splash] Mode: subsequent Incognito: true", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215844.081835:INFO:CONSOLE:276] "[KJB Splash] WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215844.390263:INFO:CONSOLE:34] "Unrecognized feature: 'web-share'.", source: http://localhost:4173/assets/index-CKevY52_.js (34)
[pid=28742][err] [0902/215845.522833:INFO:CONSOLE:276] "[Splash] Summary", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215845.522934:INFO:CONSOLE:276] "1. WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215845.522996:INFO:CONSOLE:276] "console.groupEnd", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215845.523122:INFO:CONSOLE:252] "[Auth] Loading timeout - allowing app to continue", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=28742][err] [0902/215848.428448:ERROR:dbus/bus.cc:405] Failed to connect to the bus: Failed to connect to socket /run/dbus/system_bus_socket: No such file or directory
[pid=28742][err] [0902/215848.428521:ERROR:dbus/bus.cc:405] Failed to connect to the bus: Failed to connect to socket /run/dbus/system_bus_socket: No such file or directory
[pid=28742][err] [0902/215848.436146:WARNING:dbus/property.cc:94] Failed to connect to PropertiesChangedsignal.
[pid=28742][err] [0902/215848.436170:ERROR:dbus/object_proxy.cc:572] Failed to call method: org.freedesktop.DBus.Properties.GetAll: object_path= /org/freedesktop/UPower/devices/DisplayDevice: unknown error type: 
[pid=28742][err] [0902/215848.436175:WARNING:dbus/property.cc:174] GetAll request failed for: org.freedesktop.UPower.Device
[pid=28742][err] [0902/215852.563681:ERROR:content/public/browser/web_contents_delegate.cc:310] WebContentsDelegate::CheckMediaAccessPermission: Not supported.
[pid=28742][err] [0902/215852.582085:ERROR:content/public/browser/web_contents_delegate.cc:310] WebContentsDelegate::CheckMediaAccessPermission: Not supported.
[pid=28742][err] [0902/215853.197034:WARNING:media/audio/linux/audio_manager_linux.cc:53] Falling back to ALSA for audio output. PulseAudio is not available or could not be initialized.
[pid=28742][err] [0902/215853.232986:INFO:CONSOLE:0] "No available adapters.", source: https://www.youtube-nocookie.com/embed/znP9Dr6tOzU?rel=0&modestbranding=1&playsinline=1 (0)
[pid=28742][err] [0902/215857.980844:INFO:CONSOLE:276] "[REFRESH] Cache refresh due, checking for updates...", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215858.012015:INFO:CONSOLE:276] "[REFRESH] Cache refresh due, checking for updates...", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215859.214483:INFO:CONSOLE:252] "App state check failed: Base44Error: Request failed with status code 404", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=28742][err] [0902/215859.242709:INFO:CONSOLE:281] "[SW] Registered: http://localhost:4173/", source: http://localhost:4173/assets/index-CKevY52_.js (281)
[pid=28742][err] [0902/215859.443570:INFO:CONSOLE:276] "[KJB Splash] Mode: subsequent Incognito: true", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215859.516139:INFO:CONSOLE:276] "[KJB Splash] WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215900.979067:INFO:CONSOLE:252] "[Auth] Loading timeout - allowing app to continue", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=28742][err] [0902/215900.979094:INFO:CONSOLE:276] "[Splash] Summary", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215900.979110:INFO:CONSOLE:276] "1. WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215900.979127:INFO:CONSOLE:276] "console.groupEnd", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215906.451476:INFO:CONSOLE:276] "[REFRESH] Cache refresh due, checking for updates...", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215906.460800:INFO:CONSOLE:276] "[REFRESH] Cache refresh due, checking for updates...", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215906.710014:INFO:CONSOLE:252] "App state check failed: Base44Error: Request failed with status code 404", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=28742][err] [0902/215907.122306:INFO:CONSOLE:281] "[SW] Registered: http://localhost:4173/", source: http://localhost:4173/assets/index-CKevY52_.js (281)
[pid=28742][err] [0902/215907.366211:INFO:CONSOLE:276] "[KJB Splash] Mode: subsequent Incognito: true", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215907.366254:INFO:CONSOLE:276] "[KJB Splash] WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215909.082019:INFO:CONSOLE:276] "[Splash] Summary", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215909.082082:INFO:CONSOLE:276] "1. WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215909.082107:INFO:CONSOLE:276] "console.groupEnd", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=28742][err] [0902/215909.544116:INFO:CONSOLE:252] "[Auth] Loading timeout - allowing app to continue", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=28742][err] Received signal 11 SEGV_MAPERR 0000000001b0
[pid=28742][err] #0 0x558db211a413 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4265412)
[pid=28742][err] #1 0x558db5400df4 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x754bdf3)
[pid=28742][err] #2 0x2ae58dc9e050 (/usr/lib/x86_64-linux-gnu/libc.so.6+0x3c04f)
[pid=28742][err] #3 0x558db4a0e19a (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x6b59199)
[pid=28742][err] #4 0x558db49d5a29 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x6b20a28)
[pid=28742][err] #5 0x558db482d6d2 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x69786d1)
[pid=28742][err] #6 0x558db482917c (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x697417b)
[pid=28742][err] #7 0x558db155bead (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a6eac)
[pid=28742][err] #8 0x558db155bac4 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a6ac3)
[pid=28742][err] #9 0x558db2be9474 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4d34473)
[pid=28742][err] #10 0x558db155be1f (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a6e1e)
[pid=28742][err] #11 0x558db15562de (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a12dd)
[pid=28742][err] #12 0x558db15555ed (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a05ec)
[pid=28742][err] #13 0x558db49856f5 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x6ad06f4)
[pid=28742][err] #14 0x558dafd18035 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x1e63034)
[pid=28742][err] #15 0x558dafd1cbe1 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x1e67be0)
[pid=28742][err] #16 0x558db1080fe9 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x31cbfe8)
[pid=28742][err] #17 0x558db1080701 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x31cb700)
[pid=28742][err] #18 0x558db23297ef (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x44747ee)
[pid=28742][err] #19 0x558db2183356 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42ce355)
[pid=28742][err] #20 0x558db21834d6 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42ce4d5)
[pid=28742][err] #21 0x558db2185d1e (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42d0d1d)
[pid=28742][err] #22 0x558db2183839 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42ce838)
[pid=28742][err] #23 0x558db2182c0e (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42cdc0d)
[pid=28742][err] #24 0x558db2bd2a70 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4d1da6f)
[pid=28742][err] #25 0x558db2bd3c32 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4d1ec31)
[pid=28742][err] #26 0x2ae58dc8924a (/usr/lib/x86_64-linux-gnu/libc.so.6+0x27249)
[pid=28742][err]   r8: 0000000000000070  r9: 000000000000002f r10: 0000000000000009 r11: 0000336401b244b0
[pid=28742][err]  r12: 0000000000000000 r13: 0000336402f38b40 r14: 00000000000000a8 r15: 0000000000000000
[pid=28742][err]   di: 00007f3aee634f48  si: 00000000000000a8  bp: 00007f3aee634df0  bx: 00007f3aee634f48
[pid=28742][err]   dx: 0000000000000009  ax: 0000000000000000  cx: 74736f686c61636f  sp: 00007f3aee634bf0
[pid=28742][err]   ip: 0000558db0cdd3cd efl: 0000000000011206 cgf: 002b000000000033 erf: 0000000000000000
[pid=28742][err]  trp: 0000000000000000 msk: 0000000000000000 cr2: 00000000000001b0
[pid=28742][err] [end of stack trace]
```