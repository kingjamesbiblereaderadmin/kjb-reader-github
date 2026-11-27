const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
    args:['--autoplay-policy=no-user-gesture-required','--mute-audio'] });
  const p = await b.newPage({ viewport: { width: 900, height: 800 } });
  await p.goto('https://kingjamesbiblereader.base44.app/read?book=GEN&chapter=22', { waitUntil:'networkidle', timeout:60000 });
  await p.waitForTimeout(2000);
  await p.getByRole('button', { name: 'Listen', exact: true }).click();
  await p.waitForTimeout(1000);
  await p.getByRole('button', { name: 'Play', exact: true }).click();
  let seen=null;
  for (let i=0;i<12;i++){
    const s = await p.evaluate(() => {
      const h=document.querySelector('.kjb-book-title');
      const c=document.querySelector('.kjb-chapter-heading');
      const cs=h?getComputedStyle(h):null;
      return { speaking: h? h.className.includes('kjb-speaking'):false,
               shadow: cs? cs.boxShadow.slice(0,60):null,
               chapterSpeaking: c? c.className.includes('kjb-speaking'):false };
    });
    if (s.speaking) { seen=s; break; }
    await p.waitForTimeout(700);
  }
  console.log(JSON.stringify(seen));
  await b.close();
})();
