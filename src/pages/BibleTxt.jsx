import React, { useEffect, useState } from 'react';
import { isNativeAndroid } from '@/lib/isNativeAndroid';

// Displays the full King James Bible plain-text inline in the browser at
// /bible.txt — fetches the verified-clean PCE source file (the exact same
// text as the reader and the offline download) and renders it as text (not a
// download).
const BIBLE_TXT_URL = 'https://base44.app/api/apps/6a8011c360ff52dad38eb2f3/files/mp/public/6a8011c360ff52dad38eb2f3/77b2417cd_pce-bible-clean.txt';

// On native Android, the exact same Pure Cambridge Edition text is bundled
// natively into the APK (android/app/src/main/assets/bible/pce-bible.txt,
// served locally by MainActivity.java for this same-origin path -- see
// bibleCache.js, which already uses this exact pattern for the main reading
// experience). Without this, this specific page had NO offline fallback at
// all -- a genuinely first-ever-offline launch, or any connectivity hiccup,
// left it stuck on a bare "Error: ..." with nothing to show, even though the
// full Bible text was sitting right there in the app the whole time.
const NATIVE_BIBLE_TXT_URL = '/__native/pce-bible.txt';

// The PCE source file is Windows-1252 encoded (curly apostrophes, ligatures,
// pilcrows), so it must be decoded from bytes — res.text() assumes UTF-8 and
// would mangle the typographic characters.
async function fetchPceText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  const buf = await res.arrayBuffer();
  return new TextDecoder('windows-1252').decode(buf);
}

export default function BibleTxt() {
  const [text, setText] = useState('Loading the full Bible…');

  useEffect(() => {
    let active = true;
    (async () => {
      if (isNativeAndroid()) {
        try {
          const t = await fetchPceText(NATIVE_BIBLE_TXT_URL);
          if (active) setText(t);
          return;
        } catch {
          // Fall through to the live URL below -- e.g. if the bundled
          // interception somehow isn't wired up for this exact build.
        }
      }
      try {
        const t = await fetchPceText(BIBLE_TXT_URL);
        if (active) setText(t);
      } catch (err) {
        if (active) setText('Error: ' + err.message);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <pre
      style={{
        margin: 0,
        padding: '16px',
        fontFamily: 'monospace',
        fontSize: '14px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        background: '#fff',
        color: '#000',
        minHeight: '100vh',
      }}
    >
      {text}
    </pre>
  );
}