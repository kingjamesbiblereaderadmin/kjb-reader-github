import React from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { isInsideStoreApp } from '@/components/GetAppOptions';

// Settings shortcut to /download. Reads differently once this app is already
// installed, where the page is only useful for the other platforms.
export default function DownloadOptionsButton({ className = '' }) {
  const { isInstalled } = useInstallPrompt();
  const installed = isInstalled || isInsideStoreApp();

  return (
    <Link
      to="/download"
      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity ${className}`}
    >
      <Download className="w-4 h-4" />
      {installed ? 'Download for other platforms' : 'Download Options'}
    </Link>
  );
}