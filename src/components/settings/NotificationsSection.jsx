import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  getNotificationsEnabled,
  requestNotificationPermission,
  disableNotifications,
  scheduleDailyNotification,
} from '@/lib/notifications';
import { getDailyVerse } from '@/lib/dailyVerse';

export default function NotificationsSection({ expanded, onToggleExpand }) {
  const [enabled, setEnabled] = useState(getNotificationsEnabled);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const sync = () => {
      setEnabled(getNotificationsEnabled());
      setBlocked('Notification' in window && Notification.permission === 'denied');
    };
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  const handleToggle = async () => {
    if (enabled) {
      disableNotifications();
      setEnabled(false);
      window.dispatchEvent(new Event('storage'));
      return;
    }
    if (!('Notification' in window)) return;
    const result = await requestNotificationPermission();
    if (result === 'granted') {
      localStorage.setItem('kjb-notifications-enabled', 'true');
      setEnabled(true);
      window.dispatchEvent(new Event('storage'));
      scheduleDailyNotification(getDailyVerse());
    }
    setBlocked(result === 'denied');
  };

  return (
    <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl mb-5 overflow-hidden shadow-lg shadow-black/[0.03]">
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/5 transition-colors text-left"
      >
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-lg font-semibold text-foreground">Notifications</h2>
          <p className="font-sans text-xs text-muted-foreground">Daily verse reminder</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-5 pb-6 pt-2 space-y-3">
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="font-sans text-sm text-foreground font-medium">Daily verse reminder</p>
                <p className="font-sans text-xs text-muted-foreground mt-0.5">Get a notification each morning with the verse of the day</p>
              </div>
            </div>
            <Switch checked={enabled} onCheckedChange={handleToggle} />
          </div>
          {blocked && (
            <p className="font-sans text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5 leading-snug">
              <AlertCircle className="w-4 h-4 shrink-0 -mt-0.5" />
              <span>Notifications are blocked for this site in your browser. Allow them in your browser's site settings, then try again.</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}