import { createServer } from 'vite';
import fs from 'fs';

const BIBLE_TXT_URL = 'https://base44.app/api/apps/6a713d810d97fdb5921ed14e/files/mp/public/6a713d810d97fdb5921ed14e/dabab1ba3_recovered-pce-bible.txt';

async function main() {
  const server = await createServer({
    configFile: '/app/vite.config.js',
    root: '/app',
    server: { middlewareMode: true },
    appType: 'custom',
  });

  const { parsePceText } = await server.ssrLoadModule('/src/lib/biblePceParser.js');
  const { exportBiblePdf } = await server.ssrLoadModule('/src/lib/exportBiblePdf.js');

  console.log('Fetching bible text...');
  const res = await fetch(BIBLE_TXT_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const text = await res.text();
  console.log('Fetched', text.length, 'chars');

  const bible = parsePceText(text);
  console.log('Parsed books:', Object.keys(bible).filter(k => k !== '__colophons').length);

  const baseOpts = {
    paragraph: true,
    subscripts: true,
    colophons: true,
    shortNames: false,
    scope: 'whole',
    format: 'pdf',
    appendGospel: true,
    bibleData: bible,
    returnDoc: true,
  };

  fs.mkdirSync('/app/tmp', { recursive: true });

  for (const [label, twoColumn] of [['1col', false], ['2col', true]]) {
    console.log(`\n=== Building ${label} ===`);
    const doc = await exportBiblePdf({ ...baseOpts, twoColumn }, (pct, msg) => {
      if (pct === 100 || pct % 20 < 1) console.log(pct, msg);
    });
    const buf = Buffer.from(doc.output('arraybuffer'));
    const outPath = `/app/tmp/kjb-reader-${label}.pdf`;
    fs.writeFileSync(outPath, buf);
    console.log('Wrote', outPath, buf.length, 'bytes');
  }

  await server.close();
  process.exit(0);
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
