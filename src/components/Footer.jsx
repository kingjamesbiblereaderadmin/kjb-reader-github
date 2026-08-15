import { Link } from "react-router-dom";
import { BookOpen, Mail, Globe, Youtube, Music2, Instagram, PlayCircle, MessageCircle, Link2, GraduationCap } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/2279e016e_8e738d108_cfb4bf781_Untitled.png";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img
                src={LOGO_URL}
                alt="KJB Reader"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextElementSibling.style.display = "inline-flex";
                }}
                className="w-8 h-8 rounded-lg object-cover"
              />
              <span className="items-center gap-2 font-bold" style={{ display: "none", fontFamily: "'Merriweather', serif" }}>
                <BookOpen className="w-5 h-5" /> KJB Reader
              </span>
              <span className="font-bold" style={{ fontFamily: "'Merriweather', serif" }}>KJB Reader</span>
            </div>
            <p className="text-sm text-primary-foreground/70 leading-relaxed max-w-xs">
              A free, installable King James Bible reading app — offline access, search, bookmarks, and privacy-first design.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/60 mb-4">Resources</h3>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><Link to="/Salvation" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors duration-300">Are you saved?</Link></li>
              <li><a href="https://kjbi.org/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary-foreground/80 hover:text-primary-foreground transition-colors duration-300"><GraduationCap className="w-3.5 h-3.5" /> KJBI.org Bible College</a></li>
              <li><a href="#" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors duration-300">SidePanel Extension</a></li>
              <li><a href="https://discord.gg/HK9Kqmg7Jh" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors duration-300">KJB Knights Server</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/60 mb-4">Legal</h3>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors duration-300">Privacy Policy</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors duration-300">Terms of Service</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors duration-300">Legacy Reader</a></li>
              <li><Link to="/Contact" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors duration-300">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/60 mb-4">Connect</h3>
            <div className="flex flex-wrap gap-3">
              <a href="mailto:kingjamesbiblereader@outlook.sg" aria-label="Email" className="w-9 h-9 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors duration-300"><Mail className="w-4 h-4" /></a>
              <a href="https://godisgracious1031ministriescom.odoo.com/" target="_blank" rel="noopener noreferrer" aria-label="Website" className="w-9 h-9 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors duration-300"><Globe className="w-4 h-4" /></a>
              <a href="https://youtube.com/@shawnr325av" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-9 h-9 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors duration-300"><Youtube className="w-4 h-4" /></a>
              <a href="https://www.tiktok.com/@svdbyfaithinr325av" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-9 h-9 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors duration-300"><Music2 className="w-4 h-4" /></a>
              <a href="https://www.instagram.com/svdbyfaithinhisbloodr325av/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors duration-300"><Instagram className="w-4 h-4" /></a>
              <a href="https://rumble.com/user/Godisgracious1031" target="_blank" rel="noopener noreferrer" aria-label="Rumble" className="w-9 h-9 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors duration-300"><PlayCircle className="w-4 h-4" /></a>
              <a href="https://discord.com/users/shawn_faithinhisbloodr325av" target="_blank" rel="noopener noreferrer" aria-label="Discord" className="w-9 h-9 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors duration-300"><MessageCircle className="w-4 h-4" /></a>
              <a href="https://linktr.ee/shawnr325av" target="_blank" rel="noopener noreferrer" aria-label="Linktree" className="w-9 h-9 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors duration-300"><Link2 className="w-4 h-4" /></a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-foreground/15 text-center">
          <p className="text-xs text-primary-foreground/60">© 2026 KJB Reader · Last updated: July 16th, 2026</p>
        </div>
      </div>
    </footer>
  );
}