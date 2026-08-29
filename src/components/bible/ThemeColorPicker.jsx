import React, { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { useTheme, COLOUR_PALETTES } from '@/lib/themeContext';

// Lets the user choose a fixed colour palette. Used in Settings and the
// first-load prompt.
export default function ThemeColorPicker({ compact = false }) {
  const { colorMode, setColorMode, colourId, setColourId } = useTheme();
  const palettes = COLOUR_PALETTES.filter(p => p.id !== 'custom');

  // "Match Daily" mode has been removed — always use a fixed palette.
  useEffect(() => {
    if (colorMode !== 'fixed') setColorMode('fixed');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [customHex, setCustomHex] = useState(() => {
    try { return localStorage.getItem('kjb-custom-accent') || '#B8860B'; } catch { return '#B8860B'; }
  });

  // Save the chosen hex and (re)apply the Custom palette. Toggling colourId off
  // and back to 'custom' forces the theme effect to re-read the new hex.
  const applyCustom = (hex) => {
    setCustomHex(hex);
    try { localStorage.setItem('kjb-custom-accent', hex); } catch {}
    if (colourId === 'custom') {
      setColourId('gold');
      setTimeout(() => setColourId('custom'), 0);
    } else {
      setColourId('custom');
    }
  };

  return (
    <div className="space-y-3">
      {!compact && (
        <h3 className="font-serif text-base font-semibold text-foreground flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Theme Color
        </h3>
      )}

      {/* Palette swatches */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {palettes.map(p => (
          <button
            key={p.id}
            onClick={() => setColourId(p.id)}
            title={p.name}
            className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
              colourId === p.id ? 'border-foreground' : 'border-border hover:border-accent'
            }`}
          >
            <span className="w-5 h-5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: p.swatch }} />
            <span className="font-sans text-xs font-medium text-foreground truncate">{p.name}</span>
          </button>
        ))}

        {/* Custom colour picker */}
        <label
          className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
            colourId === 'custom' ? 'border-foreground' : 'border-border hover:border-accent'
          }`}
          title="Custom colour"
        >
          <span className="relative w-5 h-5 rounded-full border border-black/10 overflow-hidden flex-shrink-0" style={{ backgroundColor: customHex }}>
            <input
              type="color"
              value={customHex}
              onChange={(e) => applyCustom(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </span>
          <span className="font-sans text-xs font-medium text-foreground truncate">Custom</span>
        </label>
      </div>
    </div>
  );
}