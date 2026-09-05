import { test } from '@playwright/test';
import fs from 'fs/promises';

test('export whole bible pdf, two-column, with colophons', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('/settings');
  const twoBtn = page.getByRole('button', { name: /^Two$/ });
  await twoBtn.waitFor({ timeout: 15000 });
  await twoBtn.click();

  const dlBtn = page.getByRole('button', { name: /Download Bible \(PDF\)/ });
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 150000 }),
    dlBtn.click(),
  ]);
  const p = await download.path();
  await fs.copyFile(p, '/tmp/whole-bible-export.pdf');
  console.log('SAVED_TO:/tmp/whole-bible-export.pdf');
});
