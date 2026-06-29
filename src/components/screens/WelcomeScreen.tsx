'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import {
  Send, Phone, Store, Code, ArrowLeftRight, ShoppingBag,
  Smartphone, Apple, Check, Bell, Globe, Headphones,
  Loader2, Shield, Zap, Users, ChevronRight, Gift,
  Wallet, MessageCircle, ArrowRight, Lock, CreditCard,
  BarChart3, Star, TrendingUp, Sparkles, Landmark, Banknote,
  QrCode, Repeat, CircleDot, X, Download, Share2, Plus, Home,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useTranslation, languageNames, languages, type Language } from '@/lib/i18n';
import { toast } from 'sonner';

// ─── Animated Counter Component ──────────────────────────────────
function AnimatedCounter({ value, suffix = '', prefix = '', duration = 2 }: { value: number; suffix?: string; prefix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (value >= 1000) {
          setDisplayValue(Math.floor(v).toLocaleString('en-US'));
        } else if (value < 1) {
          setDisplayValue(v.toFixed(1));
        } else {
          setDisplayValue(Math.floor(v).toString());
        }
      },
    });
    return () => controls.stop();
  }, [inView, value, duration]);

  return <span ref={ref}>{prefix}{displayValue}{suffix}</span>;
}

// ─── Floating Particles (deterministic to avoid hydration mismatch) ──
function FloatingParticles() {
  const particles = [
    { id: 0, left: 5, delay: 0.5, duration: 8, size: 3, opacity: 0.2 },
    { id: 1, left: 15, delay: 2.1, duration: 10, size: 2.5, opacity: 0.15 },
    { id: 2, left: 25, delay: 4.3, duration: 7, size: 4, opacity: 0.25 },
    { id: 3, left: 35, delay: 1.2, duration: 9, size: 3, opacity: 0.18 },
    { id: 4, left: 45, delay: 6.0, duration: 11, size: 2, opacity: 0.12 },
    { id: 5, left: 55, delay: 3.5, duration: 8.5, size: 3.5, opacity: 0.22 },
    { id: 6, left: 65, delay: 0.8, duration: 12, size: 2.5, opacity: 0.16 },
    { id: 7, left: 75, delay: 5.2, duration: 9.5, size: 4, opacity: 0.2 },
    { id: 8, left: 85, delay: 7.1, duration: 7.5, size: 3, opacity: 0.14 },
    { id: 9, left: 95, delay: 2.8, duration: 10.5, size: 2, opacity: 0.18 },
    { id: 10, left: 10, delay: 4.9, duration: 13, size: 3.5, opacity: 0.2 },
    { id: 11, left: 20, delay: 1.6, duration: 8, size: 2, opacity: 0.15 },
    { id: 12, left: 30, delay: 6.5, duration: 11, size: 4, opacity: 0.25 },
    { id: 13, left: 40, delay: 3.0, duration: 9, size: 3, opacity: 0.17 },
    { id: 14, left: 50, delay: 0.3, duration: 7, size: 2.5, opacity: 0.13 },
    { id: 15, left: 60, delay: 5.8, duration: 10, size: 3.5, opacity: 0.22 },
    { id: 16, left: 70, delay: 2.4, duration: 12, size: 2, opacity: 0.16 },
    { id: 17, left: 80, delay: 7.5, duration: 8.5, size: 3, opacity: 0.19 },
    { id: 18, left: 90, delay: 4.0, duration: 9.5, size: 4, opacity: 0.21 },
    { id: 19, left: 48, delay: 1.0, duration: 14, size: 2.5, opacity: 0.14 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-blue-400/30 dark:bg-blue-500/20"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animation: `particleFloat ${p.duration}s ${p.delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Mesh Gradient Background ────────────────────────────────────
function MeshGradient({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] premium-mesh-float" />
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-red-500/8 rounded-full blur-[100px]" style={{ animation: 'gradientOrb 15s ease-in-out infinite' }} />
      <div className="absolute -bottom-32 right-1/4 w-72 h-72 bg-amber-400/6 rounded-full blur-[80px]" style={{ animation: 'gradientOrb 20s 3s ease-in-out infinite' }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px]" style={{ animation: 'gradientOrb 18s 6s ease-in-out infinite' }} />
    </div>
  );
}

// ─── Section Wrapper with scroll animation ───────────────────────
function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, filter: 'blur(6px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Premium Feature Card ────────────────────────────────────────
function PremiumFeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="group"
    >
      <div className="relative rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-5 overflow-hidden hover:border-blue-300/40 dark:hover:border-blue-600/30 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/5">
        {/* Hover gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        {/* Top shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-400/15 dark:to-blue-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 border border-blue-200/30 dark:border-blue-700/20">
            <Icon className="w-5.5 h-5.5 text-[#1E40AF] dark:text-blue-400" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1.5">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Services Data ────────────────────────────────────────────────
const services = [
  { icon: Send, titleKey: 'welcome.services.transfers', descKey: 'welcome.services.transfers_desc', gradient: 'from-blue-500/5 to-transparent' },
  { icon: Phone, titleKey: 'welcome.services.mobile_money', descKey: 'welcome.services.mobile_money_desc', gradient: 'from-red-500/5 to-transparent' },
  { icon: Store, titleKey: 'welcome.services.merchant', descKey: 'welcome.services.merchant_desc', gradient: 'from-amber-500/5 to-transparent' },
  { icon: Code, titleKey: 'welcome.services.api', descKey: 'welcome.services.api_desc', gradient: 'from-emerald-500/5 to-transparent' },
  { icon: ArrowLeftRight, titleKey: 'welcome.services.barter', descKey: 'welcome.services.barter_desc', gradient: 'from-violet-500/5 to-transparent' },
  { icon: ShoppingBag, titleKey: 'welcome.services.marketplace', descKey: 'welcome.services.marketplace_desc', gradient: 'from-cyan-500/5 to-transparent' },
];

const features = [
  { icon: Shield, titleKey: 'welcome.feature_secure', descKey: 'welcome.feature_secure_desc', gradient: 'from-blue-50/80 to-transparent dark:from-blue-950/40' },
  { icon: Zap, titleKey: 'welcome.feature_fast', descKey: 'welcome.feature_fast_desc', gradient: 'from-emerald-50/80 to-transparent dark:from-emerald-950/40' },
  { icon: Gift, titleKey: 'welcome.feature_bonus', descKey: 'welcome.feature_bonus_desc', gradient: 'from-amber-50/80 to-transparent dark:from-amber-950/40' },
  { icon: Wallet, titleKey: 'welcome.feature_multi', descKey: 'welcome.feature_multi_desc', gradient: 'from-violet-50/80 to-transparent dark:from-violet-950/40' },
];

const newsItems = [
  { icon: Globe, textKey: 'welcome.news_1' },
  { icon: Code, textKey: 'welcome.news_2' },
  { icon: Users, textKey: 'welcome.news_3' },
];

const stats = [
  { value: 50, suffix: '+', labelKey: 'welcome.stats_countries', icon: Globe },
  { value: 0.7, suffix: '%', labelKey: 'welcome.stats_fees', icon: Zap },
  { value: 10, prefix: '$', suffix: '', labelKey: 'welcome.stats_bonus', icon: Gift },
];

// ─── Animation Variants ───────────────────────────────────────────
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const heroContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Install Step Item ───────────────────────────────────────────
function StepItem({ number, color = 'blue', children }: { number: number; color?: 'blue' | 'emerald'; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <div className={`w-8 h-8 rounded-full ${color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-emerald-100 dark:bg-emerald-900/40'} flex items-center justify-center shrink-0 mt-0.5`}>
        <span className={`text-sm font-bold ${color === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{number}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function WelcomeScreen() {
  const navigateTo = useAppStore((s) => s.navigateTo);
  const setSelectedRole = useAppStore((s) => s.setSelectedRole);
  const { canInstall, isIOS, isInstalled, isStandalone, installApp } = usePWAInstall();
  const { t, language, setLanguage } = useTranslation();
  const [installing, setInstalling] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installPlatform, setInstallPlatform] = useState<'android' | 'ios'>('android');
  const mainRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const handleAndroidInstall = async () => {
    if (canInstall) {
      setInstalling(true);
      const success = await installApp();
      setInstalling(false);
      if (success) {
        toast.success(t('welcome.install_success'));
      } else {
        setInstallPlatform('android');
        setShowInstallModal(true);
      }
    } else {
      setInstallPlatform('android');
      setShowInstallModal(true);
    }
  };

  const handleIOSInstall = () => {
    setInstallPlatform('ios');
    setShowInstallModal(true);
  };

  return (
    <div ref={mainRef} className="min-h-screen bg-background relative">
      {/* ── Mesh Background ── */}
      <MeshGradient />
      <FloatingParticles />

      <motion.div
        variants={heroContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col min-h-screen"
      >
        {/* ═══════════════════════════════════════════════════════════
            HEADER — Language Selector
        ═══════════════════════════════════════════════════════════ */}
        <motion.header variants={heroItem} className="px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
            </motion.div>
          </div>
          <div className="flex items-center gap-1 flex-wrap justify-end">
            <Globe className="w-3.5 h-3.5 text-muted-foreground mr-0.5 shrink-0" />
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`
                  px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-300 cursor-pointer
                  ${language === lang
                    ? 'bg-[#1E40AF] text-white shadow-lg shadow-blue-500/25 scale-105'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
                aria-label={languageNames[lang]}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </motion.header>

        <main className="flex-1 space-y-10 sm:space-y-14 lg:space-y-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full pb-8">

          {/* ═══════════════════════════════════════════════════════════
              HERO — Logo + Headline + CTA
          ═══════════════════════════════════════════════════════════ */}
          <motion.section variants={heroItem} className="pt-8 sm:pt-14 text-center">
            {/* Logo - WhatsApp-style centered hero */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.1 }}
              className="flex justify-center mb-8 sm:mb-10"
            >
              <div className="relative">
                {/* Outer glow pulse - WhatsApp style */}
                <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-[#1E40AF]/25 via-blue-400/15 to-[#2563EB]/20 blur-2xl pointer-events-none" style={{ animation: 'traitGlow 3s ease-in-out infinite' }} />
                {/* Animated ring pulse */}
                <motion.div
                  animate={{ scale: [1, 1.04, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -inset-3 rounded-[32px] border-2 border-blue-300/25 dark:border-blue-500/20 pointer-events-none"
                />
                {/* Logo container */}
                <div className="relative rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#2563EB] p-1 shadow-2xl shadow-blue-600/30 dark:shadow-blue-900/50">
                  <div className="rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden p-2">
                    <Image
                      src="/trait-logo.png"
                      alt="TRAIT"
                      width={200}
                      height={200}
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3 sm:space-y-4"
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
                {t('welcome.hero_headline')}
                <br />
                <span className="premium-gradient-text">{t('welcome.hero_headline2')}</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
                {t('welcome.hero_desc')}
              </p>
            </motion.div>

            {/* Hero Badges */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-2 mt-5"
            >
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40 text-xs font-medium px-3 py-1 shadow-sm">
                <Zap className="w-3 h-3 mr-1.5" />
                {t('welcome.fee')}
              </Badge>
              <Badge className="bg-amber-50 text-amber-700 border-amber-200/60 hover:bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40 text-xs font-medium px-3 py-1 shadow-sm">
                <Gift className="w-3 h-3 mr-1.5" />
                {t('welcome.bonus')}
              </Badge>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200/60 hover:bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40 text-xs font-medium px-3 py-1 shadow-sm">
                <Lock className="w-3 h-3 mr-1.5" />
                <Lock className="w-3 h-3 -ml-1.5 mr-1.5 opacity-0" />
                SSL/TLS
              </Badge>
            </motion.div>

            {/* Hero Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
            >
              <Button
                onClick={() => {
                  setSelectedRole('client');
                  navigateTo('auth-phone');
                }}
                className="w-full sm:w-auto px-8 h-12 text-sm font-bold bg-gradient-to-r from-[#1E40AF] to-[#2563EB] hover:from-[#1E3A8A] hover:to-[#1E40AF] text-white rounded-xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/35 transition-all duration-300 cursor-pointer active:scale-[0.97] group"
              >
                <Users className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                {t('welcome.signup')}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={() => navigateTo('auth-login')}
                variant="outline"
                className="w-full sm:w-auto px-8 h-12 text-sm font-bold border-2 border-[#1E40AF]/20 text-[#1E40AF] dark:text-blue-400 dark:border-blue-700/30 hover:bg-[#1E40AF]/5 dark:hover:bg-blue-950/30 rounded-xl transition-all duration-300 cursor-pointer active:scale-[0.97]"
              >
                {t('welcome.login')}
              </Button>
            </motion.div>

            {/* Seller CTA */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.75 }}
              className="mt-4 w-full sm:max-w-sm mx-auto"
            >
              <button
                onClick={() => navigateTo('seller-register')}
                className="w-full flex items-center justify-center gap-2.5 px-6 h-11 rounded-xl border-2 border-pink-400/40 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/20 dark:border-pink-700/30 hover:border-pink-500/60 hover:shadow-lg hover:shadow-pink-500/10 transition-all duration-300 cursor-pointer active:scale-[0.98] group"
              >
                <Store className="w-4 h-4 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-pink-700 dark:text-pink-300">🏪 Devenir un fournisseur de services Trait</span>
                <ChevronRight className="w-4 h-4 text-pink-500/60 group-hover:translate-x-1 group-hover:text-pink-500 transition-all" />
              </button>
            </motion.div>
          </motion.section>

          {/* ═══════════════════════════════════════════════════════════
              STATS — Animated Counters
          ═══════════════════════════════════════════════════════════ */}
          <AnimatedSection className="px-0 sm:px-4">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.labelKey}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -4, transition: { duration: 0.25 } }}
                    className="relative rounded-2xl bg-card/70 backdrop-blur-sm border border-border/40 p-4 sm:p-5 text-center overflow-hidden group hover:border-blue-200/50 dark:hover:border-blue-700/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5"
                  >
                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-4.5 h-4.5 text-[#1E40AF] dark:text-blue-400" />
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix || ''} duration={2.5} />
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-1">
                      {t(stat.labelKey)}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </AnimatedSection>

          {/* ═══════════════════════════════════════════════════════════
              SERVICES — Horizontal Carousel
          ═══════════════════════════════════════════════════════════ */}
          <AnimatedSection delay={0.1}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E40AF]/10 to-[#1E40AF]/5 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-[#1E40AF] dark:text-blue-400" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">{t('welcome.feature_cards_title')}</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 no-scrollbar snap-x snap-mandatory">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.titleKey}
                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                    whileInView={{ opacity: 1, x: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ scale: 1.03, y: -4 }}
                    className="snap-start"
                  >
                    <div className="min-w-[160px] max-w-[180px] rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 p-4 hover:border-blue-200/50 dark:hover:border-blue-700/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 group">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-400/15 dark:to-blue-500/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 border border-blue-200/20 dark:border-blue-700/15">
                        <Icon className="w-5 h-5 text-[#1E40AF] dark:text-blue-400" />
                      </div>
                      <p className="text-xs font-bold text-foreground leading-snug mb-1">{t(service.titleKey)}</p>
                      <p className="text-[10px] text-muted-foreground leading-snug">{t(service.descKey)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatedSection>

          {/* ═══════════════════════════════════════════════════════════
              FEATURES — 2x2 Grid
          ═══════════════════════════════════════════════════════════ */}
          <AnimatedSection delay={0.1}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E40AF]/10 to-[#1E40AF]/5 flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#1E40AF] dark:text-blue-400" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">{t('welcome.features')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {features.map((feature, index) => (
                <PremiumFeatureCard
                  key={feature.titleKey}
                  icon={feature.icon}
                  title={t(feature.titleKey)}
                  description={t(feature.descKey)}
                  gradient={feature.gradient}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </AnimatedSection>

          {/* ═══════════════════════════════════════════════════════════
              TRUST — Security Banner
          ═══════════════════════════════════════════════════════════ */}
          <AnimatedSection>
            <div className="relative rounded-2xl overflow-hidden">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] dark:from-[#020617] dark:via-[#0F172A] dark:to-[#020617]" />
              {/* Mesh patterns */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-1/4 w-48 h-48 bg-blue-500/20 rounded-full blur-[80px]" style={{ animation: 'gradientOrb 12s ease-in-out infinite' }} />
                <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-red-500/15 rounded-full blur-[80px]" style={{ animation: 'gradientOrb 15s 3s ease-in-out infinite' }} />
              </div>
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              {/* Shimmer sweep */}
              <div className="absolute inset-0 premium-shimmer" />

              <div className="relative z-10 p-6 sm:p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-400/20 flex items-center justify-center mx-auto mb-4"
                >
                  <Shield className="w-7 h-7 text-blue-300" />
                </motion.div>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2">{t('welcome.trust_title')}</h2>
                <p className="text-sm text-blue-200/70 max-w-md mx-auto leading-relaxed">{t('welcome.trust_desc')}</p>
                <div className="flex items-center justify-center gap-4 mt-5">
                  <div className="flex items-center gap-1.5 text-blue-300/60 text-xs">
                    <Lock className="w-3.5 h-3.5" />
                    <span>SSL/TLS</span>
                  </div>
                  <div className="w-px h-3 bg-blue-400/20" />
                  <div className="flex items-center gap-1.5 text-blue-300/60 text-xs">
                    <Shield className="w-3.5 h-3.5" />
                    <span>JWT</span>
                  </div>
                  <div className="w-px h-3 bg-blue-400/20" />
                  <div className="flex items-center gap-1.5 text-blue-300/60 text-xs">
                    <Star className="w-3.5 h-3.5" />
                    <span>E2E</span>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* ═══════════════════════════════════════════════════════════
              ACCOUNT BUTTONS — Connexion, Agent, Developer, Support
          ═══════════════════════════════════════════════════════════ */}
          <AnimatedSection>
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-3">
              {/* Agent Account */}
              <motion.div variants={staggerItem} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => navigateTo('agent-register')}
                  className="w-full h-12 text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-300 cursor-pointer group"
                >
                  <Shield className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  {t('welcome.agent')}
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Button>
              </motion.div>

              {/* Developer Space */}
              <motion.div variants={staggerItem} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => navigateTo('developer-register')}
                  className="w-full h-11 text-sm font-bold bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl transition-all duration-300 cursor-pointer group"
                >
                  <Code className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  {t('welcome.developer')}
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Button>
              </motion.div>

              {/* Support */}
              <motion.div variants={staggerItem} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => navigateTo('support')}
                  variant="ghost"
                  className="w-full h-11 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl transition-all duration-300 cursor-pointer group"
                >
                  <Headphones className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  {t('welcome.support')}
                  <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-50 group-hover:translate-x-1 transition-all" />
                </Button>
              </motion.div>

              {/* Nous contacter */}
              <motion.div variants={staggerItem} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => navigateTo('support')}
                  variant="ghost"
                  className="w-full h-11 text-sm font-semibold text-[#1E40AF] dark:text-blue-400 hover:text-[#1E3A8A] dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-[#1E40AF]/15 dark:border-blue-800/20 rounded-xl transition-all duration-300 cursor-pointer group"
                >
                  <MessageCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  {t('welcome.contact')}
                  <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-50 group-hover:translate-x-1 transition-all" />
                </Button>
              </motion.div>
            </motion.div>
          </AnimatedSection>

          {/* ═══════════════════════════════════════════════════════════
              NEWS — Nouveautés
          ═══════════════════════════════════════════════════════════ */}
          <AnimatedSection>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5 flex items-center justify-center">
                <Bell className="w-4 h-4 text-amber-500" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">{t('welcome.news_title')}</h2>
            </div>
            <div className="space-y-2.5">
              {newsItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.textKey}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ x: 4, transition: { duration: 0.2 } }}
                  >
                    <div className="flex items-center gap-3 bg-card/70 backdrop-blur-sm border border-border/40 rounded-xl p-3.5 hover:border-amber-200/50 dark:hover:border-amber-800/30 transition-all duration-300 cursor-default group hover:shadow-md hover:shadow-amber-500/5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <p className="text-xs font-semibold text-foreground leading-snug flex-1">{t(item.textKey)}</p>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-amber-500 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatedSection>

          {/* ═══════════════════════════════════════════════════════════
              PWA INSTALL — Android & iOS
          ═══════════════════════════════════════════════════════════ */}
          {!isStandalone && !isInstalled && (
            <AnimatedSection>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E40AF]/10 to-[#1E40AF]/5 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-[#1E40AF] dark:text-blue-400" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">{t('welcome.download_title')}</h2>
              </div>

              {/* Download grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <motion.button
                  onClick={handleAndroidInstall}
                  disabled={installing}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 p-4 sm:p-5 text-center overflow-hidden group hover:border-blue-200/50 dark:hover:border-blue-700/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#2563EB] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                    {installing ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Smartphone className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">{t('welcome.download_android')}</p>
                  <p className="text-sm font-bold text-foreground leading-tight mt-0.5">
                    {installing ? t('welcome.installing') : t('welcome.android')}
                  </p>
                </motion.button>

                <motion.button
                  onClick={handleIOSInstall}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 p-4 sm:p-5 text-center overflow-hidden group hover:border-slate-300/50 dark:hover:border-slate-600/30 transition-all duration-300 hover:shadow-xl hover:shadow-slate-500/10 cursor-pointer"
                >
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-400/40 to-transparent" />
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-slate-500/20 group-hover:scale-110 transition-transform duration-300">
                    <Apple className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">{t('welcome.download_ios')}</p>
                  <p className="text-sm font-bold text-foreground leading-tight mt-0.5">{t('welcome.ios')}</p>
                </motion.button>
              </div>

              {canInstall && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-xs text-[#1E40AF] dark:text-blue-400 font-medium flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {t('welcome.install_ready')}
                </motion.p>
              )}
              <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
                {t('welcome.pwa_note')}
              </p>
            </AnimatedSection>
          )}

          {/* ═══════════════════════════════════════════════════════════
              INFO BANNER
          ═══════════════════════════════════════════════════════════ */}
          <AnimatedSection>
            <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/15 border border-blue-100/60 dark:border-blue-900/40 p-4 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-4 h-4 text-[#1E40AF] dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1E40AF] dark:text-blue-300 mb-1">{t('welcome.good_to_know')}</p>
                <p className="text-[11px] text-blue-700/80 dark:text-blue-400/70 leading-relaxed">{t('welcome.good_to_know_text')}</p>
              </div>
            </div>
          </AnimatedSection>

          {/* ═══════════════════════════════════════════════════════════
              CTA — Final Call to Action
          ═══════════════════════════════════════════════════════════ */}
          <AnimatedSection>
            <div className="relative rounded-2xl overflow-hidden">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1E40AF] via-[#2563EB] to-[#DC2626]" />
              {/* Decorative elements */}
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/8" style={{ animation: 'gradientOrb 10s ease-in-out infinite' }} />
              <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-white/5" style={{ animation: 'gradientOrb 14s 4s ease-in-out infinite' }} />
              <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/5" />
              {/* Mesh gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
              {/* Shimmer */}
              <div className="absolute inset-0 premium-shimmer" />

              <div className="relative z-10 p-6 sm:p-8 text-center">
                <h2 className="text-xl sm:text-2xl font-black text-white mb-2">{t('welcome.cta_title')}</h2>
                <p className="text-sm text-blue-100/80 max-w-sm mx-auto mb-6">{t('welcome.cta_desc')}</p>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    onClick={() => {
                      setSelectedRole('client');
                      navigateTo('auth-phone');
                    }}
                    className="bg-white hover:bg-white/90 text-[#1E40AF] font-bold rounded-xl shadow-xl shadow-black/10 px-8 h-12 transition-all duration-300 cursor-pointer group"
                  >
                    {t('welcome.cta_button')}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </AnimatedSection>

        </main>

        {/* ═══════════════════════════════════════════════════════════
            INSTALL GUIDE MODAL
        ═══════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showInstallModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setShowInstallModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-md bg-card rounded-t-3xl p-6"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${installPlatform === 'android' ? 'bg-gradient-to-br from-[#1E40AF] to-[#2563EB]' : 'bg-gradient-to-br from-slate-700 to-slate-900'}`}>
                      {installPlatform === 'android' ? <Smartphone className="w-5 h-5 text-white" /> : <Apple className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {installPlatform === 'android' ? t('welcome.android_install_title') : t('welcome.ios_install_title')}
                      </h3>
                      <p className="text-xs text-muted-foreground">TRAIT PWA</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowInstallModal(false)}
                    className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Steps */}
                <div className="flex flex-col gap-4">
                  {installPlatform === 'android' ? (
                    <>
                      <StepItem number={1} color="blue">
                        <p className="text-sm font-semibold text-foreground">{t('welcome.android_step_1_title')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('welcome.android_step_1_desc')}</p>
                      </StepItem>
                      <StepItem number={2} color="blue">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{t('welcome.android_step_2_title')}</p>
                          <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <span className="inline-block w-4 h-4 rounded bg-muted border border-border/50 flex items-center justify-center">
                              <span className="text-[8px]">⋮</span>
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('welcome.android_step_2_desc')}</p>
                      </StepItem>
                      <StepItem number={3} color="blue">
                        <p className="text-sm font-semibold text-foreground">{t('welcome.android_step_3_title')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('welcome.android_step_3_desc')}</p>
                      </StepItem>
                      <StepItem number={4} color="emerald">
                        <p className="text-sm font-semibold text-foreground">{t('welcome.android_step_4_title')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('welcome.android_step_4_desc')}</p>
                      </StepItem>
                    </>
                  ) : (
                    <>
                      <StepItem number={1} color="blue">
                        <p className="text-sm font-semibold text-foreground">{t('welcome.ios_step_1_title')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('welcome.ios_step_1_desc')}</p>
                      </StepItem>
                      <StepItem number={2} color="blue">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{t('welcome.ios_step_2_title')}</p>
                          <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('welcome.ios_step_2_desc')}</p>
                      </StepItem>
                      <StepItem number={3} color="blue">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{t('welcome.ios_step_3_title')}</p>
                          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('welcome.ios_step_3_desc')}</p>
                      </StepItem>
                      <StepItem number={4} color="emerald">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{t('welcome.ios_step_4_title')}</p>
                          <Home className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('welcome.ios_step_4_desc')}</p>
                      </StepItem>
                    </>
                  )}
                </div>

                {/* App badge preview */}
                <div className="mt-5 p-3 rounded-xl bg-muted/30 border border-border/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#2563EB] flex items-center justify-center p-0.5 shadow-lg shadow-blue-500/20">
                    <div className="w-full h-full rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden p-1">
                      <img src="/trait-logo.png" alt="TRAIT" className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">TRAIT</p>
                    <p className="text-[10px] text-muted-foreground">{t('welcome.app_desc_short')}</p>
                  </div>
                  <Download className="w-4 h-4 text-[#1E40AF]" />
                </div>

                <Button
                  onClick={() => setShowInstallModal(false)}
                  className="w-full h-11 mt-5 bg-gradient-to-r from-[#1E40AF] to-[#2563EB] hover:from-[#1E3A8A] hover:to-[#1E40AF] text-white font-bold rounded-xl cursor-pointer shadow-lg shadow-blue-500/20"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {t('welcome.install_modal_got_it')}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════════════════════════ */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-auto border-t border-border/30 py-5 px-4 sm:px-6 text-center bg-background/80 backdrop-blur-sm"
        >
          <p className="text-xs text-muted-foreground">
            {t('welcome.footer')}
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-1">v1.0.0</p>
        </motion.footer>
      </motion.div>
    </div>
  );
}
