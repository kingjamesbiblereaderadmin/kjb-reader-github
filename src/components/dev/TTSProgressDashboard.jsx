import React from 'react';
import { ArrowLeft } from 'lucide-react';

// Full-screen iframe embedding the externally-hosted TTS progress dashboard.
// The hosted page already fetches live data and auto-refreshes every 5s, so
// we just embed it directly — no native reimplementation, no CORS issues.
// A small floating button lets the admin return to the Dev Tools tab list.
export default function TTSProgressDashboard({ onBack }) {
  return (
    <div className="relative w-full" style={{ height: '100vh' }}>
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur border border-border text-xs font-medium text-foreground hover:bg-accent/20 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Dev Tools
        </button>
      )}
      <iframe
        src="https://elara-1ee07417.base44.app/functions/getTTSProgress"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="TTS Progress Dashboard"
      />
    </div>
  );
}