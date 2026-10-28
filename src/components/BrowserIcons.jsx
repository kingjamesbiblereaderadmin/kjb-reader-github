import React from 'react';

// Simplified brand marks for the download page's browser quick links.
// Drawn as flat SVG shapes so they stay crisp and need no network requests.

export function ChromeIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#34A853" />
      <path d="M24 24 L24 2 A22 22 0 0 1 43.05 35 Z" fill="#EA4335" />
      <path d="M24 24 L43.05 35 A22 22 0 0 1 4.95 35 Z" fill="#FBBC05" />
      <circle cx="24" cy="24" r="10" fill="#fff" />
      <circle cx="24" cy="24" r="8" fill="#4285F4" />
    </svg>
  );
}

export function EdgeIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#0C63B5" />
      <path
        d="M44.6 15.4 A22 22 0 0 0 9.9 8.6 C 18 4.5 30 7.2 35.4 15.4 C 30.8 11.9 24.5 11.4 19.6 14.4 C 25.6 12.9 33.4 15.6 37.6 21.4 C 41 26.2 40.6 32.9 37.4 37.6 A 22 22 0 0 0 46 24 C 46 21 45.5 18.1 44.6 15.4 Z"
        fill="#3BC7AE"
      />
      <path
        d="M15.4 39.5 C 8.2 33.6 8.4 22.9 15.1 17.2 C 20.4 12.6 28.7 12.5 34.2 16.9 C 27.2 13.9 18.6 16 13.9 21.9 C 9.1 27.9 9.9 36.9 15.4 39.5 Z"
        fill="#7BE0C8"
        opacity="0.85"
      />
    </svg>
  );
}

export function FirefoxIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#FF7139" />
      <path
        d="M7.4 17.2 A 22 22 0 0 1 33.4 4.6 C 24.4 5.9 18.2 11.4 17.9 18.6 C 21.4 14.2 26.6 11.6 32.2 11.6 C 26.3 13.6 21.8 18.5 20.8 24.3 C 19.7 30.7 23.6 37.4 30 39.4 A 22 22 0 0 1 6.2 30 Z"
        fill="#FFB300"
      />
      <circle cx="26.5" cy="29.5" r="7.5" fill="#FF3D00" />
    </svg>
  );
}

export function OperaIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <ellipse cx="24" cy="24" rx="13.5" ry="17" fill="none" stroke="#FF1B2D" strokeWidth="9" />
      <ellipse cx="24" cy="24" rx="6" ry="9" fill="#FF1B2D" opacity="0.25" />
    </svg>
  );
}

export function SafariIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#1B9BF0" />
      <circle cx="24" cy="24" r="16.5" fill="#7ED0F7" opacity="0.55" />
      <path d="M24 12.5 L29.5 24 L24 35.5 L18.5 24 Z" fill="#fff" />
      <path d="M24 12.5 L29.5 24 L24 24 Z" fill="#FF3B30" />
      <path d="M24 35.5 L18.5 24 L24 24 Z" fill="#FF3B30" opacity="0.85" />
    </svg>
  );
}