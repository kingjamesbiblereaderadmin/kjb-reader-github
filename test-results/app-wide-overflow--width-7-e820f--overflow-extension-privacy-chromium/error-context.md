# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 768px] >> no horizontal overflow: /extension-privacy
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: browserContext.close: Test ended.
Browser logs:

<launching> /root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,BlockOriginHeaderModificationOnRedirect,Translate,AutoDeElevate,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --disable-updater-scheduler --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/tmp/playwright_chromiumdev_profile-SMZBAi --remote-debugging-pipe --no-startup-window
<launched> pid=29861
[pid=29861][err] [0902/215920.006283:ERROR:base/files/file_path_watcher_inotify.cc:925] Failed to read /proc/sys/fs/inotify/max_user_watches
[pid=29861][err] [0902/215920.198713:ERROR:base/files/file_path_watcher_inotify.cc:925] Failed to read /proc/sys/fs/inotify/max_user_watches
[pid=29861][err] [0902/215920.340077:ERROR:base/files/file_path_watcher_inotify.cc:925] Failed to read /proc/sys/fs/inotify/max_user_watches
[pid=29861][err] [0902/215920.358291:ERROR:dbus/bus.cc:405] Failed to connect to the bus: Failed to connect to socket /run/dbus/system_bus_socket: No such file or directory
[pid=29861][err] [0902/215920.358397:ERROR:dbus/bus.cc:405] Failed to connect to the bus: Failed to connect to socket /run/dbus/system_bus_socket: No such file or directory
[pid=29861][err] [0902/215920.358459:ERROR:dbus/bus.cc:405] Failed to connect to the bus: Failed to connect to socket /run/dbus/system_bus_socket: No such file or directory
[pid=29861][err] [0902/215920.340000:ERROR:net/base/address_tracker_linux.cc:243] Could not bind NETLINK socket: Operation not supported (95)
[pid=29861][err] [0902/215920.744052:WARNING:media/gpu/vaapi/vaapi_wrapper.cc:1655] drmGetDevices2() has not found any devices
[pid=29861][err] [0902/215920.805323:WARNING:sandbox/policy/linux/sandbox_linux.cc:405] InitializeSandbox() called with multiple threads in process gpu-process.
[pid=29861][err] [0902/215921.829834:WARNING:device/bluetooth/dbus/bluez_dbus_manager.cc:209] Floss manager service not available, cannot set Floss enable/disable.
[pid=29861][err] [0902/215922.183044:ERROR:base/files/file_path_watcher_inotify.cc:925] Failed to read /proc/sys/fs/inotify/max_user_watches
[pid=29861][err] [0902/215926.816870:INFO:CONSOLE:276] "[REFRESH] Cache refresh due, checking for updates...", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215926.817337:INFO:CONSOLE:276] "[REFRESH] Cache refresh due, checking for updates...", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215927.580751:INFO:CONSOLE:252] "App state check failed: Base44Error: Request failed with status code 404", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=29861][err] [0902/215928.195495:INFO:CONSOLE:281] "[SW] Registered: http://localhost:4173/", source: http://localhost:4173/assets/index-CKevY52_.js (281)
[pid=29861][err] [0902/215928.840130:INFO:CONSOLE:276] "[KJB Splash] Mode: subsequent Incognito: true", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215928.840180:INFO:CONSOLE:276] "[KJB Splash] WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215929.797417:INFO:CONSOLE:252] "[Auth] Loading timeout - allowing app to continue", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=29861][err] [0902/215930.299953:INFO:CONSOLE:276] "[Splash] Summary", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215930.299995:INFO:CONSOLE:276] "1. WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215930.300025:INFO:CONSOLE:276] "console.groupEnd", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215936.431370:INFO:CONSOLE:276] "[REFRESH] Cache refresh due, checking for updates...", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215936.486345:INFO:CONSOLE:276] "[REFRESH] Cache refresh due, checking for updates...", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215937.165602:INFO:CONSOLE:281] "[SW] Registered: http://localhost:4173/", source: http://localhost:4173/assets/index-CKevY52_.js (281)
[pid=29861][err] [0902/215937.175644:INFO:CONSOLE:276] "[KJB Splash] Mode: subsequent Incognito: true", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215937.175685:INFO:CONSOLE:276] "[KJB Splash] LOOKING UP…", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215937.722420:INFO:CONSOLE:252] "App state check failed: Base44Error: Request failed with status code 404", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=29861][err] [0902/215939.223659:INFO:CONSOLE:276] "[Splash] Summary", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215939.223693:INFO:CONSOLE:276] "1. LOOKING UP…", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215939.223710:INFO:CONSOLE:276] "console.groupEnd", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215939.718783:INFO:CONSOLE:252] "[Auth] Loading timeout - allowing app to continue", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=29861][err] [0902/215950.770880:INFO:CONSOLE:276] "[REFRESH] Cache refresh due, checking for updates...", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215950.771006:INFO:CONSOLE:276] "[REFRESH] Cache refresh due, checking for updates...", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215951.784316:INFO:CONSOLE:281] "[SW] Registered: http://localhost:4173/", source: http://localhost:4173/assets/index-CKevY52_.js (281)
[pid=29861][err] [0902/215951.785994:INFO:CONSOLE:252] "App state check failed: Base44Error: Request failed with status code 404", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=29861][err] [0902/215953.220238:INFO:CONSOLE:276] "[KJB Splash] Mode: subsequent Incognito: true", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215953.220272:INFO:CONSOLE:276] "[KJB Splash] WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215953.736155:INFO:CONSOLE:252] "[Auth] Loading timeout - allowing app to continue", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=29861][err] [0902/215954.795497:INFO:CONSOLE:276] "[Splash] Summary", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215954.795528:INFO:CONSOLE:276] "1. WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/215954.795546:INFO:CONSOLE:276] "console.groupEnd", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220006.279064:INFO:CONSOLE:252] "App state check failed: Base44Error: Request failed with status code 404", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=29861][err] [0902/220006.279191:INFO:CONSOLE:276] "[KJB Splash] Mode: subsequent Incognito: true", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220006.279211:INFO:CONSOLE:276] "[KJB Splash] WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220006.774531:INFO:CONSOLE:281] "[SW] Registered: http://localhost:4173/", source: http://localhost:4173/assets/index-CKevY52_.js (281)
[pid=29861][err] [0902/220006.963093:INFO:CONSOLE:34] "Unrecognized feature: 'web-share'.", source: http://localhost:4173/assets/index-CKevY52_.js (34)
[pid=29861][err] [0902/220008.753417:INFO:CONSOLE:276] "[Splash] Summary", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220008.753466:INFO:CONSOLE:276] "1. WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220008.753486:INFO:CONSOLE:276] "console.groupEnd", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220008.753654:INFO:CONSOLE:252] "[Auth] Loading timeout - allowing app to continue", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=29861][err] [0902/220014.664678:ERROR:dbus/bus.cc:405] Failed to connect to the bus: Failed to connect to socket /run/dbus/system_bus_socket: No such file or directory
[pid=29861][err] [0902/220014.664778:ERROR:dbus/bus.cc:405] Failed to connect to the bus: Failed to connect to socket /run/dbus/system_bus_socket: No such file or directory
[pid=29861][err] [0902/220014.664816:WARNING:dbus/property.cc:94] Failed to connect to PropertiesChangedsignal.
[pid=29861][err] [0902/220014.664832:ERROR:dbus/object_proxy.cc:572] Failed to call method: org.freedesktop.DBus.Properties.GetAll: object_path= /org/freedesktop/UPower/devices/DisplayDevice: unknown error type: 
[pid=29861][err] [0902/220014.664838:WARNING:dbus/property.cc:174] GetAll request failed for: org.freedesktop.UPower.Device
[pid=29861][err] [0902/220020.407137:ERROR:content/public/browser/web_contents_delegate.cc:310] WebContentsDelegate::CheckMediaAccessPermission: Not supported.
[pid=29861][err] [0902/220020.407150:ERROR:content/public/browser/web_contents_delegate.cc:310] WebContentsDelegate::CheckMediaAccessPermission: Not supported.
[pid=29861][err] [0902/220021.075502:WARNING:media/audio/linux/audio_manager_linux.cc:53] Falling back to ALSA for audio output. PulseAudio is not available or could not be initialized.
[pid=29861][err] [0902/220021.148016:ERROR:content/public/browser/web_contents_delegate.cc:310] WebContentsDelegate::CheckMediaAccessPermission: Not supported.
[pid=29861][err] [0902/220021.148031:ERROR:content/public/browser/web_contents_delegate.cc:310] WebContentsDelegate::CheckMediaAccessPermission: Not supported.
[pid=29861][err] [0902/220027.963930:INFO:CONSOLE:252] "App state check failed: Base44Error: Request failed with status code 404", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=29861][err] [0902/220028.461329:INFO:CONSOLE:281] "[SW] Registered: http://localhost:4173/", source: http://localhost:4173/assets/index-CKevY52_.js (281)
[pid=29861][err] [0902/220028.690426:INFO:CONSOLE:276] "[KJB Splash] Mode: subsequent Incognito: true", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220028.693632:INFO:CONSOLE:276] "[KJB Splash] WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220030.330220:INFO:CONSOLE:276] "[Splash] Summary", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220030.330265:INFO:CONSOLE:276] "1. WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220030.330287:INFO:CONSOLE:276] "console.groupEnd", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220030.353679:INFO:CONSOLE:252] "[Auth] Loading timeout - allowing app to continue", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=29861][err] [0902/220035.336275:INFO:CONSOLE:252] "App state check failed: Base44Error: Request failed with status code 404", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=29861][err] [0902/220036.384002:INFO:CONSOLE:276] "[KJB Splash] Mode: subsequent Incognito: true", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220036.384055:INFO:CONSOLE:276] "[KJB Splash] WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220036.386066:INFO:CONSOLE:281] "[SW] Registered: http://localhost:4173/", source: http://localhost:4173/assets/index-CKevY52_.js (281)
[pid=29861][err] [0902/220038.046653:INFO:CONSOLE:252] "[Auth] Loading timeout - allowing app to continue", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=29861][err] [0902/220038.046683:INFO:CONSOLE:276] "[Splash] Summary", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220038.046706:INFO:CONSOLE:276] "1. WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220038.046721:INFO:CONSOLE:276] "console.groupEnd", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220050.291434:INFO:CONSOLE:252] "App state check failed: Base44Error: Request failed with status code 404", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=29861][err] [0902/220050.447667:INFO:CONSOLE:281] "[SW] Registered: http://localhost:4173/", source: http://localhost:4173/assets/index-CKevY52_.js (281)
[pid=29861][err] [0902/220050.447701:INFO:CONSOLE:276] "[KJB Splash] Mode: subsequent Incognito: true", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220050.447720:INFO:CONSOLE:276] "[KJB Splash] WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220050.448884:INFO:CONSOLE:34] "Unrecognized feature: 'web-share'.", source: http://localhost:4173/assets/index-CKevY52_.js (34)
[pid=29861][err] [0902/220050.975538:INFO:CONSOLE:252] "[Auth] Loading timeout - allowing app to continue", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=29861][err] [0902/220051.621040:INFO:CONSOLE:276] "[Splash] Summary", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220051.621069:INFO:CONSOLE:276] "1. WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220051.621086:INFO:CONSOLE:276] "console.groupEnd", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220053.845182:ERROR:dbus/bus.cc:405] Failed to connect to the bus: Failed to connect to socket /run/dbus/system_bus_socket: No such file or directory
[pid=29861][err] [0902/220053.845257:ERROR:dbus/bus.cc:405] Failed to connect to the bus: Failed to connect to socket /run/dbus/system_bus_socket: No such file or directory
[pid=29861][err] [0902/220053.845280:WARNING:dbus/property.cc:94] Failed to connect to PropertiesChangedsignal.
[pid=29861][err] [0902/220053.845293:ERROR:dbus/object_proxy.cc:572] Failed to call method: org.freedesktop.DBus.Properties.GetAll: object_path= /org/freedesktop/UPower/devices/DisplayDevice: unknown error type: 
[pid=29861][err] [0902/220053.845299:WARNING:dbus/property.cc:174] GetAll request failed for: org.freedesktop.UPower.Device
[pid=29861][err] [0902/220056.325036:ERROR:content/public/browser/web_contents_delegate.cc:310] WebContentsDelegate::CheckMediaAccessPermission: Not supported.
[pid=29861][err] [0902/220056.325055:ERROR:content/public/browser/web_contents_delegate.cc:310] WebContentsDelegate::CheckMediaAccessPermission: Not supported.
[pid=29861][err] [0902/220057.910575:INFO:CONSOLE:0] "No available adapters.", source: https://www.youtube-nocookie.com/embed/znP9Dr6tOzU?rel=0&modestbranding=1&playsinline=1 (0)
[pid=29861][err] [0902/220106.052375:INFO:CONSOLE:281] "[SW] Registered: http://localhost:4173/", source: http://localhost:4173/assets/index-CKevY52_.js (281)
[pid=29861][err] [0902/220106.765952:INFO:CONSOLE:252] "App state check failed: Base44Error: Request failed with status code 404", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=29861][err] [0902/220106.798118:INFO:CONSOLE:276] "[KJB Splash] Mode: subsequent Incognito: true", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220106.843032:INFO:CONSOLE:276] "[KJB Splash] WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220108.667800:INFO:CONSOLE:276] "[Splash] Summary", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220108.667837:INFO:CONSOLE:276] "1. WELCOME BACK TO KJB READER.", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220108.667855:INFO:CONSOLE:276] "console.groupEnd", source: http://localhost:4173/assets/index-CKevY52_.js (276)
[pid=29861][err] [0902/220108.845096:INFO:CONSOLE:252] "[Auth] Loading timeout - allowing app to continue", source: http://localhost:4173/assets/index-CKevY52_.js (252)
[pid=29861][err] Received signal 11 SEGV_MAPERR 0000000001b0
[pid=29861][err] #0 0x559398dc7413 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4265412)
[pid=29861][err] #1 0x55939c0addf4 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x754bdf3)
[pid=29861][err] #2 0x2ab552f6f050 (/usr/lib/x86_64-linux-gnu/libc.so.6+0x3c04f)
[pid=29861][err] #3 0x55939b6bb19a (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x6b59199)
[pid=29861][err] #4 0x55939b682a29 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x6b20a28)
[pid=29861][err] #5 0x55939b4da6d2 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x69786d1)
[pid=29861][err] #6 0x55939b4d617c (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x697417b)
[pid=29861][err] #7 0x559398208ead (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a6eac)
[pid=29861][err] #8 0x559398208ac4 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a6ac3)
[pid=29861][err] #9 0x559399896474 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4d34473)
[pid=29861][err] #10 0x559398208e1f (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a6e1e)
[pid=29861][err] #11 0x5593982032de (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a12dd)
[pid=29861][err] #12 0x5593982025ed (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x36a05ec)
[pid=29861][err] #13 0x55939b6326f5 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x6ad06f4)
[pid=29861][err] #14 0x5593969c5035 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x1e63034)
[pid=29861][err] #15 0x5593969d3bf1 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x1e71bf0)
[pid=29861][err] #16 0x2ab5524ea789 (/usr/lib/x86_64-linux-gnu/libglib-2.0.so.0.7400.6+0x54788)
[pid=29861][err] #17 0x346000031b60 ([anon:partition_alloc]+0x9aaac789b5f)
[pid=29861][err] #18 0x559397d2dfe9 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x31cbfe8)
[pid=29861][err] #19 0x559397d2d701 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x31cb700)
[pid=29861][err] #20 0x559398fd67ef (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x44747ee)
[pid=29861][err] #21 0x559398e30356 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42ce355)
[pid=29861][err] #22 0x559398e304d6 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42ce4d5)
[pid=29861][err] #23 0x559398e32d1e (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42d0d1d)
[pid=29861][err] #24 0x559398e30839 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42ce838)
[pid=29861][err] #25 0x559398e2fc0e (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x42cdc0d)
[pid=29861][err] #26 0x55939987fa70 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4d1da6f)
[pid=29861][err] #27 0x559399880c32 (/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell+0x4d1ec31)
[pid=29861][err] #28 0x2ab552f5a24a (/usr/lib/x86_64-linux-gnu/libc.so.6+0x27249)
[pid=29861][err]   r8: 0000000000000070  r9: 000000000000002f r10: 0000000000000009 r11: 0000346401233030
[pid=29861][err]  r12: 0000000000000000 r13: 00003464037b52c0 r14: 00000000000000a8 r15: 0000000000000000
[pid=29861][err]   di: 00007fd412990db8  si: 00000000000000a8  bp: 00007fd412990c60  bx: 00007fd412990db8
[pid=29861][err]   dx: 0000000000000009  ax: 0000000000000000  cx: 74736f686c61636f  sp: 00007fd412990a60
[pid=29861][err]   ip: 000055939798a3cd efl: 0000000000011206 cgf: 002b000000000033 erf: 0000000000000000
[pid=29861][err]  trp: 0000000000000000 msk: 0000000000000000 cr2: 00000000000001b0
[pid=29861][err] [end of stack trace]
```