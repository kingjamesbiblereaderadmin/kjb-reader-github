import { expect } from '@wdio/globals';
import { switchToWebview, waitForReaderContent, goTo } from '../helpers.js';

// `mobile: setConnectivity` is a UiAutomator2 driver command and works
// regardless of the current context (native or webview) — it talks to the
// device/emulator directly rather than through the page's own JS, unlike
// everything else in this suite.
async function setOffline(offline) {
  await driver.execute('mobile: setConnectivity', {
    wifi: !offline,
    data: !offline,
    airplaneMode: offline,
  });
}

describe('Offline behavior (native)', () => {
  before(async () => {
    await switchToWebview(driver);
  });

  after(async () => {
    // Always leave the emulator's network state as this run found it —
    // an earlier failure shouldn't leave the device offline for whatever
    // spec file runs next.
    await setOffline(false);
  });

  it('app shell still loads after going offline (real network cut, not just simulated)', async () => {
    await goTo(driver, '/');
    await driver.pause(2000); // let the service-worker precache settle

    await setOffline(true);
    await driver.pause(2000);

    await goTo(driver, '/');
    const body = await driver.$('body');
    await body.waitForExist({ timeout: 20000 });
    const text = await body.getText();
    expect(text.length).toBeGreaterThan(0);

    await setOffline(false);
  });

  it('bundled offline Bible text still renders with the network off', async () => {
    await setOffline(true);
    await goTo(driver, '/read?book=GEN&chapter=1');

    // Native asset bundling (MainActivity's shouldInterceptRequest) is what
    // this is really testing — a real browser-based Playwright test can't
    // exercise this path at all, since it has no equivalent bundled asset
    // fallback.
    await waitForReaderContent(driver, 25000);
    const fullText = await driver.execute(() => document.body.innerText);
    expect(fullText.toLowerCase()).toContain('beginning');

    await setOffline(false);
  });
});
