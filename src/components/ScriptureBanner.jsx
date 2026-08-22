import React from 'react';
import { VERSE_BACKGROUNDS } from '@/lib/dailyVerseTheme';

export default function ScriptureBanner() {
  const dow = new Date().getDay();
  const bg = VERSE_BACKGROUNDS[dow];
  const bgStyle = { backgroundImage: `linear-gradient(to bottom right, ${bg.hex[0]}, ${bg.hex[1]})` };

  return (
    <div className="rounded-2xl shadow-lg px-4 sm:px-6 py-6 text-center text-white mb-6" style={bgStyle}>
      <div className="flex items-center justify-center gap-3 xs:gap-6 mb-4 w-full px-2 xs:px-4">
        <span className="h-px flex-1 bg-current opacity-50" />
        <p
          className={`font-sans text-xs xs:text-base font-black tracking-[0.12em] xs:tracking-[0.22em] uppercase flex-shrink-0 ${bg.accent}`}
          style={{ textShadow: '0 2px 10px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.45)' }}
        >
          Scripture
        </p>
        <span className="h-px flex-1 bg-current opacity-50" />
      </div>
      <blockquote
        className="font-serif text-base sm:text-lg leading-relaxed max-w-xl mx-auto font-semibold"
        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.35)' }}
      >
        "Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth."
      </blockquote>
      <div className="flex justify-center mt-5">
        <span
          className="whitespace-nowrap inline-block font-sans"
          style={{
            backgroundColor: `rgba(${bg.pill}, 0.65)`,
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '11px',
            color: 'rgba(255,255,255,0.98)',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.03em',
            padding: '8px 18px',
            boxShadow: '0 3px 9px rgba(0,0,0,0.3)',
          }}
        >
          — 2 Timothy 2:15
        </span>
      </div>
    </div>
  );
}