import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Rocket, TrendingUp, Users, Lightbulb, Shield, MessageSquare,
  BarChart3, Zap, UserPlus, Search, Handshake, PiggyBank,
  ChevronDown, ArrowRight, Building2, GraduationCap, Briefcase,
  CircleDollarSign, Lock, Bell, FileText, Eye, Quote,
  CheckCircle2, Globe, Sparkles, Menu, X, ChevronRight
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Hero3D from "@/components/Hero3D";
import Logo from "@/components/ui/Logo";

import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ============================================================================
// SCROLL ANIMATION HOOK
// ============================================================================
const useScrollReveal = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [threshold]);

  return { ref, isVisible };
};

// Simple Typewriter that types lines made of styled segments (keeps markup for highlighted words)
const Typewriter = ({
  lines,
  typingSpeed = 40,
  lineDelay = 600,
}: {
  lines: Array<Array<{ text: string; className?: string; trailing?: React.ReactNode }>>;
  typingSpeed?: number;
  lineDelay?: number;
}) => {
  const [lineIdx, setLineIdx] = useState(0);
  const [segIdx, setSegIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [finished, setFinished] = useState(false);
  const reduce = false;

  useEffect(() => {
    if (finished) return;
    const currentLine = lines[lineIdx];
    const currentSeg = currentLine[segIdx];
    const tick = () => {
      if (charIdx < currentSeg.text.length) {
        setCharIdx(c => c + 1);
        return;
      }
      // segment done
      if (segIdx < currentLine.length - 1) {
        setSegIdx(s => s + 1);
        setCharIdx(0);
        return;
      }
      // line done
      if (lineIdx < lines.length - 1) {
        setTimeout(() => {
          setLineIdx(l => l + 1);
          setSegIdx(0);
          setCharIdx(0);
        }, lineDelay);
        return;
      }
      setFinished(true);
    };

    const timer = setTimeout(tick, reduce ? 1 : typingSpeed);
    return () => clearTimeout(timer);
  }, [charIdx, segIdx, lineIdx, finished, lines, typingSpeed, lineDelay]);

  return (
    <>
      {lines.map((segments, li) => (
        <span key={li} className="block leading-[0.95] reveal-item">
          {segments.map((seg, si) => {
            let textToShow = "";
            if (li < lineIdx) textToShow = seg.text;
            else if (li === lineIdx) {
              if (si < segIdx) textToShow = seg.text;
              else if (si === segIdx) textToShow = seg.text.slice(0, charIdx);
            }
            const showCursor = li === lineIdx && si === segIdx && !finished;
            return (
              <span key={si} className={seg.className || undefined}>
                {textToShow}
                {showCursor && <span className="inline-block w-1 h-6 align-middle bg-brand-yellow ml-2 animate-pulse" />}
                {si === segments.length - 1 && seg.trailing}
              </span>
            );
          })}
        </span>
      ))}
    </>
  );
};

// ============================================================================
// PROFESSIONAL ANIMATED COUNTER - Elegant Design
// ============================================================================
const AnimatedCounter3D = ({ target, label, icon: Icon, suffix = "+" }: {
  target: number; label: string; icon: any; suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollReveal(0.3);

  useEffect(() => {
    if (!isVisible) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(current);
    }, 40);
    return () => clearInterval(timer);
  }, [isVisible, target]);

  useEffect(() => {
    if (isVisible && ref.current) {
      gsap.from(ref.current, {
        opacity: 0,
        y: 30,
        duration: 0.6,
        ease: "power2.out"
      });
    }
  }, [isVisible]);

  return (
    <div
      ref={ref}
      className="text-center"
    >
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 bg-brand-yellow/15">
        <Icon className="w-7 h-7 text-brand-yellow" strokeWidth={1.5} />
      </div>
      <div className="text-4xl md:text-5xl font-bold mb-2 text-brand-yellow">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm font-medium tracking-wide uppercase text-muted-foreground">
        {label}
      </div>
    </div>
  );
};

// ============================================================================
// PROFESSIONAL STEP CARD - Elegant Minimal Design
// ============================================================================
const StepCard3D = ({ step, icon: Icon, title, description, delay }: {
  step: number; icon: any; title: string; description: string; delay: number;
}) => {
  const { ref, isVisible } = useScrollReveal();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative text-center group"
    >
      {/* Subtle connection line */}
      <div className="hidden md:block absolute top-10 left-1/2 w-full h-[1px] -translate-x-1/2 opacity-30 bg-gradient-to-r from-transparent via-brand-yellow to-transparent"
      />

      {/* Icon Container - Professional & Subtle */}
      <div
        className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 mx-auto bg-brand-yellow shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 hover:scale-105"
      >
        <Icon className="w-8 h-8 text-brand-charcoal" strokeWidth={1.5} />

        {/* Step number badge - Minimal */}
        <div
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-brand-yellow bg-brand-charcoal shadow-md"
        >
          {step}
        </div>
      </div>

      {/* Content - Clean & Professional */}
      <div>
        <h3 className="text-lg font-semibold mb-2 tracking-tight text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed max-w-[240px] mx-auto text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

// ============================================================================
// FEATURE ITEM
// ============================================================================
const FeatureItem = ({ icon: Icon, title, description, variant = "light" }: {
  icon: any; title: string; description: string; variant?: "light" | "dark";
}) => (
  <div className="flex items-start gap-4 group">
    <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 bg-primary text-brand-charcoal`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <h4 className={`font-semibold text-lg mb-1 ${variant === 'dark' ? 'text-white' : 'text-foreground'}`}>
        {title}
      </h4>
      <p className={`text-sm leading-relaxed ${variant === 'dark' ? 'text-slate-300' : 'text-muted-foreground'}`}>
        {description}
      </p>
    </div>
  </div>
);

// ============================================================================
// PROFESSIONAL PLATFORM FEATURE CARD - Elegant Minimal Design
// ============================================================================
const PlatformCard3D = ({ icon: Icon, title, description, delay }: {
  icon: any; title: string; description: string; delay: number;
}) => {
  const { ref, isVisible } = useScrollReveal();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      <Card
        interactive
        className="relative p-7 transition-all duration-300"
        style={{
          borderColor: isHovered ? 'hsl(48, 97%, 47%, 0.2)' : 'rgba(0,0,0,0.06)',
          boxShadow: isHovered
            ? '0 20px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px hsl(48, 97%, 47%, 0.1)'
            : '0 2px 8px rgba(0, 0, 0, 0.04)',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)'
        }}
      >
        {/* Icon - Clean & Simple */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300"
          style={{
            background: isHovered ? 'hsl(48, 97%, 47%)' : 'hsl(48, 97%, 47%, 0.15)',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          <Icon className={`w-6 h-6 transition-colors ${isHovered ? 'text-brand-charcoal' : 'text-brand-yellow'}`} strokeWidth={1.5} />

          {/* Subtle bottom accent line */}
          <div
            className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-brand-yellow transition-all duration-300"
            style={{
              transform: isHovered ? 'scaleX(1)' : 'scaleX(0)',
              opacity: isHovered ? 1 : 0
            }}
          />
        </div>

        {/* Content */}
        <div className="pt-3">
          <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
          <p className="text-sm leading-relaxed text-slate-300">{description}</p>
        </div>

      </Card>
    </div>
  );
};

// ============================================================================
// PROFESSIONAL TESTIMONIAL CARD - Elegant Design
// ============================================================================
const TestimonialCard3D = ({ name, role, content, delay }: {
  name: string; role: string; content: string; delay: number;
}) => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className="relative group"
    >
      <div
        className="relative p-8 rounded-2xl border bg-brand-charcoal/50 border-white/8 shadow-xl"
      >
        {/* Quote icon */}
        <Quote className="w-8 h-8 mb-4 text-brand-yellow" strokeWidth={1.5} />

        {/* Content */}
        <p className="text-slate-300 leading-relaxed mb-6 text-sm">
          &ldquo;{content}&rdquo;
        </p>

        {/* Author */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-brand-charcoal text-sm font-semibold bg-brand-yellow"
          >
            {name.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-white text-sm">{name}</div>
            <div className="text-xs text-slate-400">{role}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// FAQ ITEM
// ============================================================================
const FAQItem = ({ question, answer, isOpen, onClick }: {
  question: string; answer: string; isOpen: boolean; onClick: () => void;
}) => (
  <div
    className="border-b border-border transition-colors"
  >
    <button
      onClick={onClick}
      className="flex justify-between items-center w-full py-6 text-left group"
    >
      <span className="text-lg font-medium pr-4 text-white">{question}</span>
      <ChevronDown
        className={`w-5 h-5 shrink-0 transition-transform duration-300 text-brand-yellow ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6' : 'max-h-0'}`}>
      <p className="leading-relaxed text-slate-300">{answer}</p>
    </div>
  </div>
);

const Landing = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // GSAP ScrollReveal & header smooth-with-pull behavior
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      // reveal items
      gsap.utils.toArray<HTMLElement>('.reveal-on-scroll').forEach((el) => {
        const direction = el.dataset.direction || 'y';
        const x = el.dataset.x ? Number(el.dataset.x) : (direction === 'left' ? -60 : (direction === 'right' ? 60 : 0));
        const y = direction === 'y' ? 40 : 0;

        const childTargets = Array.from(el.querySelectorAll<HTMLElement>('.reveal-item'));
        const targets: HTMLElement[] = childTargets.length > 0 ? childTargets : [el];

        gsap.fromTo(
          targets,
          { x, y, autoAlpha: 0, filter: 'blur(6px)' },
          {
            x: 0,
            y: 0,
            autoAlpha: 1,
            filter: 'blur(0px)',
            stagger: 0.08,
            duration: 1.05,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              end: 'top 30%',
              scrub: 0.5
            }
          }
        );
      });

      // subtle parallax / pull for hero background and CTA
      gsap.utils.toArray<HTMLElement>('.parallax').forEach(el => {
        gsap.to(el, {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: { trigger: el, scrub: 0.6 }
        });
      });

      // ambient motion: make page feel alive continuously
      gsap.utils.toArray<HTMLElement>('.alive-float').forEach((el, index) => {
        gsap.to(el, {
          y: -10,
          duration: 2.6 + (index % 3) * 0.35,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      });

      gsap.utils.toArray<HTMLElement>('.alive-float-slow').forEach((el, index) => {
        gsap.to(el, {
          y: -6,
          duration: 3.8 + (index % 2) * 0.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      });

      gsap.utils.toArray<HTMLElement>('.alive-glow').forEach((el) => {
        gsap.to(el, {
          boxShadow: '0 0 30px rgba(239,191,4,0.35)',
          duration: 1.8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      });
    });

    ScrollTrigger.refresh();

    // header nav smooth scroll + pull animation after arrival
    const navLinks = document.querySelectorAll('a[href^="#"]');
    const onNavClick = (e: Event) => {
      const a = e.currentTarget as HTMLAnchorElement;
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        gsap.fromTo(target, { y: 24 }, { y: 0, duration: 0.8, ease: 'power3.out' });
      }, 450);
    };
    navLinks.forEach(l => l.addEventListener('click', onNavClick));

    return () => {
      navLinks.forEach(l => l.removeEventListener('click', onNavClick));
      ctx.revert();
    };
  }, []);

  const colleges = [
    "Andhra University", "GODAVARI GLOBAL UNIVERSITY", "JNTU Kakinada", "JNTU Anantapur",
    "SV University", "Acharya Nagarjuna University", "GITAM University", "K L University",
    "Vignan University", "SRKR Engineering College", "Gayatri Vidya Parishad (GVP)", "RVR & JC",
    "MVGR", "GMRIT", "Vishnu Institute of Technology", "Aditya Engineering College",
    "Pragati Engineering College", "VR Siddhartha", "NRI Institute of Technology",
    "SRIT", "NBKR", "Sree Vidyanikethan", "MITS Madanapalle", "RGMCET",
    "Eswar", "Vignan's VIIT", "Raghu Engineering College", "Lendi Institute",
    "QIS", "Pace", "Rise Krishna Sai", "Bapatla Engineering College", "LBRCE"
  ];

  const faqs = [
    {
      q: "What is INNOVESTOR?",
      a: "INNOVESTOR is a platform that bridges the gap between visionary founders and strategic investors. Founders can showcase their ideas, and investors can discover and invest in promising ventures Ã¢â‚¬â€ all through a secure, direct-connection platform."
    },
    {
      q: "How does the investment process work?",
      a: "Once an investor finds an idea they're interested in, they send a connection request. If the founder accepts, a private DealCenter opens where both parties can chat, negotiate terms, and finalize investments through secure UPI payment integration."
    },
    {
      q: "Is my idea safe on the platform?",
      a: "Absolutely. All ideas go through an admin approval process before being listed. Communication is encrypted, and we use Row Level Security (RLS) to ensure only authorized users can access specific data."
    },
    {
      q: "Who can join INNOVESTOR?",
      a: "INNOVESTOR is open to students, working professionals, and anyone with a viable business idea (as a Founder) or capital to invest (as an Investor). Each registration is verified by our admin team before approval."
    },
    {
      q: "What does it cost to use INNOVESTOR?",
      a: "Creating an account and browsing ideas is free. We believe in removing barriers between great ideas and the capital they need. Specific investment terms are negotiated directly between founders and investors."
    },
    {
      q: "How do I track my investments?",
      a: "Both founders and investors have dedicated dashboards with real-time analytics, transaction history, profit share tracking, and portfolio performance charts. You'll also receive notifications for every important update."
    },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ================================================================ */}
      {/* NAVBAR - Light theme header */}
      {/* ================================================================ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navScrolled ? 'bg-white/95 shadow-md' : 'bg-white/80'}`}
        style={{ backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <Link to="/">
            <Logo showText />
          </Link>

          {/* Center Nav */}
          <nav className="hidden lg:flex items-center gap-1 px-3 py-2 rounded-full bg-gray-100/80">
            {[
              { label: 'How it works', href: '#how-it-works' },
              { label: 'Features', href: '#features' },
              { label: 'For Founders', href: '#for-founders' },
              { label: 'For Investors', href: '#for-investors' },
              { label: 'FAQ', href: '#faq' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:bg-white/60 text-gray-600 hover:text-brand-yellow"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link to="/auth?mode=login" className="hidden sm:block">
              <Button variant="ghost" className="text-sm font-medium rounded-full px-5 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                Login
              </Button>
            </Link>
            <Link to="/auth?mode=register" className="hidden sm:block">
              <Button className="text-sm font-medium px-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-brand-charcoal hover:bg-brand-charcoal/90 border-0 rounded-md">
                Join for free
              </Button>
            </Link>
            {/* Mobile Hamburger */}
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-gray-900" /> : <Menu className="w-6 h-6 text-gray-900" />}
            </button>
          </div>
        </div>
        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 px-6 py-4 space-y-2 bg-white/95 backdrop-blur-lg">
            {[
              { label: 'How it works', href: '#how-it-works' },
              { label: 'Features', href: '#features' },
              { label: 'For Founders', href: '#for-founders' },
              { label: 'For Investors', href: '#for-investors' },
              { label: 'FAQ', href: '#faq' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              >
                {item.label}
              </a>
            ))}
            <div className="flex gap-3 pt-3 border-t border-gray-200 sm:hidden">
              <Link to="/auth?mode=login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full text-sm font-medium rounded-full text-gray-600 border-gray-300 hover:bg-gray-100">
                  Login
                </Button>
              </Link>
              <Link to="/auth?mode=register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full text-sm font-medium text-white bg-brand-charcoal hover:bg-brand-charcoal/90 border-0 rounded-md">
                  Join for free
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ================================================================ */}
      {/* 3D HERO SECTION */}
      {/* ================================================================ */}
      <Hero3D>
        <div className="max-w-6xl mx-auto px-6 pt-32 pb-20 text-center">
          {/* Badge with glassmorphism */}
          <div
            ref={(el) => {
              if (el) {
                gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.2 });
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8 text-sm font-medium border backdrop-blur-md border-brand-yellow/40 bg-brand-yellow/15 text-brand-yellow shadow-lg shadow-brand-yellow/20 alive-float-slow alive-glow"
          >
            <Sparkles className="w-4 h-4" />
            Where Innovation Meets Investment
          </div>

          {/* Headline with 3D text effect */}
          <h1
            className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.05]"
            style={{
              textShadow: '0 0 60px rgba(239, 191, 4, 0.3)'
            }}
          >
            <Typewriter
              typingSpeed={30}
              lineDelay={600}
              lines={[
                [
                  { text: 'Connect. ', className: 'text-white' },
                  { text: 'Invest.', className: 'text-brand-yellow', },
                ],
                [
                  { text: 'Build the ', className: 'text-white' },
                  {
                    text: 'future.', className: 'relative inline-block text-brand-yellow', trailing: (
                      <svg
                        className="absolute -bottom-2 left-0 w-full"
                        viewBox="0 0 200 8"
                        fill="none"
                      >
                        <path
                          d="M1 5.5Q50 1 100 5T199 3"
                          stroke="#EFBF04"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    )
                  },
                ]
              ]}
            />
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed text-muted-foreground"
          >
            INNOVESTOR bridges the gap between visionary founders and strategic investors.
            Showcase your ideas, discover opportunities, and make deals - all in one platform.
          </p>

          {/* CTAs with enhanced hover effects */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link to="/auth?mode=register">
              <div className="alive-float"
              >
                <Button
                  className="text-base font-semibold rounded-full px-10 py-6 text-brand-charcoal bg-brand-yellow hover:scale-105 transition-all duration-300 shadow-xl shadow-brand-yellow/30"
                >
                  Get Started - It's Free
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </Link>
            <a href="#how-it-works">
              <div className="alive-float-slow"
              >
                <Button
                  variant="outline"
                  className="bg-transparent/10 backdrop-blur-sm text-base font-medium rounded-full px-10 py-6 transition-all duration-300 hover:bg-white/10"
                  style={{
                    borderColor: 'rgba(255,255,255,0.2)',
                    color: '#CBD5E1',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                >
                  See how it works
                </Button>
              </div>
            </a>
          </div>

          {/* Trust Indicators with glass effect */}
          <div
            className="flex flex-wrap items-center justify-center gap-6 text-sm"
          >
            {[
              { icon: Shield, text: "Secure & Encrypted" },
              { icon: CheckCircle2, text: "Admin Verified Users" },
              { icon: Globe, text: "100+ Colleges Connected" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-300 text-muted-foreground alive-float-slow"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <item.icon className="w-4 h-4 text-brand-yellow" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>


        </div>
      </Hero3D>

      {/* ================================================================ */}
      {/* HOW IT WORKS */}
      {/* ================================================================ */}
      <section id="how-it-works" className="py-28 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <span className="inline-block text-sm font-semibold tracking-widest uppercase mb-4 text-brand-yellow">
              How It Works
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              From idea to investment<br />in four simple steps
            </h2>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-4 gap-12 relative">
            {/* Connector Line (desktop only) */}
            <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-brand-yellow/40 to-transparent" />

            <div className="reveal-on-scroll reveal-item" data-direction="left">
              <StepCard3D step={1} icon={UserPlus} title="Create Your Account" description="Sign up as a Founder or Investor. Complete your profile and get verified by our admin team." delay={0} />
            </div>
            <div className="reveal-on-scroll reveal-item" data-direction="right">
              <StepCard3D step={2} icon={Lightbulb} title="Submit or Browse Ideas" description="Founders showcase their ventures. Investors browse a curated marketplace of vetted opportunities." delay={150} />
            </div>
            <div className="reveal-on-scroll reveal-item" data-direction="left">
              <StepCard3D step={3} icon={Handshake} title="Connect & Negotiate" description="Send connection requests, chat securely in our DealCenter, and negotiate terms directly." delay={300} />
            </div>
            <div className="reveal-on-scroll reveal-item" data-direction="right">
              <StepCard3D step={4} icon={TrendingUp} title="Invest & Grow" description="Finalize investments via secure UPI payments. Track performance with real-time analytics." delay={450} />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FOR FOUNDERS */}
      {/* ================================================================ */}
      <section id="for-founders" className="py-28 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
              <span className="inline-block text-sm font-semibold tracking-widest uppercase mb-4 text-brand-yellow">
                For Founders
              </span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight text-white">
                Turn your vision<br />into <span className="text-brand-yellow">reality</span>
              </h2>
              <p className="text-lg mb-10 leading-relaxed text-muted-foreground">
                Stop cold-emailing investors. INNOVESTOR puts your ideas directly in front of verified
                investors who are actively looking for opportunities like yours.
              </p>

              <div className="space-y-6">
                <FeatureItem variant="dark" icon={Lightbulb} title="Showcase Your Ideas" description="Submit detailed venture profiles with media, domain categories, and investment requirements." />
                <FeatureItem variant="dark" icon={MessageSquare} title="Direct Communication" description="Chat securely with interested investors through our encrypted DealCenter." />
                <FeatureItem variant="dark" icon={BarChart3} title="Track Everything" description="Real-time dashboards for investment tracking, profit sharing, and portfolio analytics." />
                <FeatureItem variant="dark" icon={Bell} title="Stay Updated" description="Get instant notifications when investors show interest or when deals progress." />
              </div>
            </div>

            {/* Right Visual - Professional Dashboard Preview */}
            <div className="relative">
              <Card className="p-6 bg-white border reveal-on-scroll reveal-item alive-float-slow" style={{ borderColor: 'rgba(0,0,0,0.06)', boxShadow: '0 20px 50px rgba(0,0,0,0.08)' }}>

                {/* Main Stat Card */}
                <div className="flex items-center justify-between p-5 rounded-xl bg-slate-50 mb-4 border border-brand-yellow">
                  <div>
                    <div className="text-sm font-medium text-slate-500 card-title">Total Investment</div>
                    <div className="text-2xl font-bold text-slate-900">12,50,000</div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-600" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Active Ventures', value: '4' },
                    { label: 'Investors', value: '12' }
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-slate-50 border border-brand-yellow"
                    >
                      <div className="text-sm text-slate-500">{item.label}</div>
                      <div className="text-xl font-bold text-slate-900">{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Activity List */}
                <div className="p-4 rounded-xl bg-slate-50 border border-brand-yellow">
                  <div className="text-sm font-medium text-slate-500 mb-3">Recent Activity</div>
                  {[
                    { text: 'Investment request from Arjun K.', time: '2m ago', color: '#10B981' },
                    { text: 'Profit share 25,000', time: '1h ago', color: '#EFBF04' },
                    { text: 'Idea approved by admin', time: '3h ago', color: '#F59E0B' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 py-2 border-b border-brand-yellow/20 last:border-0"
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: item.color }}
                      />
                      <span className="text-sm text-slate-700 flex-1">{item.text}</span>
                      <span className="text-xs text-slate-400">{item.time}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FOR INVESTORS */}
      {/* ================================================================ */}
      <section id="for-investors" className="py-28 px-6 text-white bg-brand-charcoal">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Visual - Professional Dark Dashboard */}
            <div className="order-2 lg:order-1 relative">
              <Card className="p-6 bg-primary border-2 border-brand-yellow shadow-sm reveal-on-scroll reveal-item alive-float-slow">
                <CardContent className="p-0">
                  {/* Portfolio Value */}
                  <div className="flex items-center justify-between p-5 rounded-xl mb-4 border border-brand-yellow" style={{ background: 'rgba(0,0,0,0.08)' }}>
                    <div>
                      <div className="text-sm text-foreground/70">Portfolio Value</div>
                      <div className="text-2xl font-bold text-foreground">45,80,000</div>
                    </div>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-black">
                      <PiggyBank className="w-6 h-6 text-brand-yellow" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Invested', value: '32L', color: '#EFBF04' },
                      { label: 'Returns', value: '13.8L', color: '#10B981' },
                      { label: 'Deals', value: '8', color: '#F59E0B' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl text-center border border-brand-yellow"
                        style={{ background: 'rgba(0,0,0,0.08)' }}
                      >
                        <div className="text-xs text-foreground/70 mb-1">{item.label}</div>
                        <div className="text-lg font-bold text-foreground">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Top Ventures */}
                  <div className="p-4 rounded-xl border border-brand-yellow" style={{ background: 'rgba(0,0,0,0.08)' }}>
                    <div className="text-sm font-medium text-foreground/70 mb-3">Top Ventures</div>
                    {[
                      { name: 'EcoTrack Solutions', domain: 'CleanTech', growth: '+24%', color: '#10B981' },
                      { name: 'FinPay AI', domain: 'Fintech', growth: '+18%', color: '#EFBF04' },
                      { name: 'HealthBridge', domain: 'HealthTech', growth: '+31%', color: '#F59E0B' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2.5 border-b last:border-0 border-brand-yellow/20"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-black text-brand-yellow"
                          >
                            {item.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm text-foreground font-medium">{item.name}</div>
                            <div className="text-xs text-foreground/60">{item.domain}</div>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {item.growth}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Content */}
            <div className="order-1 lg:order-2">
              <span className="inline-block text-sm font-semibold tracking-widest uppercase mb-4 text-brand-yellow">
                For Investors
              </span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
                Discover the next<br /><span className="text-brand-yellow">big thing</span>
              </h2>
              <p className="text-lg mb-10 leading-relaxed text-slate-300">
                Stop sifting through noise. INNOVESTOR delivers curated, admin-verified startup
                opportunities matched to your investment interests.
              </p>

              <div className="space-y-6">
                <FeatureItem variant="dark" icon={Search} title="Curated Marketplace" description="Browse vetted ideas filtered by domain, stage, and investment range." />
                <FeatureItem variant="dark" icon={Eye} title="Transparent Data" description="Detailed venture profiles with investment needs, traction, and founder info." />
                <FeatureItem variant="dark" icon={Lock} title="Secure Deal Flow" description="Private negotiations, encrypted chat, and secure UPI payment integration." />
                <FeatureItem variant="dark" icon={BarChart3} title="Portfolio Analytics" description="Track returns, profit shares, and portfolio growth in real-time dashboards." />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* PLATFORM FEATURES */}
      {/* ================================================================ */}
      <section id="features" className="py-28 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span className="inline-block text-sm font-semibold tracking-widest uppercase mb-4 text-brand-yellow">
              Platform Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Everything you need,<br />nothing you don't
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="reveal-on-scroll reveal-item" data-direction="left"><PlatformCard3D icon={Shield} title="Bank-Grade Security" description="End-to-end encryption, Row Level Security, and admin-verified accounts keep your data safe." delay={0} /></div>
            <div className="reveal-on-scroll reveal-item" data-direction="right"><PlatformCard3D icon={MessageSquare} title="Real-time Chat" description="Instant messaging with read receipts, typing indicators, and deal-specific conversation threads." delay={100} /></div>
            <div className="reveal-on-scroll reveal-item" data-direction="left"><PlatformCard3D icon={Zap} title="Instant Notifications" description="Stay in the loop with real-time alerts for new requests, investments, and profit updates." delay={200} /></div>
            <div className="reveal-on-scroll reveal-item" data-direction="right"><PlatformCard3D icon={BarChart3} title="Smart Analytics" description="Interactive charts and dashboards tracking investment flow, portfolio performance, and growth." delay={300} /></div>
            <div className="reveal-on-scroll reveal-item" data-direction="left"><PlatformCard3D icon={PiggyBank} title="UPI Payments" description="Seamless investment processing with QR code generation and integrated UPI payment support." delay={400} /></div>
            <div className="reveal-on-scroll reveal-item" data-direction="right"><PlatformCard3D icon={FileText} title="Deal Management" description="Comprehensive DealCenter for negotiations, investment recording, profit sharing, and reinvestment." delay={500} /></div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* STATS */}
      {/* ================================================================ */}
      <section className="py-28 px-6 text-white bg-brand-charcoal">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Growing <span className="text-brand-yellow">every day</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="reveal-on-scroll reveal-item" data-direction="left"><AnimatedCounter3D target={5} label="Colleges Registered" icon={Building2} /></div>
            <div className="reveal-on-scroll reveal-item" data-direction="right"><AnimatedCounter3D target={30} label="Student Founders" icon={GraduationCap} /></div>
            <div className="reveal-on-scroll reveal-item" data-direction="left"><AnimatedCounter3D target={10} label="Professionals" icon={Briefcase} /></div>
            <div className="reveal-on-scroll reveal-item" data-direction="right"><AnimatedCounter3D target={12} label="Active Investors" icon={CircleDollarSign} /></div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* TESTIMONIALS */}
      {/* ================================================================ */}
      <section className="py-28 px-6 bg-brand-charcoal">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold tracking-widest uppercase mb-4 text-brand-yellow">
              Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              What our community says
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="reveal-on-scroll reveal-item" data-direction="left">
              <TestimonialCard3D
                name="Sarah Jenkins"
                role="Founder, EcoTech Solutions"
                content="Innovestor completely transformed how we approached fundraising. Within just three weeks, we secured our seed round from a lead investor we met right here. It's not just a platform; it's a catalyst for innovation."
                delay={0}
              />
            </div>
            <div className="reveal-on-scroll reveal-item" data-direction="right">
              <TestimonialCard3D
                name="James Sterling"
                role="Angel Investor"
                content="The platform's rigorous vetting process ensures startups are of exceptional quality. I've already made two significant investments through Innovestor, and the returns on efficiency are as valuable as the financial potential."
                delay={150}
              />
            </div>
            <div className="reveal-on-scroll reveal-item" data-direction="left">
              <TestimonialCard3D
                name="Robert Chen"
                role="Partner, Horizon VC"
                content="The interface is remarkably professional. Being able to chat directly with founders within a secure environment expedites relationship-building. It feels like a private club that's open to anyone serious about innovation."
                delay={300}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* COLLEGE MARQUEE */}
      {/* ================================================================ */}
      <section className="py-20 overflow-hidden bg-background">
        <div className="text-center mb-12 px-6">
          <span className="inline-block text-sm font-semibold tracking-widest uppercase mb-4 text-brand-yellow">
            Our Network
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Students from 100+ colleges
          </h2>
        </div>

        {/* Row 1 */}
        <div className="flex animate-marquee hover:[animation-play-state:paused] mb-4">
          {[...colleges, ...colleges].map((college, i) => (
            <span key={i} className="shrink-0 mx-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap border border-border text-muted-foreground bg-white transition-colors hover:border-brand-yellow hover:bg-brand-yellow/10">
              {college}
            </span>
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex animate-marquee-reverse hover:[animation-play-state:paused]">
          {[...colleges].reverse().concat([...colleges].reverse()).map((college, i) => (
            <span key={i} className="shrink-0 mx-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap border border-brand-yellow/20 text-brand-yellow bg-brand-yellow/5 transition-colors hover:bg-brand-yellow/10">
              {college}
            </span>
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/* FAQ */}
      {/* ================================================================ */}
      <section id="faq" className="py-28 px-6 bg-black">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold tracking-widest uppercase mb-4 text-brand-yellow">
              FAQ
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Got questions?
            </h2>
          </div>

          <div className="divide-y divide-border">
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.q}
                answer={faq.a}
                isOpen={openFAQ === i}
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* CTA SECTION */}
      {/* ================================================================ */}
      <section className="relative py-28 px-6 text-center overflow-hidden bg-brand-charcoal">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] parallax" style={{ background: 'rgba(239, 191, 4, 0.08)' }} />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto reveal-on-scroll reveal-item">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
            Ready to build the future?
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto text-muted-foreground">
            Join hundreds of founders and investors already using INNOVESTOR
            to connect, invest, and grow together.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth?mode=register">
              <Button className="text-base font-semibold rounded-full px-10 py-6 bg-brand-yellow text-brand-charcoal hover:scale-105 transition-all shadow-xl shadow-brand-yellow/30">
                Get Started for Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/auth?mode=login">
              <Button variant="outline" className="text-base font-medium rounded-full px-10 py-6 transition-all hover:bg-white/10 border-white/20 text-white/60">
                I already have an account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FOOTER */}
      {/* ================================================================ */}
      <footer style={{ background: 'rgb(0, 0, 0)' }}>
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-10">
          {/* Main Footer */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Company */}
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <Logo size="sm" />
                <span className="text-xl font-bold text-white tracking-tight">INNOVESTOR</span>
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#64748B' }}>
                Bridging the gap between visionary founders and strategic investors. Transform your ideas into reality.
              </p>
              <div className="flex gap-3">
                {[
                  { href: 'https://twitter.com', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                  { href: 'https://linkedin.com', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
                  { href: 'https://instagram.com', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
                ].map((social, i) => (
                  <a key={i} href={social.href} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#EFBF04'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d={social.path} /></svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-5 text-sm tracking-wide uppercase">Quick Links</h3>
              <ul className="space-y-3">
                {[
                  { label: 'Get Started', to: '/auth?mode=register' },
                  { label: 'Login', to: '/auth?mode=login' },
                  { label: 'How it Works', href: '#how-it-works' },
                  { label: 'Features', href: '#features' },
                ].map((item, i) => (
                  <li key={i}>
                    {item.to ? (
                      <Link to={item.to} className="text-sm transition-colors hover:text-white flex items-center gap-2 group" style={{ color: '#64748B' }}>
                        <span className="w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: '#EFBF04' }} />
                        {item.label}
                      </Link>
                    ) : (
                      <a href={item.href} className="text-sm transition-colors hover:text-white flex items-center gap-2 group" style={{ color: '#64748B' }}>
                        <span className="w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: '#EFBF04' }} />
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-5 text-sm tracking-wide uppercase">Legal</h3>
              <ul className="space-y-3">
                {[
                  { label: 'Privacy Policy', to: '/privacy-policy' },
                  { label: 'Terms & Conditions', to: '/terms-and-conditions' },
                  { label: 'Refund Policy', to: '/refund-policy' },
                ].map((item, i) => (
                  <li key={i}>
                    <Link to={item.to} className="text-sm transition-colors hover:text-white flex items-center gap-2 group" style={{ color: '#64748B' }}>
                      <span className="w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-brand-yellow" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-semibold mb-5 text-sm tracking-wide uppercase">Contact</h3>
              <ul className="space-y-3">
                <li>
                  <a href="mailto:support@innovestor.com" className="text-sm transition-colors hover:text-white flex items-center gap-2" style={{ color: '#64748B' }}>
                    <svg className="w-4 h-4 shrink-0 text-brand-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    support@innovestor.com
                  </a>
                </li>
                <li className="flex items-start gap-2 text-sm" style={{ color: '#64748B' }}>
                  <svg className="w-4 h-4 shrink-0 mt-0.5 text-brand-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Vizag, Andhra Pradesh,<br />India Ã¢â‚¬â€œ 530001</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full mb-8" style={{ background: 'rgba(255,255,255,0.08)' }} />

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-600">
              © 2026 INNOVESTOR. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>Made with</span>
              <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <span>in India</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
