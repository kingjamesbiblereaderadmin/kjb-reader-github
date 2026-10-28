import React from 'react';
import chromeLogo from '@/assets/browser-logos/chrome.svg';
import edgeLogo from '@/assets/browser-logos/edge.svg';
import firefoxLogo from '@/assets/browser-logos/firefox.svg';
import operaLogo from '@/assets/browser-logos/opera.svg';
import safariLogo from '@/assets/browser-logos/safari.svg';

// Official browser brand marks (from the browser-logos set), bundled as local
// assets so they render crisply offline and need no network requests.

function BrandMark({ src, className = '' }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable="false"
      className={`object-contain select-none ${className}`}
    />
  );
}

export function ChromeIcon({ className = '' }) {
  return <BrandMark src={chromeLogo} className={className} />;
}

export function EdgeIcon({ className = '' }) {
  return <BrandMark src={edgeLogo} className={className} />;
}

export function FirefoxIcon({ className = '' }) {
  return <BrandMark src={firefoxLogo} className={className} />;
}

export function OperaIcon({ className = '' }) {
  return <BrandMark src={operaLogo} className={className} />;
}

export function SafariIcon({ className = '' }) {
  return <BrandMark src={safariLogo} className={className} />;
}