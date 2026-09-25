import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ExternalLink, Globe, Youtube, PlayCircle, Link2, FileText } from 'lucide-react';

// Linktree icon SVG
export function LinktreeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.736 5.853l4.005-4.117 2.325 2.381-4.2 4.005h5.908v3.288h-5.937l4.229 4.108-2.325 2.339-5.74-5.794-5.741 5.794-2.325-2.339 4.229-4.108H7.436V8.122h5.909l-4.2-4.005 2.324-2.381 4.005 4.117V0h3.062v5.853zm-3.062 9.479h3.062V24h-3.062v-8.668z"/>
    </svg>
  );
}

const linkCardClass = "flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group";

const LINKS = [
  {
    href: "https://godisgracious1031ministriescom.odoo.com/",
    label: "God is Gracious 1031 Ministries",
    sub: "Ministry Website",
    external: true,
    icon: <Globe className="w-5 h-5" />,
    iconBg: "from-sky-500 to-blue-600",
  },
  {
    href: "https://youtube.com/@shawnr325av?si=zC_gQm4I2S_xj-NS",
    label: "YouTube",
    sub: "@shawnr325av",
    external: true,
    icon: <Youtube className="w-5 h-5" />,
    iconBg: "from-red-500 to-rose-600",
  },
  {
    href: "https://rumble.com/user/Godisgracious1031",
    label: "Rumble",
    sub: "Godisgracious1031",
    external: true,
    icon: <PlayCircle className="w-5 h-5" />,
    iconBg: "from-emerald-500 to-green-600",
  },
  {
    href: "https://linktr.ee/shawnr325av",
    label: "Linktree",
    sub: "linktr.ee/shawnr325av",
    external: true,
    icon: <LinktreeIcon className="w-5 h-5" />,
    iconBg: "from-green-500 to-emerald-600",
  },
  {
    href: "mailto:kingjamesbiblereader@outlook.sg",
    label: "Email",
    sub: "kingjamesbiblereader@outlook.sg",
    external: false,
    icon: <Mail className="w-5 h-5" />,
    iconBg: "from-emerald-500 to-teal-600",
  },
];

export default function ContactLinks() {
  return (
    <div className="space-y-3">
      {LINKS.map((link, idx) => {
        const inner = (
          <>
            <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br ${link.iconBg}`}>
              {link.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="notranslate font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors break-words" translate="no">{link.label}</p>
              <p className="notranslate font-sans text-xs text-muted-foreground break-words" translate="no">{link.sub}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0" />
          </>
        );
        if (link.to) {
          return (
            <Link key={idx} to={link.to} className={linkCardClass}>
              {inner}
            </Link>
          );
        }
        return (
          <a
            key={idx}
            href={link.href}
            {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={linkCardClass}
          >
            {inner}
          </a>
        );
      })}
    </div>
  );
}