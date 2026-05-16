'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Send, Phone, Store, Code, ArrowLeftRight, ShoppingBag,
  Smartphone, Apple, Check, Bell, Globe, Headphones,
  Loader2, Shield, Zap, Users, ChevronRight, Gift,
  Wallet, MessageCircle, ArrowRight,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useTranslation, languageNames, languages, type Language } from '@/lib/i18n';
import { toast } from 'sonner';

// ─── Services Data ────────────────────────────────────────────────
const services = [
  {
    icon: Send,
    titleKey: 'welcome.services.transfers',
    descKey: 'welcome.services.transfers_desc',
    color: 'blue' as const,
  },
  {
    icon: Phone,
    titleKey: 'welcome.services.mobile_money',
    descKey: 'welcome.services.mobile_money_desc',
    color: 'red' as const,
  },
  {
    icon: Store,
    titleKey: 'welcome.services.merchant',
    descKey: 'welcome.services.merchant_desc',
    color: 'amber' as const,
  },
  {
    icon: Code,
    titleKey: 'welcome.services.api',
    descKey: 'welcome.services.api_desc',
    color: 'emerald' as const,
  },
  {
    icon: ArrowLeftRight,
    titleKey: 'welcome.services.barter',
    descKey: 'welcome.services.barter_desc',
    color: 'violet' as const,
  },
  {
    icon: ShoppingBag,
    titleKey: 'welcome.services.marketplace',
    descKey: 'welcome.services.marketplace_desc',
    color: 'cyan' as const,
  },
];

// ─── Color mapping for service cards ──────────────────────────────
const colorMap: Record<string, { bg: string; icon: string; border: string; accent: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    icon: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-100 dark:border-blue-900/50',
    accent: 'bg-blue-500',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/40',
    icon: 'text-red-600 dark:text-red-400',
    border: 'border-red-100 dark:border-red-900/50',
    accent: 'bg-red-500',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    icon: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-100 dark:border-amber-900/50',
    accent: 'bg-amber-500',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    icon: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-900/50',
    accent: 'bg-emerald-500',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    icon: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-100 dark:border-violet-900/50',
    accent: 'bg-violet-500',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    icon: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-100 dark:border-cyan-900/50',
    accent: 'bg-cyan-500',
  },
};

// ─── Features Data ────────────────────────────────────────────────
const features = [
  {
    icon: Shield,
    titleKey: 'welcome.feature_secure',
    descKey: 'welcome.feature_secure_desc',
    color: 'blue' as const,
  },
  {
    icon: Zap,
    titleKey: 'welcome.feature_fast',
    descKey: 'welcome.feature_fast_desc',
    color: 'emerald' as const,
  },
  {
    icon: Gift,
    titleKey: 'welcome.feature_bonus',
    descKey: 'welcome.feature_bonus_desc',
    color: 'amber' as const,
  },
  {
    icon: Wallet,
    titleKey: 'welcome.feature_multi',
    descKey: 'welcome.feature_multi_desc',
    color: 'violet' as const,
  },
];

// ─── News Data ────────────────────────────────────────────────────
const newsItems = [
  { icon: Globe, textKey: 'welcome.news_1' as const },
  { icon: Code, textKey: 'welcome.news_2' as const },
  { icon: Users, textKey: 'welcome.news_3' as const },
];

// ─── Animation Variants ───────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const heroTextVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

const logoVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 20, mass: 0.8 },
  },
};

const sectionHeaderVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

const staggerGridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const gridItemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// ─── Component ────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const navigateTo = useAppStore((s) => s.navigateTo);
  const setSelectedRole = useAppStore((s) => s.setSelectedRole);
  const { canInstall, isIOS, isInstalled, isStandalone, installApp } = usePWAInstall();
  const { t, language, setLanguage } = useTranslation();
  const [installing, setInstalling] = useState(false);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const handleAndroidInstall = async () => {
    setInstalling(true);
    const success = await installApp();
    setInstalling(false);

    if (success) {
      toast.success(t('welcome.install_success'));
    } else {
      toast.info(t('welcome.install_guide'));
    }
  };

  const handleIOSInstall = () => {
    toast.info(t('welcome.ios_guide'));
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
    >
      {/* ── Header: Language Selector ─────────────────────────────── */}
      <motion.header
        variants={itemVariants}
        className="px-5 pt-4 pb-2 flex items-center justify-between"
      >
        <div className="flex items-center gap-1.5 min-w-0" />
        {/* Language Pills */}
        <div className="flex items-center gap-1 flex-wrap justify-end">
          <Globe className="w-3.5 h-3.5 text-muted-foreground mr-0.5 shrink-0" />
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`
                px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 cursor-pointer
                ${language === lang
                  ? 'bg-[#1E40AF] text-white shadow-sm shadow-blue-200 dark:shadow-blue-900/40'
                  : 'bg-muted/80 text-muted-foreground hover:bg-muted'
                }
              `}
              aria-label={languageNames[lang]}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </motion.header>

      {/* ── Logo Section ─────────────────────────────────────────── */}
      <motion.div
        variants={logoVariants}
        className="flex flex-col items-center pt-5 pb-3"
      >
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-[#1E40AF]/25 via-[#2563EB]/15 to-[#DC2626]/25 blur-lg pointer-events-none" />
          {/* Animated pulse ring */}
          <motion.div
            animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-2 rounded-[22px] bg-gradient-to-br from-[#1E40AF]/20 to-[#DC2626]/15 blur-md pointer-events-none"
          />
          <div className="relative rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#2563EB] p-1.5 shadow-2xl shadow-blue-300/40 dark:shadow-blue-900/40">
            <div className="rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden px-2 py-2">
              <Image
                src="/trait-logo.png"
                alt="TRAIT"
                width={220}
                height={106}
                className="object-contain drop-shadow-sm"
                priority
              />
            </div>
          </div>
          {/* Decorative ring */}
          <div className="absolute -inset-1.5 rounded-[20px] border-2 border-blue-200/40 dark:border-blue-700/30 pointer-events-none" />
        </div>
        <div className="mt-3 text-center">
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            TRAIT
          </h1>
          <p className="text-[11px] text-muted-foreground font-medium mt-0.5 tracking-wide">
            FinTech for Africa
          </p>
        </div>
      </motion.div>

      {/* ── Hero Banner ───────────────────────────────────────────── */}
      <motion.section
        variants={heroTextVariants}
        className="mx-5 mb-6 rounded-2xl bg-gradient-to-br from-[#1E40AF] via-[#2563EB] to-[#DC2626] p-6 shadow-xl shadow-blue-200/40 dark:shadow-blue-900/20 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-8 w-14 h-14 rounded-full bg-white/5" />
        <div className="absolute bottom-4 right-1/3 w-8 h-8 rounded-full bg-white/5" />
        {/* Mesh gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            {t('welcome.tagline')}
          </h1>
          <p className="mt-2 text-blue-100 text-sm sm:text-base font-medium">
            {t('welcome.subtitle')}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <motion.div variants={badgeVariants}>
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/25 text-xs font-medium backdrop-blur-sm">
                <Zap className="w-3 h-3 mr-1" />
                {t('welcome.fee')}
              </Badge>
            </motion.div>
            <motion.div variants={badgeVariants}>
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/25 text-xs font-medium backdrop-blur-sm">
                <Check className="w-3 h-3 mr-1" />
                {t('welcome.bonus')}
              </Badge>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main className="flex-1 px-5 space-y-7 pb-8">

        {/* ── Action Buttons ──────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="space-y-2.5">
          {/* Se connecter - Outline */}
          <Button
            onClick={() => navigateTo('auth-login')}
            variant="outline"
            className="w-full h-12 text-base font-semibold border-2 border-[#1E40AF]/30 text-[#1E40AF] dark:text-blue-400 dark:border-blue-700/40 hover:bg-[#1E40AF]/5 dark:hover:bg-blue-950/30 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            {t('welcome.login')}
          </Button>

          {/* Créer un compte Client - Blue filled */}
          <Button
            onClick={() => {
              setSelectedRole('client');
              navigateTo('auth-phone');
            }}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-[#1E40AF] to-[#2563EB] hover:from-[#1E3A8A] hover:to-[#1E40AF] text-white rounded-xl shadow-lg shadow-blue-200/40 dark:shadow-blue-900/30 transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            <Users className="w-4 h-4 mr-2" />
            {t('welcome.signup')}
          </Button>

          {/* Créer un compte Agent - Amber filled */}
          <Button
            onClick={() => {
              navigateTo('agent-register');
            }}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white rounded-xl shadow-lg shadow-amber-200/40 dark:shadow-amber-900/30 transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            <Shield className="w-4 h-4 mr-2" />
            {t('welcome.agent')}
          </Button>

          {/* Espace Développeur - Dark/Slate */}
          <Button
            onClick={() => navigateTo('developer-register')}
            className="w-full h-11 text-sm font-semibold bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            <Code className="w-4 h-4 mr-2" />
            {t('welcome.developer')}
            <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
          </Button>

          {/* Support - Navigate to support page */}
          <Button
            onClick={() => navigateTo('support')}
            variant="ghost"
            className="w-full h-11 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            <Headphones className="w-4 h-4 mr-2" />
            {t('welcome.support')}
          </Button>

          {/* Nous contacter - Ghost/Outline with blue text */}
          <Button
            onClick={() => navigateTo('support')}
            variant="ghost"
            className="w-full h-11 text-sm font-semibold text-[#1E40AF] dark:text-blue-400 hover:text-[#1E3A8A] dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-[#1E40AF]/20 dark:border-blue-800/30 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {t('welcome.contact')}
          </Button>
        </motion.div>

        {/* ── PWA Install Section ─────────────────────────────────── */}
        {!isStandalone && !isInstalled && (
          <motion.div variants={itemVariants}>
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#1E40AF]" />
              {t('welcome.install')}
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Android Install */}
              <button
                onClick={handleAndroidInstall}
                disabled={installing}
                className="flex items-center gap-3 bg-white dark:bg-card border border-border rounded-xl p-3.5 hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#2563EB] flex items-center justify-center shrink-0 shadow-sm shadow-blue-200/50">
                  {installing ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Smartphone className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-muted-foreground leading-tight">{t('welcome.download_android')}</p>
                  <p className="text-sm font-bold text-foreground leading-tight">
                    {installing ? t('welcome.installing') : t('welcome.android')}
                  </p>
                </div>
              </button>

              {/* iOS Install */}
              <button
                onClick={handleIOSInstall}
                className="flex items-center gap-3 bg-white dark:bg-card border border-border rounded-xl p-3.5 hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shrink-0 shadow-sm shadow-slate-300/50">
                  <Apple className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-muted-foreground leading-tight">{t('welcome.download_ios')}</p>
                  <p className="text-sm font-bold text-foreground leading-tight">{t('welcome.ios')}</p>
                </div>
              </button>
            </div>
            {canInstall && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-xs text-[#1E40AF] dark:text-blue-400 font-medium flex items-center gap-1.5"
              >
                <Check className="w-3 h-3" />
                {t('welcome.install_ready')}
              </motion.p>
            )}
          </motion.div>
        )}

        {/* ── Nos Services Carousel ───────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#1E40AF]" />
            {t('welcome.services')}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-none">
            {services.map((service, index) => {
              const Icon = service.icon;
              const colors = colorMap[service.color];
              return (
                <motion.div
                  key={service.titleKey}
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card
                    className={`min-w-[150px] max-w-[160px] shrink-0 ${colors.border} bg-card hover:shadow-lg hover:scale-[1.03] transition-all duration-300 cursor-default group`}
                  >
                    <CardContent className="p-3.5">
                      <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-4.5 h-4.5 ${colors.icon}`} />
                      </div>
                      <p className="text-xs font-bold text-foreground leading-snug">
                        {t(service.titleKey)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                        {t(service.descKey)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Pourquoi TRAIT ? Features Grid ──────────────────────── */}
        <motion.div variants={itemVariants}>
          <motion.h2
            variants={sectionHeaderVariants}
            className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"
          >
            <Shield className="w-4 h-4 text-[#1E40AF]" />
            {t('welcome.features')}
          </motion.h2>
          <motion.div
            variants={staggerGridVariants}
            className="grid grid-cols-2 gap-3"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              const colors = colorMap[feature.color];
              return (
                <motion.div
                  key={feature.titleKey}
                  variants={gridItemVariants}
                  whileHover={{ y: -4, transition: { duration: 0.25 } }}
                >
                  <Card className="h-full bg-white dark:bg-card border border-border/60 hover:border-[#1E40AF]/30 dark:hover:border-blue-700/40 hover:shadow-xl hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-all duration-300 cursor-default group overflow-hidden relative">
                    {/* Subtle gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-50/50 dark:to-blue-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <CardContent className="p-4 relative z-10">
                      <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-5 h-5 ${colors.icon}`} />
                      </div>
                      <p className="text-xs font-bold text-foreground leading-snug mb-1">
                        {t(feature.titleKey)}
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {t(feature.descKey)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* ── Nouveautés News Section ─────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <motion.h2
            variants={sectionHeaderVariants}
            className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"
          >
            <Bell className="w-4 h-4 text-amber-500" />
            {t('welcome.news_title')}
          </motion.h2>
          <div className="space-y-2.5">
            {newsItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.textKey}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-center gap-3 bg-white dark:bg-card border border-border/60 rounded-xl p-3.5 hover:shadow-md hover:border-amber-200/60 dark:hover:border-amber-800/30 transition-all duration-200 cursor-default group">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-xs font-semibold text-foreground leading-snug flex-1">
                      {t(item.textKey)}
                    </p>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                  </div>
                </motion.div>
              );
            })}
          </div>
          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {newsItems.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  index === 0
                    ? 'bg-amber-500 w-4'
                    : 'bg-amber-200 dark:bg-amber-800'
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Télécharger l'application Download Section ──────────── */}
        {!isStandalone && !isInstalled && (
          <motion.div variants={itemVariants}>
            <motion.h2
              variants={sectionHeaderVariants}
              className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-[#1E40AF]" />
              {t('welcome.download_title')}
            </motion.h2>
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.25 }}
              className="relative rounded-2xl overflow-hidden shadow-lg shadow-blue-100/50 dark:shadow-blue-900/20"
            >
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1E40AF] via-[#2563EB] to-[#1E3A8A]" />
              {/* Decorative circles */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
              <div className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full bg-white/5" />

              <div className="relative z-10 p-5">
                <p className="text-white/80 text-xs font-medium mb-0.5">
                  {t('welcome.download_subtitle')}
                </p>
                <p className="text-white text-lg font-bold mb-4">
                  TRAIT
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Android */}
                  <button
                    onClick={handleAndroidInstall}
                    disabled={installing}
                    className="flex items-center gap-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-xl p-3 active:scale-[0.97] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      {installing ? (
                        <Loader2 className="w-4.5 h-4.5 text-white animate-spin" />
                      ) : (
                        <Smartphone className="w-4.5 h-4.5 text-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] text-white/70 leading-tight">{t('welcome.download_android')}</p>
                      <p className="text-xs font-bold text-white leading-tight">
                        {installing ? t('welcome.installing') : t('welcome.android')}
                      </p>
                    </div>
                  </button>

                  {/* iOS */}
                  <button
                    onClick={handleIOSInstall}
                    className="flex items-center gap-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-xl p-3 active:scale-[0.97] transition-all duration-200 cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <Apple className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] text-white/70 leading-tight">{t('welcome.download_ios')}</p>
                      <p className="text-xs font-bold text-white leading-tight">{t('welcome.ios')}</p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── Info Banner ──────────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <div className="flex items-start gap-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/50 p-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-4 h-4 text-[#1E40AF] dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1E40AF] dark:text-blue-300 mb-1">
                {t('welcome.good_to_know')}
              </p>
              <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed">
                {t('welcome.good_to_know_text')}
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <motion.footer
        variants={itemVariants}
        className="mt-auto border-t border-border/50 py-5 px-5 text-center"
      >
        <p className="text-xs text-muted-foreground">
          {t('welcome.footer')}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">v1.0.0</p>
      </motion.footer>
    </motion.div>
  );
}
