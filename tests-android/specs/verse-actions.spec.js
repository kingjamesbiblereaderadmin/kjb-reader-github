import { expect } from '@wdio/globals';
import { switchToWebview, waitForReaderContent, goTo } from '../helpers.js';

describe('Verse actions (native)', () => {
  before(async () => {
    await switchToWebview(driver);
  });

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
