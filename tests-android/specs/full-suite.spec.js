/**
 * Full native UI suite, deliberately kept as ONE spec file.
 *
 * WebdriverIO's local runner starts a fresh Appium session per spec FILE
 * (install the UiAutomator2 test server, launch its instrumentation, start
 * the app) — on the 1-CPU-core emulator this CI uses, that startup alone
 * can take a couple of minutes. Splitting these into separate files (as an
 * earlier version of this suite did) meant paying that cost five times
 * over. One file = one session, reused across every describe block below.
 *
 * Covers: app launch/navigation, verse actions (highlight/save), settings,
 * search, and offline behavior — see each describe block's own comments.
 */
import { expect } from '@wdio/globals';
import { switchToWebview, waitForReaderContent, goTo } from '../helpers.js';

before(async () => {
  await switchToWebview(driver);
});

describe('App launch and reader navigation', () => {
  it('launches and renders the app shell', async () => {
    const body = await driver.$('body');
    await body.waitForExist({ timeout: 15000 });
    const text = await body.getText();
    expect(text.length).toBeGreaterThan(0);
  });

  it('opens a specific chapter via direct navigation and renders real verse text', async () => {
    await goTo(driver, '/read?book=JHN&chapter=3');
    await waitForReaderContent(driver);

    const verses = await driver.$$('.kjb-verse-text');
    expect(verses.length).toBeGreaterThan(0);

    const fullText = await driver.execute(() => document.body.innerText);
    expect(fullText.toLowerCase()).toContain('everlasting life');
  });

  it('prev/next chapter buttons actually change the chapter', async () => {
    await goTo(driver, '/read?book=JHN&chapter=3');
    await waitForReaderContent(driver);

    let nextBtn = await driver.$('button[title="Next"]');
    if (!(await nextBtn.isExisting())) {
      nextBtn = await driver.$('button .lucide-chevron-right').then((el) => el.$('..'));
    }
    if (await nextBtn.isExisting()) {
      await nextBtn.click();
      await driver.waitUntil(
        async () => (await driver.execute(() => window.location.search)).includes('chapter=4'),
        { timeout: 10000, timeoutMsg: 'Next-chapter button did not navigate to chapter 4' }
      );
    }
  });
});

describe('Verse actions (native)', () => {
  beforeEach(async () => {
    await goTo(driver, '/read?book=JHN&chapter=3');
    await waitForReaderContent(driver);
    await driver.execute(() => {
      try { localStorage.removeItem('kjb-verse-highlights'); } catch {}
      try { localStorage.removeItem('kjb-saved-verses'); } catch {}
    });
  });

  it('tapping a verse opens the VerseTapBar with Highlight/Copy/Share/Save', async () => {
    const verse16 = await driver.$('#v16 .kjb-verse-text');
    await verse16.click();

    const highlightBtn = await driver.$('button*=Highlight');
    await highlightBtn.waitForDisplayed({ timeout: 10000 });

    const copyBtn = await driver.$('button*=Copy');
    const saveBtn = await driver.$('button*=Save');
    expect(await copyBtn.isDisplayed()).toBe(true);
    expect(await saveBtn.isDisplayed()).toBe(true);
  });

  it('highlighting a verse via the color dropdown persists to localStorage', async () => {
    const verse16 = await driver.$('#v16 .kjb-verse-text');
    await verse16.click();

    const highlightBtn = await driver.$('button*=Highlight');
    await highlightBtn.waitForDisplayed({ timeout: 10000 });
    await highlightBtn.click();

    const firstColor = await driver.$('[role="menuitem"]');
    await firstColor.waitForDisplayed({ timeout: 5000 });
    await firstColor.click();

    await driver.waitUntil(
      async () => {
        const btn = await driver.$('button*=Highlighted');
        return btn.isDisplayed().catch(() => false);
      },
      { timeout: 10000, timeoutMsg: 'Highlight button never flipped to "Highlighted"' }
    );

    const stored = await driver.execute(() => localStorage.getItem('kjb-verse-highlights'));
    expect(stored).toBeTruthy();
  });

  it('saving a verse persists to localStorage', async () => {
    const verse16 = await driver.$('#v16 .kjb-verse-text');
    await verse16.click();

    const saveBtn = await driver.$('button*=Save');
    await saveBtn.waitForDisplayed({ timeout: 10000 });
    await saveBtn.click();

    await driver.waitUntil(
      async () => {
        const stored = await driver.execute(() => localStorage.getItem('kjb-saved-verses'));
        return !!stored;
      },
      { timeout: 10000, timeoutMsg: 'Verse was not saved to localStorage' }
    );
  });
});

describe('Settings (native)', () => {
  beforeEach(async () => {
    await goTo(driver, '/settings');
    const expandAll = await driver.$('button*=Expand All');
    if (await expandAll.isExisting()) await expandAll.click();
  });

  it('switching theme mode actually applies it (html.dark class)', async () => {
    const darkBtn = await driver.$('button*=🌙 Dark');
    await darkBtn.waitForDisplayed({ timeout: 10000 });
    await darkBtn.click();

    await driver.waitUntil(
      async () => driver.execute(() => document.documentElement.classList.contains('dark')),
      { timeout: 10000, timeoutMsg: 'Dark mode did not apply to <html>' }
    );

    const lightBtn = await driver.$('button*=☀️ Light');
    await lightBtn.click();
    await driver.waitUntil(
      async () => !(await driver.execute(() => document.documentElement.classList.contains('dark'))),
      { timeout: 10000, timeoutMsg: 'Light mode did not remove the dark class' }
    );
  });

  it('switching reading font persists and applies to the reader', async () => {
    const cursiveBtn = await driver.$('button*=Cursive');
    await cursiveBtn.waitForDisplayed({ timeout: 10000 });
    await cursiveBtn.click();

    await driver.waitUntil(
      async () => (await driver.execute(() => localStorage.getItem('kjb-reader-font-family'))) === 'cursive',
      { timeout: 10000, timeoutMsg: 'Font choice was not persisted to localStorage' }
    );

    await goTo(driver, '/read?book=GEN&chapter=1');
    await driver.waitUntil(
      async () => driver.execute(() => document.querySelector('.cursive-em-style') != null),
      { timeout: 10000, timeoutMsg: 'Cursive font class was not applied to the reader' }
    );
  });

  it('text size buttons change the persisted zoom level', async () => {
    await goTo(driver, '/settings');
    const expandAll = await driver.$('button*=Expand All');
    if (await expandAll.isExisting()) await expandAll.click();

    const before = await driver.execute(() => localStorage.getItem('kjb-zoom'));
    const increaseBtn = await driver.$('button[aria-label="Increase text size"]');
    await increaseBtn.waitForDisplayed({ timeout: 10000 });
    await increaseBtn.click();

    await driver.waitUntil(
      async () => (await driver.execute(() => localStorage.getItem('kjb-zoom'))) !== before,
      { timeout: 10000, timeoutMsg: 'Text size did not change after clicking Increase' }
    );
  });
});

describe('Search (native)', () => {
  it('typing a query and pressing Enter shows real results', async () => {
    await goTo(driver, '/search');
    const input = await driver.$('input[placeholder*="Romans 3:25"]');
    await input.waitForDisplayed({ timeout: 15000 });
    await input.setValue('love');
    await driver.execute(() => {
      const el = document.activeElement;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    await driver.waitUntil(
      async () => {
        const text = await driver.execute(() => document.body.innerText);
        return /Testament/.test(text);
      },
      { timeout: 15000, timeoutMsg: 'Search results never rendered' }
    );
  });
});

describe('Offline behavior (native)', () => {
  async function setOffline(offline) {
    await driver.execute('mobile: setConnectivity', {
      wifi: !offline,
      data: !offline,
      airplaneMode: offline,
    });
  }

  after(async () => {
    await setOffline(false);
  });

  it('app shell still loads after going offline (real network cut, not just simulated)', async () => {
    await goTo(driver, '/');
    await driver.pause(2000);

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

    await waitForReaderContent(driver, 25000);
    const fullText = await driver.execute(() => document.body.innerText);
    expect(fullText.toLowerCase()).toContain('beginning');

    await setOffline(false);
  });
});
