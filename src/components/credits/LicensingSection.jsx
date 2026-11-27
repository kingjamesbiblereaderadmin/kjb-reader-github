import React from 'react';
import { isAppleStoreApp } from '@/lib/isAppleStoreApp';

// The app's own licence, the third-party APIs it calls and the terms each is
// used under, the open-source licences it builds on, and the device permissions
// the installed apps actually ask for. The permission list comes from the
// shipping manifests: Android declares INTERNET, ACCESS_NETWORK_STATE and (API
// 28 and below) write access to Downloads; the iOS app declares no usage
// descriptions at all.

const APIS = [
  ['Microsoft Azure AI Speech', 'the Listen voice. Verse text is sent to Azure and the audio comes back as an mp3 that is stored and replayed, so each verse is voiced once. It runs on the developer\u2019s own Azure subscription under the Microsoft Azure service terms, and the speech is played inside the app only \u2014 it is never sold or offered as audio on its own.'],
  ['Base44', 'the platform\u2019s APIs for hosting, backend functions, file storage and optional sign-in, used under Base44\u2019s terms of service.'],
  ['DisCloud', 'hosts the pre-generated audio clips the app plays, under DisCloud\u2019s hosting terms.'],
  ['jsDelivr + Simple Icons', 'brand marks shown on this page. Simple Icons is released under CC0.'],
];

const APP_LICENCES = [
  'KJB Reader is free to use, copy and share unchanged for personal, non-commercial reading and study. It is never sold or licensed for resale.',
  'Open-source components keep their own licences: Capacitor (MIT), the Lucide interface icons (ISC), and the LibreOffice hyphenation patterns (LGPL/MPL).',
  'The typefaces are used under the SIL Open Font License 1.1, which allows free use and redistribution but not sale of the fonts on their own.',
];

function permissions() {
  if (isAppleStoreApp()) {
    return [
      ['No special permissions', 'the iOS app asks for none. There is no request for camera, microphone, location, contacts or notifications.'],
      ['Network only', 'it uses standard HTTPS to load the Bible text, search results and audio when the device is online.'],
    ];
  }
  return [
    ['Internet access', 'loads the Bible text, search results and audio when the device is online.'],
    ['Network state', 'tells the app whether to open the live site or the offline copy it carries.'],
    ['Storage — Android 9 and older only', 'saves files you export (PDF, HTML) into your Downloads folder. Android 10 and later needs no permission for this.'],
    ['Nothing else', 'there is no request for camera, microphone, location, contacts or notifications.'],
  ];
}

const LIST = 'font-sans text-sm text-foreground/85 leading-relaxed flex items-start gap-2';
const HEAD = 'font-sans text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-5 mb-2';

export default function LicensingSection() {
  return (
    <>
      <p className={HEAD.replace(' mt-5', '')}>APIs &amp; services, and how they are used</p>
      <div className="space-y-2">
        {APIS.map(([name, detail]) => (
          <p key={name} className={LIST}>
            <span className="text-accent mt-1">–</span>
            <span><strong className="text-foreground notranslate" translate="no">{name}:</strong> <span className="text-muted-foreground">{detail}</span></span>
          </p>
        ))}
      </div>

      <p className={HEAD}>The app&rsquo;s own licence</p>
      <div className="space-y-2">
        {APP_LICENCES.map((line, i) => (
          <p key={i} className={LIST}>
            <span className="text-accent mt-1">•</span>
            <span>{line}</span>
          </p>
        ))}
      </div>

      <p className={HEAD}>Permissions the app asks for</p>
      <div className="space-y-2">
        {permissions().map(([title, detail]) => (
          <p key={title} className={LIST}>
            <span className="text-accent mt-1">–</span>
            <span><strong className="text-foreground">{title}:</strong> <span className="text-muted-foreground">{detail}</span></span>
          </p>
        ))}
      </div>
    </>
  );
}