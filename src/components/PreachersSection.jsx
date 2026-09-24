import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, CheckCircle, Users, ChevronDown, ChevronLeft, ChevronRight, Youtube, Facebook, Instagram, Link as LinkIcon, Copy, Globe } from 'lucide-react';

function CopyButton({ text, className }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div
      role="button"
      onClick={handleCopy}
      className={className || "p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"}
      title="Copy text"
    >
      {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </div>
  );
}

function TikTokIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.72a4.85 4.85 0 01-1.01-.03z" />
    </svg>
  );
}

function getLinkIcon(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return <Youtube className="w-3.5 h-3.5" />;
  if (url.includes('tiktok.com')) return <TikTokIcon className="w-3.5 h-3.5" />;
  if (url.includes('facebook.com')) return <Facebook className="w-3.5 h-3.5" />;
  if (url.includes('instagram.com')) return <Instagram className="w-3.5 h-3.5" />;
  if (url.includes('linktr.ee')) return <LinkIcon className="w-3.5 h-3.5" />;
  return <Globe className="w-3.5 h-3.5" />;
}

function getLinkLabel(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('facebook.com')) return 'Facebook';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('linktr.ee')) return 'Linktree';
  if (url.includes('univer.se')) return 'Joyfully Church';
  if (url.includes('mission1611.com')) return 'Mission 1611';
  try { return new URL(url).hostname.replace('www.', ''); } catch { return 'Website'; }
}

export const PREACHERS = [
  {
    name: 'Robert Breaker',
    desc: 'KJB missionary evangelist, rightly dividing the word of truth. Also preaches in Spanish.',
    photo: 'https://yt3.googleusercontent.com/ytc/AIdro_mJGwX4Nio4c1LLI1ja79m1lHQIUJ53l-J42tlZcNCEk0w=s176-c-k-c0x00ffffff-no-rj',
    links: [
      'https://www.youtube.com/@Robertbreaker3',
      'https://www.tiktok.com/@robertbreaker',
      'https://www.facebook.com/thecloudchurch.org/',
      'https://thecloudchurch.org/',
      'https://laiglesiadelanube.com/']
  },
  {
    name: 'Robert Potthoff',
    desc: 'Big Red Preacher — KJB soul winner.',
    photo: 'https://media.base44.com/images/public/6a8011c360ff52dad38eb2f3/92d0ffb05_unnamed.png',
    links: [
      'https://www.facebook.com/potthoff87',
      'https://www.instagram.com/big_red_preacher',
      'https://www.tiktok.com/@mission1611grace',
      'https://mission1611.com/']
  },
  {
    name: 'Ryan Poff',
    desc: 'Seed of Hope Church — KJB pastor and preacher.',
    photo: 'https://yt3.googleusercontent.com/VF5lO3c2JpNd61mBrKtPFfUs08uFE66b6y6vf4eMDA6PN3lW025tEBT7varYSFmeG5-eZZ84gg=s176-c-k-c0x00ffffff-no-rj',
    links: [
      'https://www.seedofhopechurch.org/',
      'https://youtube.com/@ryan_poff',
      'https://www.tiktok.com/@ryan_sohc']
  },
  {
    name: 'Skyler (AV1611 Ministry)',
    desc: 'AV1611 Ministry — KJB defence and preaching.',
    photo: 'https://yt3.googleusercontent.com/ZhXQ7IgQ6pHOkWcSZafGDHhOqbRecC5ZaJ7oX8FXLJAPHT59yDXcEPyNPKYNgNNa20IzJ5pWAg=s176-c-k-c0x00ffffff-no-rj',
    links: [
      'https://www.tiktok.com/@av1611ministries',
      'https://youtube.com/@av1611ministries',
      'https://www.instagram.com/skybakker3/']
  },
  {
    name: 'Crown of Thorns',
    desc: 'KJB preaching ministry on YouTube.',
    photo: 'https://yt3.googleusercontent.com/WjelDZ6TP5t3xYW0ajrp-eSgjzC4dBSIH6WS1wpAoJ1rMrEhIV8xTqJdPWB0Z_hOIIxdnwnY3Q=s176-c-k-c0x00ffffff-no-rj',
    links: [
      'https://www.youtube.com/@CrownOfThorns']
  },
  {
    name: 'Paul Johnson',
    desc: 'Biblical Salvation — KJB preaching and Bible teaching.',
    photo: 'https://base44.app/api/apps/6a8011c360ff52dad38eb2f3/files/mp/public/6a8011c360ff52dad38eb2f3/5888f56c6_paul-johnson.jpg',
    links: [
      'https://www.tiktok.com/@pauljohnson9632',
      'https://youtube.com/@biblicalsalvation']
  },
  {
    name: 'CPR Missions',
    desc: 'Church Planting and Revival Missions — soul winning and church planting.',
    photo: 'https://yt3.googleusercontent.com/DD0QKBtsaz7Jg_FaLihJT7RQWx2F4ftUL8hiRoZDDs7Iw11P8YcHgsdGxnZWP3Cz_YFPGXkW=s176-c-k-c0x00ffffff-no-rj',
    links: [
      'https://www.youtube.com/channel/UCWBR5DmAi2XPMFRtb-wqHwg',
      'https://www.tiktok.com/@cprmissions',
      'https://www.facebook.com/CPRmission/',
      'https://www.instagram.com/cprmissions/']
  },
  {
    name: 'James Bray',
    desc: 'KJB preacher and Bible teacher on YouTube.',
    photo: 'https://yt3.googleusercontent.com/1B9oAx4QevNcFBzYYh9psQv21c8_OrLzd-DnUs6b2kBjMsPktc7S8uNluZpR51D8qJ_tM3aFLA=s176-c-k-c0x00ffffff-no-rj',
    links: [
      'https://youtube.com/@jamesbrayall3?si=nXkuHAhyVvC_0KVg']
  },
];

const initials = (name) =>
  name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

// Preacher avatar: shows their channel/ministry photo when one is available,
// falling back to the initials circle if there's no photo or it fails to load.
function PreacherAvatar({ preacher, size = 'w-9 h-9', textClass = 'text-xs' }) {
  const [failed, setFailed] = useState(false);
  if (!preacher.photo || failed) {
    return (
      <div className={`flex-shrink-0 ${size} flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-sans font-semibold ${textClass}`}>
        {initials(preacher.name)}
      </div>
    );
  }
  return (
    <img
      src={preacher.photo}
      alt={preacher.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`flex-shrink-0 ${size} rounded-full object-cover bg-amber-100 dark:bg-amber-900/40 border border-border/40`}
    />
  );
}

export default function PreachersSection({
  groupOpen: externalGroupOpen,
  onToggleGroup: externalToggleGroup,
}) {
  const [internalGroupOpen, setInternalGroupOpen] = useState(true);
  // Directory pattern: null = compact card grid; a preacher name = detail view
  // for that preacher. Keeps the section compact no matter how many preachers
  // or links are added — expansion is one level deep instead of accordion-wide.
  const [selected, setSelected] = useState(null);

  const groupOpen = externalGroupOpen !== undefined ? externalGroupOpen : internalGroupOpen;
  const toggleGroup = externalToggleGroup || (() => setInternalGroupOpen((o) => !o));

  // Collapsing the group should reset back to the directory list, so reopening
  // always shows the compact view.
  const wasOpenRef = useRef(groupOpen);
  useEffect(() => {
    if (wasOpenRef.current && !groupOpen) setSelected(null);
    wasOpenRef.current = groupOpen;
  }, [groupOpen]);

  const preacher = selected ? PREACHERS.find((p) => p.name === selected) : null;

  return (
    <div className="mb-8 bg-amber-100/60 dark:bg-card border border-amber-200 dark:border-border rounded-2xl overflow-hidden">
      <button
        onClick={toggleGroup}
        className="w-full flex items-start justify-between gap-4 p-5 bg-white/70 dark:bg-secondary/50 hover:bg-white/80 dark:hover:bg-secondary/80 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] text-left"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/60 mb-2">
            <Users className="w-4 h-4 text-amber-600" />
            <h2 className="font-sans font-semibold text-sm text-amber-600">Verified KJB Preachers</h2>
          </div>
          <p className="font-sans text-xs text-muted-foreground">
            KJB-believing, soul-winning preachers — tap one for their verified links
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <CopyButton
            text={`Verified KJB Preachers\n\n${PREACHERS.map(p => `${p.name}\n${p.desc}\n${p.links.join('\n')}`).join('\n\n')}`}
            className="p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 transition-colors cursor-pointer"
          />
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${groupOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {groupOpen && (preacher ? (
        /* ---- Detail view: one preacher, full description + links ---- */
        <div className="p-5 pt-4">
          <button
            onClick={() => setSelected(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border font-sans text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> All preachers
          </button>
          <div className="flex items-start gap-3 mt-4">
            <PreacherAvatar preacher={preacher} size="w-10 h-10" textClass="text-sm" />
            <div className="flex-1 min-w-0">
              <p className="notranslate font-sans text-base font-semibold text-foreground" translate="no">{preacher.name}</p>
              <p className="font-sans text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Verified</span>
                <span className="mx-1.5">·</span>
                {preacher.links.length} {preacher.links.length === 1 ? 'link' : 'links'}
              </p>
            </div>
            <CopyButton
              text={`${preacher.name}\n${preacher.desc}\n\n${preacher.links.join('\n')}`}
              className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-amber-600 transition-colors cursor-pointer"
            />
          </div>
          <p className="font-sans text-xs text-muted-foreground leading-relaxed mt-3 mb-3">{preacher.desc}</p>
          <div className="space-y-2">
            {preacher.links.map((url) =>
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-amber-300/60 transition-colors group"
              >
                <span className="text-muted-foreground group-hover:text-amber-600 transition-colors">
                  {getLinkIcon(url)}
                </span>
                <span className="font-sans text-sm font-medium text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors flex-1 break-words">
                  {getLinkLabel(url)}
                </span>
                <CopyButton text={url} className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-amber-600 transition-colors flex-shrink-0" />
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-amber-600 transition-colors flex-shrink-0" />
              </a>
            )}
          </div>
        </div>
      ) : (
        /* ---- Directory view: compact cards, one per preacher ---- */
        <div className="p-5 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PREACHERS.map((p) => (
            <button
              key={p.name}
              onClick={() => setSelected(p.name)}
              className="group flex items-center gap-3 p-3.5 bg-card border border-border rounded-xl text-left hover:border-amber-300/60 hover:bg-amber-50/40 dark:hover:bg-amber-900/10 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
              <PreacherAvatar preacher={p} />
              <span className="flex-1 min-w-0">
                <span className="notranslate block font-sans text-sm font-semibold text-foreground truncate" translate="no">{p.name}</span>
                <span className="block font-sans text-xs text-muted-foreground truncate">{p.desc}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-600 transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}