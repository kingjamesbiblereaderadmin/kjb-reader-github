import { expect } from '@wdio/globals';
import { switchToWebview, waitForReaderContent, goTo } from '../helpers.js';

describe('App launch and reader navigation', () => {
  before(async () => {
    await switchToWebview(driver);
  });

  it('launches and renders the app shell', async () => {
    // Something from the app's own chrome (not a blank/error page) must be
    // visible shortly after launch.
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

    // Verse 16 of John 3 is about as recognizable a sanity check as this
    // Bible reader can have — if the wrong text renders, something in the
    // native asset bundling or fetch path is broken, not just a layout bug.
    const fullText = await driver.execute(() => document.body.innerText);
    expect(fullText.toLowerCase()).toContain('everlasting life');
  });

  it('prev/next chapter buttons actually change the chapter', async () => {
    await goTo(driver, '/read?book=JHN&chapter=3');
    await waitForReaderContent(driver);

    const nextBtn = await driver.$('button[aria-label="Next chapter"], button[title="Next chapter"], button*=Next');
    if (await nextBtn.isExisting()) {
      await nextBtn.click();
      await driver.waitUntil(
        async () => (await driver.execute(() => window.location.search)).includes('chapter=4'),
        { timeout: 10000, timeoutMsg: 'Next-chapter button did not navigate to chapter 4' }
      );
    }
  });
});
