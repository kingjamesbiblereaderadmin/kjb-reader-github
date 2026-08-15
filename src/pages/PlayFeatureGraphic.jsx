import React, { useRef, useState, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

// The screenshot the user provided — used as the app preview inside the
// 1024×500 Play Store feature graphic.
const SCREENSHOT_URL =
  'https://media.base44.com/images/public/6a8011c360ff52dad38eb2f3/5aab6b216_Screenshot_20260815_230847_Chrome.jpg';

const ARTBOARD_W = 1024;
const ARTBOARD_H = 500;

export default function PlayFeatureGraphic() {
  const artboardRef = useRef(null);
  const wrapRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [scale, setScale] = useState(1);

  // Measure the preview container and scale the fixed 1024×500 artboard to
  // fit it. Export always runs at the artboard's true resolution.
  useEffect(() => {
    if (!wrapRef.current) return;
    const update = () => {
      const w = wrapRef.current.clientWidth;
      setScale(Math.min(1, w / ARTBOARD_W));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const handleExport = async () => {
    if (!artboardRef.current) return;
    setExporting(true);
    const prev = artboardRef.current.style.transform;
    artboardRef.current.style.transform = 'none';
    try {
      const canvas = await html2canvas(artboardRef.current, {
        width: ARTBOARD_W,
        height: ARTBOARD_H,
        scale: 1,
        backgroundColor: '#0b0b12',
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = 'play-feature-graphic.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      artboardRef.current.style.transform = prev;
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center gap-6 p-8 font-sans">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">Google Play Feature Graphic</h1>
        <span className="text-xs text-neutral-400 bg-neutral-800 px-2 py-1 rounded">1024 × 500</span>
      </div>

      <div ref={wrapRef} className="w-full max-w-4xl">
        <div
          style={{
            height: ARTBOARD_H * scale,
          }}
          className="rounded-xl overflow-hidden border border-neutral-800 shadow-2xl"
        >
          <div
            ref={artboardRef}
            style={{
              width: ARTBOARD_W,
              height: ARTBOARD_H,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
            className="relative"
          >
            <FeatureArtboard />
          </div>
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7839f3] hover:bg-[#6d2fe6] disabled:opacity-60 transition-colors font-medium text-sm"
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {exporting ? 'Exporting…' : 'Download PNG (1024×500)'}
      </button>
    </div>
  );
}

// The fixed-size 1024×500 artboard. Branded gradient background with the app
// name on the left and the user's screenshot framed as a phone mockup on the
// right — the standard Play Store feature graphic layout.
function FeatureArtboard({ onImgLoad }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'radial-gradient(120% 120% at 15% 20%, #2a1a5e 0%, #140c33 45%, #0b0b12 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Soft accent glow */}
      <div
        style={{
          position: 'absolute',
          top: -120,
          right: -80,
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(120,57,243,0.35) 0%, transparent 70%)',
        }}
      />

      {/* Left: branding */}
      <div
        style={{
          position: 'absolute',
          left: 64,
          top: 0,
          bottom: 0,
          width: 420,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #7839f3, #b06bff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            ✝
          </div>
          <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: 0.2 }}>KJB Reader</span>
        </div>

        <h1
          style={{
            fontSize: 46,
            lineHeight: 1.08,
            fontWeight: 800,
            margin: 0,
            letterSpacing: -0.5,
          }}
        >
          Read the King<br />James Bible
        </h1>
        <p
          style={{
            marginTop: 14,
            fontSize: 19,
            lineHeight: 1.4,
            color: 'rgba(255,255,255,0.78)',
            fontWeight: 400,
          }}
        >
          Pure Cambridge Edition · synced audio · offline
        </p>

        <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
          {['Free', 'No ads', 'Offline'].map((t) => (
            <span
              key={t}
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: '5px 12px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#fff',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Right: phone mockup with the screenshot */}
      <div
        style={{
          position: 'absolute',
          right: 70,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 230,
          height: 420,
          borderRadius: 30,
          background: '#0b0b12',
          border: '4px solid rgba(255,255,255,0.85)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(120,57,243,0.4)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={SCREENSHOT_URL}
          alt="KJB Reader app screenshot"
          crossOrigin="anonymous"
          onLoad={onImgLoad}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
        />
      </div>

      {/* Subtle bottom edge */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 4,
          background: 'linear-gradient(90deg, #7839f3, #b06bff)',
        }}
      />
    </div>
  );
}