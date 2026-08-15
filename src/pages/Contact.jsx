import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { Mail, Globe, Youtube, Music2, Instagram, PlayCircle, MessageCircle, Link2, ArrowRight, Send, Check, MessagesSquare } from "lucide-react";

const iconMap = { Mail, Globe, Youtube, Music2, Instagram, PlayCircle, MessageCircle, Link2 };

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
    <div ref={ref} className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className || ''}`}>
      {children}
    </div>
  );
};

function HeroSection() {
  return (
    <section className="relative pt-16 pb-10 sm:pt-20 sm:pb-12">
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent/15 rounded-full blur-[100px] pointer-events-none" style={{ animation: 'floatB 8s ease-in-out infinite' }} />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" style={{ animation: 'floatA 7s ease-in-out 1.5s infinite' }} />
      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}>
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Mail className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Merriweather', serif" }}>
            Get in <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-x">Touch</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Questions, feedback, or just want to say hello? Reach out through any channel below.
          </p>
          <div className="mt-6 w-16 h-1 bg-accent rounded-full mx-auto" />
        </motion.div>
      </div>
    </section>
  );
}

function ContactChannelsSection() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    base44.entities.ContactLink.list().then(setContacts).catch(() => {}).finally(() => setLoading(false));
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
    <AnimatedElement delay={80} className={`max-w-2xl mx-auto px-6 mt-6 ${loading ? 'opacity-0' : 'opacity-100'}`}>
      <div className="rounded-2xl border border-border bg-card shadow-sm p-7 sm:p-9">
        <h2 className="text-xl font-bold text-foreground mb-5" style={{ fontFamily: "'Merriweather', serif" }}>
          Every Channel
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((c, index) => {
            const Icon = iconMap[c.icon] || Globe;
            return (
              <AnimatedElement key={c.platform + index} delay={index * 70}>
                <a
                  href={c.url}
                  target={c.url.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 p-4"
                >
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{c.platform}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.handle}</p>
                  </div>
                </a>
              </AnimatedElement>
            );
          })}
        </div>
      </div>
    </AnimatedElement>
  );
}

function ContactFormSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <AnimatedElement delay={120} className="max-w-2xl mx-auto px-6 mt-6">
      <div className="relative rounded-2xl border border-border bg-card shadow-sm p-7 sm:p-9 overflow-hidden">
        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "'Merriweather', serif" }}>
            Send a Message
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Prefer a direct line? Drop a note and we'll get back to you by email.
          </p>

          {submitted ? (
            <div className="flex items-center gap-3 rounded-xl bg-accent/10 border border-accent/30 p-5">
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-accent-foreground" />
              </div>
              <p className="text-sm text-foreground/90">
                Thank you! Your message has been noted — please also feel free to email us directly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="name" className="text-foreground">Name</Label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} required className="mt-1.5 bg-background" placeholder="Your name" />
              </div>
              <div>
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required className="mt-1.5 bg-background" placeholder="you@example.com" />
              </div>
              <div>
                <Label htmlFor="message" className="text-foreground">Message</Label>
                <Textarea id="message" name="message" value={form.message} onChange={handleChange} required className="mt-1.5 bg-background min-h-[120px]" placeholder="How can we help?" />
              </div>
              <Button type="submit" size="lg" className="relative overflow-hidden self-start bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-xl transition-all duration-300 gap-2 px-7 mt-1">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent animate-[shimmer_3s_ease-in-out_infinite] bg-[length:200%_100%]" />
                <span className="relative z-10 flex items-center gap-2">Send Message <Send className="w-4 h-4" /></span>
              </Button>
            </form>
          )}
        </div>
      </div>
    </AnimatedElement>
  );
}

function CommunitySection() {
  return (
    <AnimatedElement delay={100} className="max-w-2xl mx-auto px-6 mt-6 mb-16">
      <div className="relative rounded-2xl border border-border bg-primary text-primary-foreground shadow-md p-8 sm:p-10 text-center overflow-hidden">
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <MessagesSquare className="w-8 h-8 mx-auto mb-4 opacity-90" />
          <h2 className="text-xl sm:text-2xl font-bold mb-3" style={{ fontFamily: "'Merriweather', serif" }}>
            Join the KJB Knights Community
          </h2>
          <p className="opacity-90 max-w-md mx-auto leading-relaxed">
            Come fellowship, ask questions, and grow in God's Word with others who love the King James Bible.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="https://discord.gg/HK9Kqmg7Jh" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                Join Discord Server <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <Link to="/">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AnimatedElement>
  );
}

export default function Contact() {
  return (
    <div className="bg-background">
      <HeroSection />
      <ContactChannelsSection />
      <ContactFormSection />
      <CommunitySection />
    </div>
  );
}