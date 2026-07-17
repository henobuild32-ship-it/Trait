'use client'

import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Send, Phone, Store, Code, ArrowLeftRight, ShoppingBag,
  Smartphone, Apple, Check, Bell, Globe, Headphones,
  Loader2, Shield, Zap, Users, ChevronRight, Gift,
  Wallet, MessageCircle, ArrowRight, Lock, CreditCard,
  BarChart3, Star, TrendingUp, Sparkles, Landmark, Banknote,
  QrCode, Repeat, X, Download,
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { useTranslation, languageNames, languages, type Language } from '@/lib/i18n'
import { toast } from 'sonner'

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function StepItem({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-[#0D5C63]/10 dark:bg-[#0D5C63]/30 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-sm font-bold text-[#0D5C63] dark:text-emerald-400">{number}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

const services = [
  { icon: Send, titleKey: 'welcome.services.transfers', descKey: 'welcome.services.transfers_desc' },
  { icon: Phone, titleKey: 'welcome.services.mobile_money', descKey: 'welcome.services.mobile_money_desc' },
  { icon: Store, titleKey: 'welcome.services.merchant', descKey: 'welcome.services.merchant_desc' },
  { icon: Code, titleKey: 'welcome.services.api', descKey: 'welcome.services.api_desc' },
  { icon: ArrowLeftRight, titleKey: 'welcome.services.barter', descKey: 'welcome.services.barter_desc' },
  { icon: ShoppingBag, titleKey: 'welcome.services.marketplace', descKey: 'welcome.services.marketplace_desc' },
]

const features = [
  { icon: Shield, titleKey: 'welcome.feature_secure', descKey: 'welcome.feature_secure_desc' },
  { icon: Zap, titleKey: 'welcome.feature_fast', descKey: 'welcome.feature_fast_desc' },
  { icon: Gift, titleKey: 'welcome.feature_bonus', descKey: 'welcome.feature_bonus_desc' },
  { icon: Wallet, titleKey: 'welcome.feature_multi', descKey: 'welcome.feature_multi_desc' },
]

const stats = [
  { value: '50+', labelKey: 'welcome.stats_countries', icon: Globe },
  { value: '0,7%', labelKey: 'welcome.stats_fees', icon: Zap },
  { value: '10$', labelKey: 'welcome.stats_bonus', icon: Gift },
  { value: '99,9%', labelKey: 'Taux de disponibilité', icon: TrendingUp },
]

export default function WelcomeScreen() {
  const navigateTo = useAppStore((s) => s.navigateTo)
  const setSelectedRole = useAppStore((s) => s.setSelectedRole)
  const { canInstall, isInstalled, isStandalone, installApp } = usePWAInstall()
  const { t, language, setLanguage } = useTranslation()
  const [installing, setInstalling] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [installPlatform, setInstallPlatform] = useState<'android' | 'ios'>('android')

  const handleAndroidInstall = async () => {
    if (canInstall) {
      setInstalling(true)
      const success = await installApp()
      setInstalling(false)
      if (success) {
        toast.success(t('welcome.install_success'))
      } else {
        setInstallPlatform('android')
        setShowInstallModal(true)
      }
    } else {
      setInstallPlatform('android')
      setShowInstallModal(true)
    }
  }

  const handleIOSInstall = () => {
    setInstallPlatform('ios')
    setShowInstallModal(true)
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-[#0D5C63]/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0D5C63] flex items-center justify-center">
              <span className="text-white text-xs font-black">T</span>
            </div>
            <span className="text-sm font-bold text-foreground">TRAIT</span>
          </div>
          <div className="flex items-center gap-1">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  language === lang
                    ? 'bg-[#0D5C63] text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <main className="pb-16">
          {/* ── Hero ── */}
          <section className="pt-12 sm:pt-20 pb-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className="absolute -inset-4 rounded-2xl bg-[#0D5C63]/10 blur-xl" />
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#0D5C63] to-[#14888F] p-1 shadow-2xl">
                  <div className="w-full h-full rounded-xl bg-white flex items-center justify-center">
                    <Image
                      src="/trait-logo.png"
                      alt="TRAIT"
                      width={80}
                      height={80}
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground leading-tight mb-4"
            >
              {t('welcome.hero_headline')}
              <br />
              <span className="bg-gradient-to-r from-[#0D5C63] via-[#14888F] to-blue-500 bg-clip-text text-transparent">
                {t('welcome.hero_headline2')}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto mb-6"
            >
              {t('welcome.hero_desc')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap items-center justify-center gap-2 mb-8"
            >
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Zap className="w-3 h-3 mr-1" />0,7% frais
              </Badge>
              <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                <Gift className="w-3 h-3 mr-1" />10$ bonus
              </Badge>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
                <Shield className="w-3 h-3 mr-1" />Sécurisé
              </Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4"
            >
              <Button
                onClick={() => navigateTo('auth', { mode: 'register' })}
                className="w-full sm:w-auto px-8 h-12 text-sm font-bold bg-[#0D5C63] hover:bg-[#083A3E] text-white rounded-xl shadow-lg shadow-[#0D5C63]/25 transition-all active:scale-[0.98] group"
              >
                <Users className="w-4 h-4 mr-2" />
                {t('welcome.signup')}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button
                onClick={() => navigateTo('auth', { mode: 'login' })}
                variant="outline"
                className="w-full sm:w-auto px-8 h-12 text-sm font-bold border-2 border-[#0D5C63]/20 text-[#0D5C63] rounded-xl hover:bg-[#0D5C63]/5 active:scale-[0.98]"
              >
                {t('welcome.login')}
              </Button>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              onClick={() => navigateTo('seller-register')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/20 border border-pink-200/60 dark:border-pink-800/30 text-pink-700 dark:text-pink-300 text-sm font-semibold hover:border-pink-300 dark:hover:border-pink-700 transition-all cursor-pointer group"
            >
              <Store className="w-4 h-4" />
              Devenir un fournisseur de services
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
          </section>

          {/* ── Stats ── */}
          <AnimatedSection>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
              {stats.map((stat) => (
                <div key={stat.labelKey} className="rounded-xl bg-card border border-border/50 p-4 text-center hover:border-[#0D5C63]/20 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-[#0D5C63]/10 dark:bg-[#0D5C63]/20 flex items-center justify-center mx-auto mb-2">
                    <stat.icon className="w-5 h-5 text-[#0D5C63]" />
                  </div>
                  <p className="text-xl font-black text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.labelKey}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>

          {/* ── Services ── */}
          <AnimatedSection>
            <div className="mb-12">
              <h2 className="text-lg font-bold text-foreground mb-4">
                {t('welcome.feature_cards_title')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {services.map((service) => {
                  const Icon = service.icon
                  return (
                    <div key={service.titleKey} className="rounded-xl bg-card border border-border/50 p-4 text-center hover:border-[#0D5C63]/20 hover:shadow-sm transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-[#0D5C63]/10 dark:bg-[#0D5C63]/20 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5 text-[#0D5C63]" />
                      </div>
                      <p className="text-xs font-semibold text-foreground mb-0.5">{t(service.titleKey)}</p>
                      <p className="text-[10px] text-muted-foreground">{t(service.descKey)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </AnimatedSection>

          {/* ── Features ── */}
          <AnimatedSection>
            <div className="mb-12">
              <h2 className="text-lg font-bold text-foreground mb-4">{t('welcome.features')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <div key={feature.titleKey} className="rounded-xl bg-card border border-border/50 p-5 hover:border-[#0D5C63]/20 hover:shadow-sm transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-[#0D5C63]/10 dark:bg-[#0D5C63]/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5 text-[#0D5C63]" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">{t(feature.titleKey)}</h3>
                      <p className="text-xs text-muted-foreground">{t(feature.descKey)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </AnimatedSection>

          {/* ── Security Banner ── */}
          <AnimatedSection>
            <div className="relative rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-6 sm:p-8 mb-12 overflow-hidden">
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/20 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-blue-300" />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">{t('welcome.trust_title')}</h2>
                <p className="text-sm text-blue-200/70 max-w-md mx-auto">{t('welcome.trust_desc')}</p>
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-blue-300/60">
                  <span className="flex items-center gap-1"><Lock className="w-3 h-3" />SSL/TLS</span>
                  <span className="w-px h-3 bg-blue-400/20" />
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" />JWT</span>
                  <span className="w-px h-3 bg-blue-400/20" />
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" />E2E</span>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* ── Navigation Cards ── */}
          <AnimatedSection>
            <div className="space-y-2 mb-12">
              <button onClick={() => navigateTo('agent-register')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-50/50 dark:from-amber-950/30 dark:to-transparent border border-amber-200 dark:border-amber-800/30 text-amber-800 dark:text-amber-300 font-semibold text-sm hover:shadow-md transition-all cursor-pointer group">
                <span className="flex items-center gap-3"><Shield className="w-5 h-5" />{t('welcome.agent')}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button onClick={() => navigateTo('developer-register')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-100 to-slate-100/50 dark:from-slate-800/50 dark:to-transparent border border-slate-200 dark:border-slate-700/30 text-foreground font-semibold text-sm hover:shadow-md transition-all cursor-pointer group">
                <span className="flex items-center gap-3"><Code className="w-5 h-5" />{t('welcome.developer')}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button onClick={() => navigateTo('support')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 text-muted-foreground font-medium text-sm hover:text-foreground hover:border-border transition-all cursor-pointer group">
                <span className="flex items-center gap-3"><Headphones className="w-5 h-5" />{t('welcome.support')}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </AnimatedSection>

          {/* ── News ── */}
          <AnimatedSection>
            <div className="mb-12">
              <h2 className="text-lg font-bold text-foreground mb-4">{t('welcome.news_title')}</h2>
              {[
                { icon: Globe, textKey: 'welcome.news_1' },
                { icon: Code, textKey: 'welcome.news_2' },
                { icon: Users, textKey: 'welcome.news_3' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.textKey} className="flex items-center gap-3 rounded-xl bg-card border border-border/50 p-3.5 mb-2 hover:border-[#0D5C63]/20 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-[#0D5C63]/10 dark:bg-[#0D5C63]/20 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#0D5C63]" />
                    </div>
                    <p className="text-xs text-foreground flex-1">{t(item.textKey)}</p>
                  </div>
                )
              })}
            </div>
          </AnimatedSection>

          {/* ── PWA Install ── */}
          {!isStandalone && !isInstalled && (
            <AnimatedSection>
              <div className="mb-12">
                <h2 className="text-lg font-bold text-foreground mb-4">{t('welcome.download_title')}</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleAndroidInstall} disabled={installing}
                    className="rounded-xl bg-card border border-border/50 p-5 text-center hover:border-[#0D5C63]/30 transition-all hover:shadow-sm cursor-pointer disabled:opacity-50 group">
                    <div className="w-12 h-12 rounded-xl bg-[#0D5C63] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      {installing ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Smartphone className="w-6 h-6 text-white" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{t('welcome.download_android')}</p>
                    <p className="text-sm font-bold text-foreground">{installing ? t('welcome.installing') : t('welcome.android')}</p>
                  </button>
                  <button onClick={handleIOSInstall}
                    className="rounded-xl bg-card border border-border/50 p-5 text-center hover:border-slate-300 dark:hover:border-slate-600 transition-all hover:shadow-sm cursor-pointer group">
                    <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Apple className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-xs text-muted-foreground">{t('welcome.download_ios')}</p>
                    <p className="text-sm font-bold text-foreground">{t('welcome.ios')}</p>
                  </button>
                </div>
                {canInstall && (
                  <p className="mt-3 text-xs text-[#0D5C63] font-medium text-center flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" />{t('welcome.install_ready')}
                  </p>
                )}
                <a href="/downloads/trait.apk" download="TRAIT-v2.0.0.apk"
                  className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#0D5C63] hover:underline font-medium">
                  <Download className="w-3 h-3" />Télécharger l'APK directement
                </a>
              </div>
            </AnimatedSection>
          )}

          {/* ── Info Banner ── */}
          <AnimatedSection>
            <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/15 border border-blue-100 dark:border-blue-900/40 p-4 mb-8">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-[#0D5C63]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0D5C63] mb-1">{t('welcome.good_to_know')}</p>
                <p className="text-xs text-blue-700/80 dark:text-blue-400/70">{t('welcome.good_to_know_text')}</p>
              </div>
            </div>
          </AnimatedSection>

          {/* ── CTA ── */}
          <AnimatedSection>
            <div className="relative rounded-2xl bg-gradient-to-br from-[#0D5C63] via-[#14888F] to-[#0D5C63] p-6 sm:p-8 text-center overflow-hidden">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
              <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-white/5" />
              <div className="relative">
                <h2 className="text-xl sm:text-2xl font-black text-white mb-2">{t('welcome.cta_title')}</h2>
                <p className="text-sm text-white/80 max-w-sm mx-auto mb-6">{t('welcome.cta_desc')}</p>
                <Button
                  onClick={() => navigateTo('auth', { mode: 'register' })}
                  className="bg-white hover:bg-white/90 text-[#0D5C63] font-bold rounded-xl shadow-xl h-12 px-8 transition-all active:scale-[0.98] group"
                >
                  {t('welcome.cta_button')}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </div>
          </AnimatedSection>

        </main>

        {/* ── Install Modal ── */}
        <AnimatePresence>
          {showInstallModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setShowInstallModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${installPlatform === 'android' ? 'bg-[#0D5C63]' : 'bg-slate-700'}`}>
                      {installPlatform === 'android' ? <Smartphone className="w-5 h-5 text-white" /> : <Apple className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {installPlatform === 'android' ? t('welcome.android_install_title') : t('welcome.ios_install_title')}
                      </h3>
                    </div>
                  </div>
                  <button onClick={() => setShowInstallModal(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/50 transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {installPlatform === 'android' ? (
                    <>
                      <StepItem number={1}>
                        <p className="text-sm font-semibold text-foreground">{t('welcome.android_step_1_title')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('welcome.android_step_1_desc')}</p>
                      </StepItem>
                      <StepItem number={2}>
                        <p className="text-sm font-semibold text-foreground">{t('welcome.android_step_2_title')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('welcome.android_step_2_desc')}</p>
                      </StepItem>
                      <StepItem number={3}>
                        <p className="text-sm font-semibold text-foreground">{t('welcome.android_step_3_title')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('welcome.android_step_3_desc')}</p>
                      </StepItem>
                      <StepItem number={4}>
                        <p className="text-sm font-semibold text-foreground">{t('welcome.android_step_4_title')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('welcome.android_step_4_desc')}</p>
                      </StepItem>
                    </>
                  ) : (
                    <>
                      <StepItem number={1}>
                        <p className="text-sm font-semibold text-foreground">{t('welcome.ios_step_1_title')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('welcome.ios_step_1_desc')}</p>
                      </StepItem>
                      <StepItem number={2}>
                        <p className="text-sm font-semibold text-foreground">{t('welcome.ios_step_2_title')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('welcome.ios_step_2_desc')}</p>
                      </StepItem>
                      <StepItem number={3}>
                        <p className="text-sm font-semibold text-foreground">{t('welcome.ios_step_3_title')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('welcome.ios_step_3_desc')}</p>
                      </StepItem>
                    </>
                  )}
                </div>

                <a href="/downloads/trait.apk" download="TRAIT-v2.0.0.apk"
                  className="mt-5 flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-[#0D5C63] text-white text-sm font-semibold hover:bg-[#083A3E] transition-colors">
                  <Download className="w-4 h-4" />Télécharger l'APK
                </a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
