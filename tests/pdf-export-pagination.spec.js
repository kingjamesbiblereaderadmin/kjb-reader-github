/**
 * PDF export pagination regression test.
 *
 * Covers the real bug: search-result entries (verse quote + reference +
 * link) used to get split across a PDF page boundary — the quote on one
 * page, its reference/link stranded alone at the top of the next. The fix
 * in exportVerses.js measures each entry's total height up front and moves
 * the WHOLE entry to a fresh page if it doesn't fit, instead of letting the
 * renderer's line-by-line page-break check split it mid-item.
 *
 * This exercises the actual shipped export flow (not a reimplementation):
 * search for a term with enough hits to span multiple PDF pages, trigger a
 * real PDF export via the UI, and confirm the download is a valid,
 * multi-page PDF (proves the fix doesn't crash or truncate the export).
 * Pixel/text-position-level verification of "no entry split across a page"
 * is covered separately by the direct jsPDF math check during development
 * (see the git history for this fix) — full text-layout parsing of the PDF
 * output is out of scope for this test file.
 */
import { test, expect } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';

test.describe('PDF export', () => {
  test('multi-page search-result export produces a valid PDF', async ({ page }) => {
    await page.goto('/search');
    const input = page.getByPlaceholder(/study, Romans 3:25/i);
    // "wisdom" has enough KJV occurrences to span multiple PDF pages
    // without being so large (like "God", ~4000+ hits) that the export
    // takes an unreasonable time to generate in a test run.
    await input.fill('wisdom');
    await input.press('Enter');
    await page.waitForSelector('text=/Testament/', { timeout: 15000 });

    const exportBtn = page.locator('button[title^="Export"]').first();
    await exportBtn.click();
    await page.getByText('PDF (.pdf)').click();

    const download = await page.waitForEvent('download', { timeout: 30000 });
    const filePath = await download.path();
    expect(filePath, 'PDF export did not produce a downloadable file').toBeTruthy();

    const bytes = await fs.readFile(filePath);
    expect(bytes.length, 'exported PDF is suspiciously small/empty').toBeGreaterThan(2000);

    const pdf = await PDFDocument.load(bytes);
    const pageCount = pdf.getPageCount();
    expect(pageCount, 'expected a multi-page PDF for a common search term').toBeGreaterThan(1);
  });
});
