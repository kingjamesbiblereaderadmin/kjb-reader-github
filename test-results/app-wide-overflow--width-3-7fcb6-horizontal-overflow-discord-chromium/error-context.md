# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 360px] >> no horizontal overflow: /discord
- Location: tests/app-wide-overflow.spec.js:64:7

# Error details

```
Error: browser.newContext: Target page, context or browser has been closed
Browser logs:

<launching> /root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,BlockOriginHeaderModificationOnRedirect,Translate,AutoDeElevate,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --disable-updater-scheduler --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/tmp/playwright_chromiumdev_profile-bI6cKB --remote-debugging-pipe --no-startup-window
<launched> pid=3361
[pid=3361][err] [0902/221201.783276:ERROR:base/files/file_path_watcher_inotify.cc:925] Failed to read /proc/sys/fs/inotify/max_user_watches
[pid=3361][err] [0902/221201.785319:ERROR:base/files/file_path_watcher_inotify.cc:925] Failed to read /proc/sys/fs/inotify/max_user_watches
[pid=3361][err] [0902/221201.799297:ERROR:dbus/bus.cc:405] Failed to connect to the bus: Failed to connect to socket /run/dbus/system_bus_socket: No such file or directory
[pid=3361][err] [0902/221201.809876:ERROR:dbus/bus.cc:405] Failed to connect to the bus: Failed to connect to socket /run/dbus/system_bus_socket: No such file or directory
[pid=3361][err] [0902/221201.810189:ERROR:dbus/bus.cc:405] Failed to connect to the bus: Failed to connect to socket /run/dbus/system_bus_socket: No such file or directory
[pid=3361][err] [0902/221201.811170:ERROR:net/base/address_tracker_linux.cc:243] Could not bind NETLINK socket: Operation not supported (95)
[pid=3361][err] [0902/221201.811371:ERROR:base/files/file_path_watcher_inotify.cc:925] Failed to read /proc/sys/fs/inotify/max_user_watches
[pid=3361][err] [0902/221201.919915:WARNING:media/gpu/vaapi/vaapi_wrapper.cc:1655] drmGetDevices2() has not found any devices
[pid=3361][err] [0902/221201.927707:WARNING:sandbox/policy/linux/sandbox_linux.cc:405] InitializeSandbox() called with multiple threads in process gpu-process.
[pid=3361][err] [0902/221202.125185:WARNING:device/bluetooth/dbus/bluez_dbus_manager.cc:209] Floss manager service not available, cannot set Floss enable/disable.
[pid=3361][err] [0902/221202.291444:ERROR:base/files/file_path_watcher_inotify.cc:925] Failed to read /proc/sys/fs/inotify/max_user_watches
[pid=3361][err] [0902/221203.015119:INFO:CONSOLE:281] "[SW] Registered: http://localhost:4173/", source: http://localhost:4173/assets/index-BUemD7JB.js (281)
[pid=3361][err] [0902/221203.029321:INFO:CONSOLE:252] "App state check failed: Base44Error: Request failed with status code 404", source: http://localhost:4173/assets/index-BUemD7JB.js (252)
[pid=3361][err] [0902/221203.192490:INFO:CONSOLE:276] "[KJB Splash] Mode: subsequent Incognito: true", source: http://localhost:4173/assets/index-BUemD7JB.js (276)
[pid=3361][err] [0902/221203.192913:INFO:CONSOLE:276] "[KJB Splash] WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-BUemD7JB.js (276)
[pid=3361][err] [0902/221204.861769:INFO:CONSOLE:276] "[Splash] Summary", source: http://localhost:4173/assets/index-BUemD7JB.js (276)
[pid=3361][err] [0902/221204.862737:INFO:CONSOLE:276] "1. WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-BUemD7JB.js (276)
[pid=3361][err] [0902/221204.863391:INFO:CONSOLE:276] "console.groupEnd", source: http://localhost:4173/assets/index-BUemD7JB.js (276)
[pid=3361][err] [0902/221205.993718:INFO:CONSOLE:252] "[Auth] Loading timeout - allowing app to continue", source: http://localhost:4173/assets/index-BUemD7JB.js (252)
[pid=3361][err] [0902/221207.347013:INFO:CONSOLE:281] "[SW] Registered: http://localhost:4173/", source: http://localhost:4173/assets/index-BUemD7JB.js (281)
[pid=3361][err] [0902/221207.365470:INFO:CONSOLE:252] "App state check failed: Base44Error: Request failed with status code 404", source: http://localhost:4173/assets/index-BUemD7JB.js (252)
[pid=3361][err] [0902/221207.471308:INFO:CONSOLE:276] "[KJB Splash] Mode: subsequent Incognito: true", source: http://localhost:4173/assets/index-BUemD7JB.js (276)
[pid=3361][err] [0902/221207.471590:INFO:CONSOLE:276] "[KJB Splash] WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-BUemD7JB.js (276)
[pid=3361][err] [0902/221208.968584:INFO:CONSOLE:276] "[Splash] Summary", source: http://localhost:4173/assets/index-BUemD7JB.js (276)
[pid=3361][err] [0902/221208.968868:INFO:CONSOLE:276] "1. WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-BUemD7JB.js (276)
[pid=3361][err] [0902/221208.969017:INFO:CONSOLE:276] "console.groupEnd", source: http://localhost:4173/assets/index-BUemD7JB.js (276)
[pid=3361][err] [0902/221210.988875:INFO:CONSOLE:281] "[SW] Registered: http://localhost:4173/", source: http://localhost:4173/assets/index-BUemD7JB.js (281)
[pid=3361][err] [0902/221211.013256:INFO:CONSOLE:252] "App state check failed: Base44Error: Request failed with status code 404", source: http://localhost:4173/assets/index-BUemD7JB.js (252)
[pid=3361][err] [0902/221211.138463:INFO:CONSOLE:276] "[KJB Splash] Mode: subsequent Incognito: true", source: http://localhost:4173/assets/index-BUemD7JB.js (276)
[pid=3361][err] [0902/221211.138964:INFO:CONSOLE:276] "[KJB Splash] WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-BUemD7JB.js (276)
[pid=3361][err] [0902/221212.861782:INFO:CONSOLE:276] "[Splash] Summary", source: http://localhost:4173/assets/index-BUemD7JB.js (276)
[pid=3361][err] [0902/221212.862985:INFO:CONSOLE:276] "1. WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-BUemD7JB.js (276)
[pid=3361][err] [0902/221212.864717:INFO:CONSOLE:276] "console.groupEnd", source: http://localhost:4173/assets/index-BUemD7JB.js (276)
[pid=3361][err] Received signal 11 SEGV_MAPERR 0000000001b0
[pid=3361][err] #0 0x55982a1e7413 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4265412)
[pid=3361][err] #1 0x55982d4cddf4 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x754bdf3)
[pid=3361][err] #2 0x2b21079f1050 (/usr/lib/x86_64-linux-gnu/libc.so.6+0x3c04f)
[pid=3361][err] #3 0x55982cadb19a (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x6b59199)
[pid=3361][err] #4 0x55982caa2a29 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x6b20a28)
[pid=3361][err] #5 0x55982c8fa6d2 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x69786d1)
[pid=3361][err] #6 0x55982c8f617c (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x697417b)
[pid=3361][err] #7 0x559829628ead (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a6eac)
[pid=3361][err] #8 0x559829628ac4 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a6ac3)
[pid=3361][err] #9 0x55982acb6474 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4d34473)
[pid=3361][err] #10 0x559829628e1f (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a6e1e)
[pid=3361][err] #11 0x5598296232de (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a12dd)
[pid=3361][err] #12 0x5598296225ed (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a05ec)
[pid=3361][err] #13 0x55982ca526f5 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x6ad06f4)
[pid=3361][err] #14 0x559827de5035 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x1e63034)
[pid=3361][err] #15 0x559827de9be1 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x1e67be0)
[pid=3361][err] #16 0x55982914dfe9 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x31cbfe8)
[pid=3361][err] #17 0x55982914d701 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x31cb700)
[pid=3361][err] #18 0x55982a3f67ef (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x44747ee)
[pid=3361][err] #19 0x55982a250356 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42ce355)
[pid=3361][err] #20 0x55982a2504d6 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42ce4d5)
[pid=3361][err] #21 0x55982a252d1e (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42d0d1d)
[pid=3361][err] #22 0x55982a250839 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42ce838)
[pid=3361][err] #23 0x55982a24fc0e (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42cdc0d)
[pid=3361][err] #24 0x55982ac9fa70 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4d1da6f)
[pid=3361][err] #25 0x55982aca0c32 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4d1ec31)
[pid=3361][err] #26 0x2b21079dc24a (/usr/lib/x86_64-linux-gnu/libc.so.6+0x27249)
[pid=3361][err]   r8: 0000000000000070  r9: 000000000000002f r10: 0000000000000009 r11: 00001dc40117b9f0
[pid=3361][err]  r12: 0000000000000000 r13: 00001dc400f361c0 r14: 00000000000000a8 r15: 0000000000000000
[pid=3361][err]   di: 00007e8495bb8f48  si: 00000000000000a8  bp: 00007e8495bb8df0  bx: 00007e8495bb8f48
[pid=3361][err]   dx: 0000000000000009  ax: 0000000000000000  cx: 74736f686c61636f  sp: 00007e8495bb8bf0
[pid=3361][err]   ip: 0000559828daa3cd efl: 0000000000010206 cgf: 002b000000000033 erf: 0000000000000000
[pid=3361][err]  trp: 0000000000000000 msk: 0000000000000000 cr2: 00000000000001b0
[pid=3361][err] [end of stack trace]
```