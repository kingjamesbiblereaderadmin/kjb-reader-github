import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight, Quote, Check, BookOpen, Cross, Droplets, HandHeart, Sparkles, ChevronRight } from "lucide-react";

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

const gospelSteps = [
  {
    icon: BookOpen,
    title: "All have sinned",
    verse: "\u201cFor all have sinned, and come short of the glory of God.\u201d",
    ref: "Romans 3:23",
  },
  {
    icon: Cross,
    title: "The wages of sin is death",
    verse: "\u201cFor the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.\u201d",
    ref: "Romans 6:23",
  },
  {
    icon: Droplets,
    title: "Christ died for us",
    verse: "\u201cBut God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.\u201d",
    ref: "Romans 5:8",
  },
  {
    icon: HandHeart,
    title: "Believe and be saved",
    verse: "\u201cThat if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved.\u201d",
    ref: "Romans 10:9",
  },
];

function HeroSection() {
  return (
    <section className="relative pt-16 pb-10 sm:pt-20 sm:pb-12">
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-accent/15 rounded-full blur-[100px] pointer-events-none" style={{ animation: 'floatA 9s ease-in-out infinite' }} />
      <div className="absolute -bottom-16 -right-16 w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" style={{ animation: 'floatC 8s ease-in-out 2s infinite' }} />
      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}>
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Heart className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Merriweather', serif" }}>
            Are you <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-x">saved?</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Jesus Christ died, shed His blood, was buried, and rose again on the third day for our sins.
            Trust Christ's blood, death, burial and resurrection for your sins, and be eternally saved.
          </p>
          <div className="mt-6 w-16 h-1 bg-accent rounded-full mx-auto" />
        </motion.div>
      </div>
    </section>
  );
}

function VerseBanner() {
  return (
    <AnimatedElement className="max-w-2xl mx-auto px-6">
      <div className="relative rounded-2xl border border-border bg-card shadow-sm p-8 sm:p-10 text-center overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center mx-auto mb-5 shadow-md">
            <Quote className="w-5 h-5 text-primary-foreground" />
          </div>
          <blockquote className="text-lg sm:text-xl text-foreground leading-relaxed" style={{ fontFamily: "'Merriweather', serif" }}>
            "For Christ also hath once suffered for sins, the just for the unjust, that he might bring us to God."
          </blockquote>
          <p className="mt-4 text-sm text-muted-foreground tracking-wide">— 1 Peter 3:18</p>
        </div>
      </div>
    </AnimatedElement>
  );
}

function GospelStepsSection() {
  return (
    <AnimatedElement delay={80} className="max-w-2xl mx-auto px-6 mt-6">
      <div className="rounded-2xl border border-border bg-card shadow-sm p-7 sm:p-9">
        <h2 className="text-2xl font-bold text-foreground mb-2 text-center" style={{ fontFamily: "'Merriweather', serif" }}>
          The Good News
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-7">
          The Bible's message of salvation, in four simple truths.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {gospelSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <AnimatedElement key={step.title} delay={index * 100}>
                <div className="group h-full flex flex-col rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <p className="font-semibold text-foreground text-sm">{step.title}</p>
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed flex-1">{step.verse}</p>
                  <p className="mt-3 text-xs font-medium text-accent">{step.ref}</p>
                </div>
              </AnimatedElement>
            );
          })}
        </div>
      </div>
    </AnimatedElement>
  );
}

function PrayerSection() {
  return (
    <AnimatedElement delay={100} className="max-w-2xl mx-auto px-6 mt-6">
      <div className="relative rounded-2xl border border-border bg-primary text-primary-foreground shadow-md p-8 sm:p-10 text-center overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <Sparkles className="w-7 h-7 mx-auto mb-4 opacity-90" />
          <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ fontFamily: "'Merriweather', serif" }}>
            A Simple Prayer of Faith
          </h2>
          <p className="leading-relaxed opacity-90 max-w-md mx-auto">
            "Lord Jesus, I know I am a sinner. I believe You died on the cross, shed Your blood,
            were buried, and rose again on the third day for my sins. Right now, I trust You alone
            to save me. Thank You for Your gift of eternal life. Amen."
          </p>
          <p className="mt-5 text-sm opacity-80">
            Salvation is not in the words of a prayer, but in trusting the finished work of Christ —
            His blood, death, burial and resurrection — for your sins.
          </p>
        </div>
      </div>
    </AnimatedElement>
  );
}

function NextStepsSection() {
  const steps = [
    "Read your Bible daily — start with the Gospel of John.",
    "Find a Bible-believing church that preaches the King James Bible.",
    "Tell someone else about what Christ has done for you.",
    "Go deeper in God's Word at KJBI.org, a free online Bible institute.",
  ];
  return (
    <AnimatedElement delay={120} className="max-w-2xl mx-auto px-6 mt-6 mb-16">
      <div className="rounded-2xl border border-border bg-card shadow-sm p-7 sm:p-9">
        <h2 className="text-xl font-bold text-foreground mb-5 text-center" style={{ fontFamily: "'Merriweather', serif" }}>
          What's Next?
        </h2>
        <div className="flex flex-col gap-3 mb-7">
          {steps.map((s, i) => (
            <AnimatedElement key={s} delay={i * 80}>
              <div className="flex items-start gap-3 rounded-xl bg-secondary/40 p-4">
                <div className="shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center mt-0.5">
                  <Check className="w-3.5 h-3.5 text-accent-foreground" />
                </div>
                <p className="text-sm text-foreground/90">{s}</p>
              </div>
            </AnimatedElement>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="#" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="relative overflow-hidden w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-xl transition-all duration-300 gap-2 px-7">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent animate-[shimmer_3s_ease-in-out_infinite] bg-[length:200%_100%]" />
              <span className="relative z-10 flex items-center gap-2">Open KJB Reader <ArrowRight className="w-4 h-4" /></span>
            </Button>
          </a>
          <Link to="/">
            <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
              Back to Home <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </AnimatedElement>
  );
}

export default function Salvation() {
  return (
    <div className="bg-background">
      <HeroSection />
      <VerseBanner />
      <GospelStepsSection />
      <PrayerSection />
      <NextStepsSection />
    </div>
  );
}