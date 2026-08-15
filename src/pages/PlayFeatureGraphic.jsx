import React, { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

// Real KJB (Pure Cambridge Edition) — 1 Corinthians 15:1-4
const VERSES = [
  { v: 1, text: 'Moreover, brethren, I declare unto you the gospel which I preached unto you, which also ye have received, and wherein ye stand;' },
  { v: 2, text: 'By which also ye are saved, if ye keep in memory what I preached unto you, unless ye have believed in vain.' },
  { v: 3, text: 'For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures;' },
  { v: 4, text: 'And that he was buried, and that he rose again the third day according to the scriptures:' },
];

const LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/2279e016e_8e738d108_cfb4bf781_Untitled.png';

// Renders [bracketed] italic words as <em> (KJB convention)
function renderVerse(text) {
  return text.replace(/\[([^\]]*)\]/g, '<em>$1</em>');
}

// The feature-graphic artboard, rendered at exactly 1024×500 using REAL app
// content: the actual logo, the actual indigo→blue gradient, and real KJB
// reader content (John 1) set in the app's serif fonts inside a phone frame.
export function FeatureGraphicArtboard({ innerRef }) {
  return (
    <div
      ref={innerRef}
      style={{
        width: '1024px',
        height: '500px',
        background: 'linear-gradient(135deg, #3b1d9e 0%, #1e40af 55%, #4c1d95 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        padding: '0 72px',
        gap: '56px',
      }}
    >
      {/* soft radial glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 80% at 30% 50%, rgba(124,58,237,0.35), transparent 70%)',
      }} />
      {/* faint large book/cross motif */}
      <div style={{
        position: 'absolute', right: '-40px', top: '-20px', fontSize: '420px', lineHeight: 1,
        opacity: 0.06, fontFamily: 'serif', pointerEvents: 'none', userSelect: 'none',
      }}>✝</div>

      {/* ── Left: logo + wordmark ── */}
      <div style={{ position: 'relative', flex: '0 0 auto', maxWidth: '360px' }}>
        <img src={LOGO_URL} alt="KJB Reader" crossOrigin="anonymous"
          style={{ width: '150px', height: '150px', borderRadius: '34px', display: 'block', marginBottom: '26px', boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }} />
        <h1 style={{
          fontFamily: "'Merriweather','Cormorant Garamond',Georgia,serif",
          fontWeight: 700, fontSize: '60px', lineHeight: 1.05, margin: 0, letterSpacing: '-0.02em',
        }}>KJB Reader</h1>
        <p style={{
          fontFamily: "'Inter',sans-serif", fontSize: '17px', fontWeight: 500,
          margin: '12px 0 0', opacity: 0.82, letterSpacing: '0.01em',
        }}>King James Bible · Pure Cambridge Edition</p>
      </div>

      {/* ── Right: phone mockup with REAL reader content ── */}
      <div style={{ position: 'relative', flex: '1 1 auto', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: '300px', height: '470px', borderRadius: '40px',
          background: '#0b1020', padding: '12px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          position: 'relative',
        }}>
          {/* notch */}
          <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', width: '110px', height: '22px', background: '#0b1020', borderRadius: '0 0 14px 14px', zIndex: 2 }} />
          {/* screen */}
          <div style={{
            width: '100%', height: '100%', borderRadius: '30px', background: '#fbfbfd',
            overflow: 'hidden', color: '#1a1a2e', position: 'relative',
            fontFamily: "'Merriweather','Cormorant Garamond',Georgia,serif",
          }}>
            <div style={{ padding: '38px 22px 18px' }}>
              {/* Book title */}
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#3b1d9e', letterSpacing: '0.02em' }}>The First Epistle of Paul</div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#1a1a2e', letterSpacing: '0.01em', marginTop: '2px' }}>to the Corinthians</div>
              </div>
              {/* Chapter heading with split underline */}
              <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a2e', letterSpacing: '0.04em' }}>Chapter 15</span>
              </div>
              <div style={{ borderBottom: '1px solid #c7c9d6', margin: '0 0 14px' }} />
              {/* Verses */}
              <div style={{ fontSize: '11.5px', lineHeight: 1.5, color: '#1a1a2e' }}>
                {VERSES.map((v) => (
                  <span key={v.v} style={{ display: 'block', marginBottom: '7px' }}>
                    <sup style={{ color: '#4c1d95', fontWeight: 700, fontSize: '9px', marginRight: '3px', verticalAlign: 'super' }}>{v.v}</sup>
                    <span dangerouslySetInnerHTML={{ __html: renderVerse(v.text) }} />
                  </span>
                ))}
                <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '10px', color: '#9aa0b4', fontStyle: 'italic' }}>…the gospel…</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlayFeatureGraphic() {
  const artboardRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleExport = async () => {
    if (!artboardRef.current || exporting) return;
    setExporting(true);
    setPreviewUrl(null);
    try {
      const canvas = await html2canvas(artboardRef.current, {
        width: 1024, height: 500, scale: 2, useCORS: true, backgroundColor: null,
      });
      const url = canvas.toDataURL('image/png');
      setPreviewUrl(url);
      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kjb-reader-play-feature-graphic.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed: ' + (e?.message || e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-5xl">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Play Store Feature Graphic</h1>
        <p className="text-muted-foreground text-sm mb-6">1024×500 banner built from your real app — actual logo, actual reader content (1 Corinthians 15:1-4), actual theme colours.</p>

        {/* Scaled-down preview (1024 → fits container) */}
        <div className="rounded-xl overflow-hidden border border-border shadow-lg bg-card" style={{ aspectRatio: '1024 / 500' }}>
          <div style={{ width: '1024px', height: '500px', transformOrigin: 'top left', transform: 'scale(calc(100% / 1024 * 100))', transformBox: 'fill-box' }}>
            <div style={{ width: '100%', height: '100%' }}>
              <div style={{ transform: 'scale(var(--kjb-fg-scale, 0.46))', transformOrigin: 'top left' }}>
                <FeatureGraphicArtboard innerRef={artboardRef} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? 'Exporting…' : 'Export PNG (1024×500)'}
          </button>
        </div>

        {previewUrl && (
          <div className="mt-8">
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Exported preview</h2>
            <img src={previewUrl} alt="Exported feature graphic" className="w-full rounded-lg border border-border shadow-lg" />
          </div>
        )}

        <div className="mt-8 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground mb-1">How to use</p>
          <p>Click <strong>Export PNG</strong> — the 1024×500 image downloads automatically. Upload it in Play Console → <em>Store listing → App header image</em>.</p>
        </div>
      </div>

      <style>{`
        :root { --kjb-fg-scale: 0.46; }
        @media (min-width: 768px) { :root { --kjb-fg-scale: 0.62; } }
        @media (min-width: 1024px) { :root { --kjb-fg-scale: 0.78; } }
        @media (min-width: 1280px) { :root { --kjb-fg-scale: 0.95; } }
      `}</style>
    </div>
  );
}