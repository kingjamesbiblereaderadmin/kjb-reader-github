// Shared "Last Updated" logic used by the Settings App Info row and the
// landing page footer so both always show the same date.

import { isNativeAndroid } from '@/lib/isNativeAndroid';
import { isNativeIos } from '@/lib/isNativeIos';
import { getNativeAppVersion, getNativeBuildDate } from '@/lib/installSource';
import { getDeployedWorkerVersion, getLiveWorkerVersion } from '@/lib/liveWorkerVersion';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Native store-release fallbacks (used only when the build carries no stamp).
export const NATIVE_LAST_UPDATED = { android: 'October 23rd, 2026', ios: 'October 23rd, 2026' };

export function formatVersionDate(version) {
  const m = /^v(\d{4})(\d{2})(\d{2})_/.exec(version || '');
  if (!m) return null;
  const day = String(parseInt(m[3], 10));
  const suffix = (['11', '12', '13'].includes(day)) ? 'th' :
    day.endsWith('1') ? 'st' : day.endsWith('2') ? 'nd' : day.endsWith('3') ? 'rd' : 'th';
  return `${MONTH_NAMES[parseInt(m[2], 10) - 1]} ${day}${suffix}, ${m[1]}`;
}

// The date shown for "Last Updated": native shells use the store-build stamp,
// everything else derives it from the live/deployed web worker version.
export async function getLastUpdatedDate() {
  try {
    const nativeVersion = await getNativeAppVersion();
    if (nativeVersion) {
      return formatVersionDate(`v${(getNativeBuildDate() || '').replace(/-/g, '')}_`)
        || NATIVE_LAST_UPDATED[isNativeAndroid() ? 'android' : 'ios'];
    }
  } catch { /* fall through to web logic */ }
  const version = (await getDeployedWorkerVersion()) || (await getLiveWorkerVersion());
  return formatVersionDate(version);
}