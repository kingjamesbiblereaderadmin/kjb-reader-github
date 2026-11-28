import { isNativeAndroid } from '@/lib/isNativeAndroid';
import { isNativeIos } from '@/lib/isNativeIos';
import { getInstallSource } from '@/lib/installSource';

// Which copy of the app is running: the Android app, the iOS app, the website
// installed as a PWA, or the website in a browser. What the app is allowed to
// ask for is different in each case, so the permission lists below are kept
// apart rather than merged into one.
//
// The native lists come from the shipping manifests: Android declares
// INTERNET, ACCESS_NETWORK_STATE and (API 28 and below) write access to
// Downloads; the iOS app declares no usage descriptions at all. A website and
// an installed web app have no permission prompts — only the storage the
// browser gives them.

export function getPlatformKind() {
  if (isNativeAndroid()) return 'android';
  if (isNativeIos()) return 'ios';
  try {
    return getInstallSource().startsWith('Installed Web App') ? 'pwa' : 'web';
  } catch {
    return 'web';
  }
}

// The same wording Settings -> App Info uses for where this copy came from.
export function getPlatformLabel() {
  const kind = getPlatformKind();
  if (kind === 'android') return 'Android app';
  if (kind === 'ios') return 'iOS app';
  return getInstallSource();
}

const ROWS = {
  android: [
    ['Internet access', 'loads the Bible text, search results and audio when the device is online.'],
    ['Network state', 'tells the app whether to open the live site or the offline copy it carries.'],
    ['Storage — Android 9 and older only', 'saves files you export (PDF, HTML) into your Downloads folder. Android 10 and later needs no permission for this.'],
    ['Nothing else', 'there is no request for camera, microphone, location, contacts or notifications.'],
  ],
  ios: [
    ['No permission prompts', 'the iOS app asks for none at all. There is no request for camera, microphone, location, contacts or notifications.'],
    ['Network only', 'it uses standard HTTPS to load the Bible text, search results and audio when the device is online.'],
    ['Audio inside the app', 'every verse is stored with the app, so listening needs no download and no connection.'],
  ],
  pwa: [
    ['No extra permissions', 'installing asks for nothing. There is no request for camera, microphone, location, contacts or notifications.'],
    ['Storage on this device', 'keeps the offline copy of the app, your settings and the verses you have played, so they replay without a connection. Clearing site data removes them.'],
    ['Network', 'loads the Bible text, search results and audio while you are online.'],
    ['Updates', 'the app updates itself in the background, with no prompt.'],
  ],
  web: [
    ['No permissions', 'a website cannot ask for any here, and this one asks for none: no camera, microphone, location, contacts or notifications.'],
    ['Browser storage', 'keeps your settings and the verses you have played on this device, so they replay without a connection. Clearing site data removes them.'],
    ['Network', 'loads the Bible text, search results and audio while you are online.'],
  ],
};

/** [title, detail] pairs for the copy that is running. */
export function permissionRows() {
  return ROWS[getPlatformKind()] || ROWS.web;
}

// The same answer in two lines, for the small player panel where the full
// licensing list would not fit.
const SHORT = {
  android: ['No camera, microphone, location or contacts.', 'Internet and network state; storage on Android 9 and older, for exports.'],
  ios: ['No permission prompts at all.', 'Network only, to load the text and the audio.'],
  pwa: ['Nothing is asked for when you install.', 'Device storage holds the offline copy, your settings and played verses.'],
  web: ['No camera, microphone, location or contacts.', 'Browser storage holds your settings and the verses you have played.'],
};

export function permissionSummary() {
  return SHORT[getPlatformKind()] || SHORT.web;
}