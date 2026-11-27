import React, { useEffect, useState } from 'react';
import { Volume2, Check } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

// Handing an <audio> element to a chosen speaker needs setSinkId, which only
// Chromium browsers expose — Safari and iOS have no way to do it, so the control
// hides itself there instead of offering a list that could not change anything.
export const canPickOutput = () =>
  typeof HTMLMediaElement !== 'undefined' && typeof HTMLMediaElement.prototype.setSinkId === 'function';

// Where the reading comes out of: the system default, or any speaker, headset or
// dock the browser reports. Long device names wrap instead of being cut off.
export default function OutputDeviceMenu({ value = '', onChange, buttonClass = '' }) {
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    if (!open || !canPickOutput()) return undefined;
    let alive = true;
    const read = () => {
      navigator.mediaDevices?.enumerateDevices?.()
        .then((list) => {
          if (!alive) return;
          // 'default' repeats the system default already listed first, and
          // 'communications' is a phone-only duplicate of the headset.
          setDevices(list.filter((d) => d.kind === 'audiooutput' && d.deviceId !== 'default' && d.deviceId !== 'communications'));
        })
        .catch(() => {});
    };
    read();
    navigator.mediaDevices?.addEventListener?.('devicechange', read);
    return () => {
      alive = false;
      navigator.mediaDevices?.removeEventListener?.('devicechange', read);
    };
  }, [open]);

  if (!canPickOutput()) return null;

  const options = [
    { id: '', label: 'System default' },
    ...devices.map((d, i) => ({ id: d.deviceId, label: d.label || `Speaker ${i + 1}` })),
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Playback device"
          title="Playback device"
          aria-expanded={open}
          data-testid="tts-output-btn"
          className={buttonClass}
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-64 p-2">
        <p className="px-2 py-1.5 font-sans text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Playback device
        </p>
        <div className="max-h-64 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.id || 'default'}
              type="button"
              onClick={() => { onChange?.(option.id); setOpen(false); }}
              className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left font-sans text-xs leading-snug text-foreground hover:bg-accent/15"
            >
              <span className="min-w-0 flex-1 whitespace-normal break-words">{option.label}</span>
              {value === option.id && <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}