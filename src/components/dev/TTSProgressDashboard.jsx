import React from 'react';

// Embeds the externally-hosted TTS generation progress dashboard (a
// self-contained HTML page served by the elara app's getTTSProgress
// function). The dashboard auto-refreshes itself every 5 seconds via fetch
// to ?format=json, so all we need here is a full-bleed iframe.
const TTS_DASHBOARD_URL =
  'https://elara-1ee07417.base44.app/functions/getTTSProgress';

export default function TTSProgressDashboard() {
  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="font-serif text-xl font-bold text-foreground mb-1">
          TTS Progress Dashboard
        </h2>
        <p className="font-sans text-xs text-muted-foreground">
          Live narration generation progress for bm_george &amp; bf_emma voices.
          Auto-refreshes every 5 seconds.
        </p>
      </div>
      <div className="rounded-xl overflow-hidden border border-border shadow-sm bg-card" style={{ height: '75vh' }}>
        <iframe
          src={TTS_DASHBOARD_URL}
          title="TTS Progress Dashboard"
          className="w-full h-full block"
          style={{ border: 'none' }}
          loading="lazy"
        />
      </div>
    </div>
  );
}