import { expect } from '@wdio/globals';
import { switchToWebview, goTo } from '../helpers.js';

describe('Search (native)', () => {
  before(async () => {
    await switchToWebview(driver);
  });

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
