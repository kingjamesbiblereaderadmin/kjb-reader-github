import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Heart, GraduationCap, Globe, MessagesSquare, ShieldCheck, FileText, MonitorSmartphone, ArrowRight, ChevronRight, ChevronLeft, Download, Palette, Type, Image as ImageIcon, Bell, Quote, Smartphone, House, Mail, Youtube, Music2, Instagram, PlayCircle, MessageCircle, Link2, BookOpen } from "lucide-react";

const iconMap = {
  Heart, GraduationCap, Globe, MessagesSquare, ShieldCheck, FileText,
  MonitorSmartphone,
};

const contactIconMap = { Mail, Globe, Youtube, Music2, Instagram, PlayCircle, MessageCircle, Link2 };

const AnimatedElement = ({ children, className, delay = 0 }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) { setIsVisible(true); return; }
    const fallback = setTimeout(() => setIsVisible(true), 800 + delay);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { clearTimeout(fallback); setTimeout(() => setIsVisible(true), delay); observer.unobserve(el); }
    }, { threshold: 0.05, rootMargin: '0px 0px 200px 0px' });
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, [delay]);
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-[0.98]'} ${className || ''}`}>
      {children}
    </div>
  );
};

const LOGO_URL = "https://media.base44.com/images/public/6a05d76723afe58d80c589e8/2279e016e_8e738d108_cfb4bf781_Untitled.png";

function HeroSection() {
  return (
    <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-16">
      {/* Decorative Orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-[150%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" style={{ animation: 'floatA 10s ease-in-out infinite' }} />
      <div className="absolute top-20 right-1/2 translate-x-[150%] w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" style={{ animation: 'floatB 12s ease-in-out infinite reverse' }} />
      
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50" />
              <img src={LOGO_URL} alt="KJB Reader Logo" className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/40 object-cover transform group-hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1]" style={{ fontFamily: "'Merriweather', serif" }}>
            Welcome to <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x inline-block">KJB Reader</span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-muted-foreground font-medium max-w-xl mx-auto">
            Read the King James Bible — anytime, anywhere, even offline.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function VerseSection() {
  return (
    <AnimatedElement className="max-w-3xl mx-auto px-4 sm:px-6 mb-6">
      <div className="relative rounded-3xl border border-border/50 bg-card shadow-[0_2px_20px_rgb(0,0,0,0.02)] p-8 sm:p-12 text-center overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-[#4b3c7b] flex items-center justify-center mb-8 shadow-sm transform hover:scale-110 hover:rotate-3 transition-all duration-300">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <blockquote className="text-xl sm:text-2xl text-foreground leading-relaxed max-w-2xl" style={{ fontFamily: "'Merriweather', serif" }}>
            "Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth."
          </blockquote>
          <p className="mt-6 text-sm font-medium text-muted-foreground uppercase tracking-widest">— 2 Timothy 2:15</p>
        </div>
      </div>
    </AnimatedElement>
  );
}

function AboutCTASection() {
  return (
    <AnimatedElement delay={100} className="max-w-3xl mx-auto px-4 sm:px-6 mb-6">
      <div className="rounded-3xl border border-border/50 bg-card shadow-[0_2px_20px_rgb(0,0,0,0.02)] p-8 sm:p-10 text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500">
        <p className="text-foreground/80 leading-relaxed text-base sm:text-lg max-w-2xl mx-auto">
          KJB Reader is a free, installable Bible reading app featuring the King James Bible (Pure Cambridge Edition).
          Enjoy daily verses, offline reading, search, bookmarks, and customizable typography — all with privacy at the forefront.
        </p>
        <div className="mt-8 flex justify-center">
          <a href="#" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="h-14 rounded-2xl relative overflow-hidden bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 gap-3 px-8 text-base font-semibold group">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent animate-[shimmer_2s_ease-in-out_infinite] bg-[length:200%_100%]" />
              <span className="relative z-10 flex items-center gap-2">Open KJB Reader <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
            </Button>
          </a>
        </div>
      </div>
    </AnimatedElement>
  );
}

function ResourceGrid() {
  const [links, setLinks] = useState([]);
  useEffect(() => {
    base44.entities.ResourceLink.list().then(setLinks).catch(() => {}).finally(() => {});
  }, []);

  const staticFallback = [
    { title: "Are you saved?", description: "Jesus Christ died, shed his blood, was buried, and rose again on the third day for our sins. Trust Christ's blood, death, burial and resurrection for your sins, and be eternally saved.", url: "/Salvation", icon: "Heart", external: false, category: "primary", badge: "", colorClass: "text-[#e15b64] bg-[#e15b64]/10" },
    { title: "KJBI.org — Free Online Bible College", description: "King James Bible Institute by Robert Breaker & Robert Potthoff — go deeper in God's Word, for free.", url: "https://kjbi.org/", icon: "GraduationCap", external: true, category: "primary", badge: "", colorClass: "text-[#8a2be2] bg-[#8a2be2]/10" },
    { title: "KJB Reader - SidePanel", description: "Read, search, and look up Bible verses from any web page. Desktop browsers only.", url: "https://kingjamesbiblereader.com/extension", icon: "Globe", external: true, category: "primary", badge: "Available Now!", colorClass: "text-[#0088cc] bg-[#0088cc]/10" },
  ];
  const items = (links.length > 0 ? links : staticFallback).filter((l) => l.category !== "legal");
  const fallbackDiscordLink = { title: "KJB Knights Server", description: "My and my friends' Discord server — come join us.", url: "https://discord.gg/HK9Kqmg7Jh", icon: "MessagesSquare", external: true, category: "primary", colorClass: "text-[#5865F2] bg-[#5865F2]/10" };

  const CardInner = ({ item }) => {
    const Icon = iconMap[item.icon] || Heart;
    return (
      <div className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-3xl border border-border/50 bg-card shadow-[0_2px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 p-6 h-full cursor-pointer relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 ${item.colorClass || 'bg-primary/10 text-primary'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <p className="font-semibold text-foreground flex items-center flex-wrap gap-2 text-base">
            {item.title}
            {item.badge && <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent border border-accent/20 whitespace-nowrap">{item.badge}</span>}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-3 sm:line-clamp-none">{item.description}</p>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2">
           <ArrowRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {items.map((item, index) => {
          const isInternal = item.url && item.url.startsWith("/");
          return (
            <AnimatedElement key={item.title} delay={150 + index * 100} className={items.length === 3 && index === 2 ? "md:col-span-1" : ""}>
              {isInternal ? (
                <Link to={item.url} className="block h-full"><CardInner item={item} /></Link>
              ) : (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="block h-full"><CardInner item={item} /></a>
              )}
            </AnimatedElement>
          );
        })}
        {/* We place DiscordBotSection in the grid if there's space, else it flows natural */}
        <div className="md:col-span-1">
          <DiscordBotCard />
        </div>
        <AnimatedElement delay={450} className="md:col-span-2">
            <a href={fallbackDiscordLink.url} target="_blank" rel="noopener noreferrer" className="block h-full">
                <CardInner item={fallbackDiscordLink} />
            </a>
        </AnimatedElement>
      </div>
    </div>
  );
}

function DiscordBotCard() {
  return (
    <AnimatedElement delay={350} className="h-full">
      <div className="rounded-3xl border border-border/50 bg-card shadow-[0_2px_20px_rgb(0,0,0,0.02)] p-6 h-full flex flex-col hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-all duration-500">
        <div className="flex items-center gap-4 mb-5">
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-[#5865F2]/10 flex items-center justify-center shadow-sm">
            <MessagesSquare className="w-5 h-5 text-[#5865F2]" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-base">KJB Discord Bot</p>
            <p className="text-xs text-muted-foreground mt-0.5">Add the KJB Reader bot to your Discord.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 mt-auto">
          <a
            href="https://discord.com/oauth2/authorize?client_id=1529303667348606996&scope=applications.commands&integration_type=1"
            target="_blank" rel="noopener noreferrer"
            className="group rounded-2xl border border-border/50 bg-secondary/30 hover:bg-secondary/80 hover:border-border transition-all duration-300 p-4 text-center flex flex-col items-center justify-center relative overflow-hidden"
          >
            <p className="flex items-center justify-center gap-2 font-semibold text-foreground text-sm group-hover:text-primary transition-colors"><Smartphone className="w-4 h-4" /> Personal Install</p>
            <p className="mt-1.5 text-[11px] text-muted-foreground leading-tight">Slash commands for your account — DMs, any server.</p>
          </a>
          <a
            href="https://discord.com/oauth2/authorize?client_id=1529303667348606996&scope=bot+applications.commands&permissions=378494381072"
            target="_blank" rel="noopener noreferrer"
            className="group rounded-2xl border border-border/50 bg-secondary/30 hover:bg-secondary/80 hover:border-border transition-all duration-300 p-4 text-center flex flex-col items-center justify-center"
          >
            <p className="flex items-center justify-center gap-2 font-semibold text-foreground text-sm group-hover:text-primary transition-colors"><House className="w-4 h-4" /> Server Install</p>
            <p className="mt-1.5 text-[11px] text-muted-foreground leading-tight">Bot joins a server for daily verse delivery.</p>
          </a>
        </div>
      </div>
    </AnimatedElement>
  );
}

const wizardSteps = [
  { label: "Install", icon: Download, title: "Install the App", desc: "Get offline access and faster loading" },
  { label: "Theme", icon: Palette, title: "Choose a Theme", desc: "Pick light, dark, or classic parchment tones" },
  { label: "Fonts", icon: Type, title: "Select Your Font", desc: "Customize typography for comfortable reading" },
  { label: "Background", icon: ImageIcon, title: "Set a Background", desc: "Personalize your reading background" },
  { label: "Notifications", icon: Bell, title: "Enable Notifications", desc: "Get a daily verse reminder" },
];

function InstallWizardSection() {
  const [step, setStep] = useState(0);
  const current = wizardSteps[step];
  const Icon = current.icon;

  return (
    <AnimatedElement delay={500} className="max-w-3xl mx-auto px-4 sm:px-6 mb-6">
      <div className="rounded-3xl border border-border/50 bg-card shadow-[0_2px_20px_rgb(0,0,0,0.02)] p-8 sm:p-12 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500">
        
        {/* Stepper */}
        <div className="relative flex items-center justify-between mb-12 max-w-xl mx-auto">
          <div className="absolute top-5 left-0 w-full h-[2px] bg-secondary -z-10 rounded-full" />
          <div className="absolute top-5 left-0 h-[2px] bg-primary -z-10 rounded-full transition-all duration-500 ease-out" style={{ width: `${(step / (wizardSteps.length - 1)) * 100}%` }} />
          
          {wizardSteps.map((s, i) => {
            const SIcon = s.icon;
            const active = i === step;
            const past = i < step;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => setStep(i)}
                className="flex flex-col items-center gap-2 bg-card px-2 group"
              >
                <span className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm border-[3px] border-card ${active ? "bg-primary text-primary-foreground scale-110" : past ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground group-hover:bg-secondary/80"}`}>
                  <SIcon className="w-4 h-4" />
                </span>
                <span className={`text-[10px] sm:text-xs tracking-wide uppercase font-semibold transition-colors duration-300 ${active ? "text-primary" : "text-muted-foreground"}`}>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="text-center min-h-[220px] flex flex-col justify-center items-center">
          <motion.div 
            key={step} 
            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-sm border border-primary/10">
              <Icon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground tracking-tight" style={{ fontFamily: "'Merriweather', serif" }}>{current.title}</h3>
            <p className="mt-3 text-base text-muted-foreground max-w-md mx-auto leading-relaxed">{current.desc}</p>

            {step === 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 w-full max-w-md">
                <div className="rounded-2xl border border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50 p-4 sm:p-5 text-left shadow-sm">
                  <p className="text-sm text-amber-900 dark:text-amber-200/90 leading-relaxed font-medium">
                    You're in a private window. App install and notifications won't work, and settings will be erased when you close this window.
                  </p>
                </div>
                <p className="mt-5 text-sm font-medium text-muted-foreground">You can install the app later from Settings.</p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-end">
          <Button
            size="lg"
            className="gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-xl px-8 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            onClick={() => setStep((s) => Math.min(wizardSteps.length - 1, s + 1))}
            disabled={step === wizardSteps.length - 1}
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </AnimatedElement>
  );
}

function LegalGrid() {
  const [links, setLinks] = useState([]);
  useEffect(() => {
    base44.entities.ResourceLink.list().then(setLinks).catch(() => {});
  }, []);
  const staticFallback = [
    { title: "Privacy Policy", description: "How your data is handled", url: "#", icon: "ShieldCheck", category: "legal", color: "text-purple-500 bg-purple-500/10" },
    { title: "Terms of Service", description: "Rules for using this app", url: "#", icon: "FileText", category: "legal", color: "text-green-500 bg-green-500/10" },
    { title: "Legacy Reader", description: "For old browsers (IE 11)", url: "#", icon: "MonitorSmartphone", category: "legal", color: "text-slate-500 bg-slate-500/10" },
  ];
  const all = links.length > 0 ? links : staticFallback;
  const items = all.filter((l) => l.category === "legal");

  return (
    <AnimatedElement delay={600} className="max-w-3xl mx-auto px-4 sm:px-6 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((item, index) => {
          const Icon = iconMap[item.icon] || FileText;
          return (
            <AnimatedElement key={item.title} delay={index * 100}>
              <a href={item.url} className="group flex flex-col items-start gap-4 rounded-3xl border border-border/50 bg-card shadow-[0_2px_15px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-400 p-6 h-full relative overflow-hidden">
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ${item.color || 'bg-secondary text-foreground'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground mb-1">{item.title}</p>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
                <div className="absolute right-5 bottom-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </a>
            </AnimatedElement>
          );
        })}
      </div>
    </AnimatedElement>
  );
}

function ContactSection() {
  const [contacts, setContacts] = useState([]);
  useEffect(() => {
    base44.entities.ContactLink.list().then(setContacts).catch(() => {});
  }, []);
  const staticFallback = [
    { platform: "Email", handle: "kingjamesbiblereader@outlook.sg", url: "mailto:kingjamesbiblereader@outlook.sg", icon: "Mail" },
    { platform: "Website", handle: "godisgracious1031ministries.com", url: "https://godisgracious1031ministriescom.odoo.com/", icon: "Globe" },
    { platform: "YouTube", handle: "@shawnr325av", url: "https://youtube.com/@shawnr325av", icon: "Youtube" },
    { platform: "TikTok", handle: "@svdbyfaithinr325av", url: "https://www.tiktok.com/@svdbyfaithinr325av", icon: "Music2" },
    { platform: "Instagram", handle: "@svdbyfaithinhisbloodr325av", url: "https://www.instagram.com/svdbyfaithinhisbloodr325av/", icon: "Instagram" },
    { platform: "Rumble", handle: "Godisgracious1031", url: "https://rumble.com/user/Godisgracious1031", icon: "PlayCircle" },
    { platform: "Discord", handle: "shawn_faithinhisbloodr325av", url: "https://discord.com/users/shawn_faithinhisbloodr325av", icon: "MessageCircle" },
    { platform: "Linktree", handle: "linktr.ee/shawnr325av", url: "https://linktr.ee/shawnr325av", icon: "Link2" },
  ];
  const items = contacts.length > 0 ? contacts : staticFallback;

  return (
    <AnimatedElement delay={700} className="max-w-3xl mx-auto px-4 sm:px-6 mt-6 mb-24">
      <div className="rounded-3xl border border-border/50 bg-card shadow-[0_2px_20px_rgb(0,0,0,0.02)] p-8 sm:p-10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500">
        <h2 className="text-2xl font-bold text-foreground mb-6" style={{ fontFamily: "'Merriweather', serif" }}>Contact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
          {items.map((c, index) => {
            const Icon = contactIconMap[c.icon] || Globe;
            return (
              <AnimatedElement key={c.platform + index} delay={index * 50}>
                <a href={c.url} target={c.url.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className="group flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-secondary/50 transition-all duration-300">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-background group-hover:shadow-sm transition-all duration-300 shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors duration-300 truncate">{c.handle}</span>
                </a>
              </AnimatedElement>
            );
          })}
        </div>
      </div>
    </AnimatedElement>
  );
}

export default function Home() {
  return (
    <div className="bg-[#fcfcfd] dark:bg-background min-h-screen selection:bg-primary/20">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatA { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-20px) scale(1.05); } }
        @keyframes floatB { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-30px) scale(0.95); } }
        @keyframes shimmer { 100% { background-position: -200% 0; } }
      `}} />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="relative z-10">
        <HeroSection />
        <VerseSection />
        <AboutCTASection />
        <ResourceGrid />
        <InstallWizardSection />
        <LegalGrid />
        <ContactSection />
      </div>
    </div>
  );
}