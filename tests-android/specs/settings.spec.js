import { expect } from '@wdio/globals';
import { switchToWebview, goTo } from '../helpers.js';

describe('Settings (native)', () => {
  before(async () => {
    await switchToWebview(driver);
  });

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
