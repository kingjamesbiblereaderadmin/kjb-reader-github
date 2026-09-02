# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline-sync.spec.js >> Offline / online sync >> service worker installs and app shell survives a hard offline reload
- Location: tests/offline-sync.spec.js:51:3

# Error details

```
Error: uncaught errors during offline reload:
Failed to load resource: the server responded with a status of 404 (Not Found)
Failed to load resource: the server responded with a status of 404 (Not Found)
Failed to load resource: the server responded with a status of 404 (Not Found)
App state check failed: Base44Error: Request failed with status code 404
    at http://localhost:4173/assets/index-U-xWsLCc.js:226:12569
    at async Ds.request (http://localhost:4173/assets/index-U-xWsLCc.js:222:2143)
    at async x (http://localhost:4173/assets/index-U-xWsLCc.js:252:9566)
Failed to load resource: the server responded with a status of 404 (Not Found)
Failed to load resource: the server responded with a status of 404 (Not Found)
App state check failed: Base44Error: Request failed with status code 404
    at http://localhost:4173/assets/index-U-xWsLCc.js:226:12569
    at async Ds.request (http://localhost:4173/assets/index-U-xWsLCc.js:222:2143)
    at async x (http://localhost:4173/assets/index-U-xWsLCc.js:252:9566)
Manifest: Line: 1, column: 1, Syntax error.
Failed to load resource: the server responded with a status of 503 ()
Failed to load resource: net::ERR_FAILED
Failed to load resource: net::ERR_INTERNET_DISCONNECTED
Failed to load resource: net::ERR_FAILED
Failed to load resource: net::ERR_FAILED
Failed to load resource: net::ERR_FAILED
Failed to load resource: net::ERR_FAILED
Failed to load resource: net::ERR_INTERNET_DISCONNECTED
App state check failed: Base44Error: Network Error
    at http://localhost:4173/assets/index-U-xWsLCc.js:226:12569
    at async Ds.request (http://localhost:4173/assets/index-U-xWsLCc.js:222:2143)
    at async x (http://localhost:4173/assets/index-U-xWsLCc.js:252:9566)
Failed to load resource: net::ERR_INTERNET_DISCONNECTED
Failed to load resource: net::ERR_FAILED
Failed to load resource: net::ERR_FAILED
Failed to load resource: net::ERR_FAILED
Failed to load resource: net::ERR_FAILED
Failed to load resource: net::ERR_FAILED
Failed to load resource: net::ERR_FAILED
Failed to load resource: net::ERR_INTERNET_DISCONNECTED

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 36

- Array []
+ Array [
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "App state check failed: Base44Error: Request failed with status code 404
+     at http://localhost:4173/assets/index-U-xWsLCc.js:226:12569
+     at async Ds.request (http://localhost:4173/assets/index-U-xWsLCc.js:222:2143)
+     at async x (http://localhost:4173/assets/index-U-xWsLCc.js:252:9566)",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "Failed to load resource: the server responded with a status of 404 (Not Found)",
+   "App state check failed: Base44Error: Request failed with status code 404
+     at http://localhost:4173/assets/index-U-xWsLCc.js:226:12569
+     at async Ds.request (http://localhost:4173/assets/index-U-xWsLCc.js:222:2143)
+     at async x (http://localhost:4173/assets/index-U-xWsLCc.js:252:9566)",
+   "Manifest: Line: 1, column: 1, Syntax error.",
+   "Failed to load resource: the server responded with a status of 503 ()",
+   "Failed to load resource: net::ERR_FAILED",
+   "Failed to load resource: net::ERR_INTERNET_DISCONNECTED",
+   "Failed to load resource: net::ERR_FAILED",
+   "Failed to load resource: net::ERR_FAILED",
+   "Failed to load resource: net::ERR_FAILED",
+   "Failed to load resource: net::ERR_FAILED",
+   "Failed to load resource: net::ERR_INTERNET_DISCONNECTED",
+   "App state check failed: Base44Error: Network Error
+     at http://localhost:4173/assets/index-U-xWsLCc.js:226:12569
+     at async Ds.request (http://localhost:4173/assets/index-U-xWsLCc.js:222:2143)
+     at async x (http://localhost:4173/assets/index-U-xWsLCc.js:252:9566)",
+   "Failed to load resource: net::ERR_INTERNET_DISCONNECTED",
+   "Failed to load resource: net::ERR_FAILED",
+   "Failed to load resource: net::ERR_FAILED",
+   "Failed to load resource: net::ERR_FAILED",
+   "Failed to load resource: net::ERR_FAILED",
+   "Failed to load resource: net::ERR_FAILED",
+   "Failed to load resource: net::ERR_FAILED",
+   "Failed to load resource: net::ERR_INTERNET_DISCONNECTED",
+ ]
```

# Page snapshot

```yaml
- generic [ref=f2e2]:
  - generic [ref=f2e4]:
    - img "KJB Reader Logo" [ref=f2e5]
    - generic [ref=f2e6]: WELCOME TO KJB READER (GUEST MODE)
  - generic [ref=f2e11]:
    - generic [ref=f2e12]:
      - link [ref=f2e13] [cursor=pointer]:
        - /url: /
        - img "KJB Reader Logo" [ref=f2e14]
      - heading "Welcome to KJB Reader" [level=1] [ref=f2e15]
      - paragraph [ref=f2e16]: KJB Reader is a free, installable Bible reading app featuring the King James Bible (Pure Cambridge Edition). Enjoy offline reading, search, bookmarks, and customizable typography — all with privacy at the forefront.
    - generic [ref=f2e18]:
      - paragraph [ref=f2e21]: 2 Timothy 2:15
      - blockquote [ref=f2e23]: "\"Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.\""
    - link [ref=f2e25] [cursor=pointer]:
      - /url: /salvation
      - generic [ref=f2e29]:
        - paragraph [ref=f2e30]: Are you saved?
        - paragraph [ref=f2e31]: Jesus Christ died, shed his blood, was buried, and rose again on the third day for our sins. Trust Christ's blood, death, burial and resurrection for your sins, and be eternally saved.
    - link [ref=f2e35] [cursor=pointer]:
      - /url: /espanol-evangelio
      - generic [ref=f2e40]:
        - paragraph [ref=f2e41]: Are you saved? (Español)
        - paragraph [ref=f2e42]: El Evangelio de Salvación
    - generic [ref=f2e46]:
      - generic [ref=f2e47]:
        - button "Install" [ref=f2e48] [cursor=pointer]
        - button "Theme" [ref=f2e55] [cursor=pointer]
        - button "Fonts" [ref=f2e65] [cursor=pointer]
        - button "Layout" [ref=f2e71] [cursor=pointer]
        - button "Explore" [ref=f2e77] [cursor=pointer]
      - generic [ref=f2e84]:
        - heading "Install the App" [level=3] [ref=f2e85]
        - paragraph [ref=f2e86]: Get offline access and faster loading
        - paragraph [ref=f2e88]: You're in a private window. App install and notifications won't work, and settings will be erased when you close this window.
        - paragraph [ref=f2e89]: You can install the app later from Settings.
      - generic [ref=f2e90]:
        - button "Back" [disabled]
        - button "Next" [ref=f2e91] [cursor=pointer]
    - button "Legal & Legacy" [ref=f2e96] [cursor=pointer]
    - button "Contact" [ref=f2e104] [cursor=pointer]
    - paragraph [ref=f2e112]: "© 2026 KJB Reader · Last updated: September 3rd, 2026"
  - region "Notifications alt+T"
```