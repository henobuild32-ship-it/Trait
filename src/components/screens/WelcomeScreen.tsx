'use client';

import { motion } from 'framer-motion';
import { Send, ArrowLeftRight, Store, Phone, Download, Smartphone, Apple, Chrome, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useState } from 'react';

const features = [
  {
    icon: Send,
    title: 'Transfert d\'argent',
    description: 'Envoyez de l\'argent instantanément',
  },
  {
    icon: ArrowLeftRight,
    title: 'Troc Digital',
    description: 'Échangez des biens et services',
  },
  {
    icon: Store,
    title: 'Marketplace',
    description: 'Achetez et vendez facilement',
  },
  {
    icon: Phone,
    title: 'USSD Intégré',
    description: 'Accessible sans internet',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

export default function WelcomeScreen() {
  const navigateTo = useAppStore((s) => s.navigateTo);
  const { canInstall, isIOS, isInstalled, isStandalone, installApp } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  const handleAndroidInstall = async () => {
    setInstalling(true);
    await installApp();
    setInstalling(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-emerald-50/30 to-white">
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm flex flex-col items-center gap-6"
        >
          {/* Logo */}
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-3">
            <div className="relative w-full max-w-[220px] rounded-2xl shadow-lg shadow-emerald-200/50 overflow-hidden">
              <img
                src="/icon-1024.png"
                alt="Trait Logo"
                className="w-full h-auto object-contain"
              />
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.p
            variants={itemVariants}
            className="text-center text-lg text-gray-500 font-medium"
          >
            Transfert d&apos;argent, Troc &amp; Marketplace
          </motion.p>

          {/* Feature cards */}
          <motion.div
            variants={itemVariants}
            className="w-full grid grid-cols-2 gap-3"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="bg-white border-emerald-100 hover:border-emerald-200 hover:shadow-md transition-all duration-200 py-4 px-3 gap-3 group"
                >
                  <CardContent className="p-0 flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                      <Icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 leading-tight">
                        {feature.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="w-full flex flex-col gap-3">
            <Button
              onClick={() => navigateTo('auth-login')}
              className="w-full h-13 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200 cursor-pointer"
              size="lg"
            >
              Se connecter
            </Button>
            <Button
              onClick={() => navigateTo('auth-role')}
              variant="outline"
              className="w-full h-13 text-base font-semibold border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl cursor-pointer"
              size="lg"
            >
              Créer un compte
            </Button>
          </motion.div>

          {/* Download / Install App Section */}
          <motion.div
            variants={itemVariants}
            className="w-full mt-2"
          >
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
                  <img src="/trait-logo.png" alt="Trait" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Installer Trait</h3>
                  <p className="text-xs text-gray-400">Application mobile gratuite</p>
                </div>
                {isStandalone && (
                  <div className="ml-auto flex items-center gap-1.5 bg-emerald-500/20 px-2.5 py-1 rounded-full">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">Installée</span>
                  </div>
                )}
              </div>

              {!isStandalone && !isInstalled && (
                <div className="flex gap-2.5">
                  {/* Android Button */}
                  <button
                    onClick={handleAndroidInstall}
                    disabled={installing || (canInstall === false && isIOS)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-900 rounded-xl py-3 px-3 hover:bg-gray-100 active:scale-[0.98] transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <div className="text-left">
                      <p className="text-[10px] text-gray-500 leading-tight">Télécharger sur</p>
                      <p className="text-xs font-bold leading-tight">Android</p>
                    </div>
                  </button>

                  {/* iOS Button */}
                  <button
                    onClick={() => setShowIOSGuide(true)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-900 rounded-xl py-3 px-3 hover:bg-gray-100 active:scale-[0.98] transition-all duration-150 cursor-pointer"
                  >
                    <Apple className="w-4 h-4 text-gray-900" />
                    <div className="text-left">
                      <p className="text-[10px] text-gray-500 leading-tight">Télécharger sur</p>
                      <p className="text-xs font-bold leading-tight">iOS</p>
                    </div>
                  </button>
                </div>
              )}

              <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-500">
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Gratuit</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Hors-ligne</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Rapide</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <Apple className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Installer sur iOS</h3>
                <p className="text-xs text-gray-500">Suivez ces étapes simples</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-emerald-700">1</span>
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-semibold text-gray-800">Ouvrir dans Safari</p>
                  <p className="text-xs text-gray-500 mt-0.5">Copiez le lien et ouvrez-le dans le navigateur Safari</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-emerald-700">2</span>
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-semibold text-gray-800">Touchez l&apos;icône Partager</p>
                  <p className="text-xs text-gray-500 mt-0.5">Appuyez sur le bouton <span className="inline-flex items-center"><svg className="w-3.5 h-3.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></span> en bas de l&apos;écran Safari</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-emerald-700">3</span>
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-semibold text-gray-800">&quot;Sur l&apos;écran d&apos;accueil&quot;</p>
                  <p className="text-xs text-gray-500 mt-0.5">Faites défiler et tapez &quot;Sur l&apos;écran d&apos;accueil&quot;</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-emerald-700">4</span>
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-semibold text-gray-800">Touchez &quot;Ajouter&quot;</p>
                  <p className="text-xs text-gray-500 mt-0.5">Confirmez en haut à droite avec &quot;Ajouter&quot;</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowIOSGuide(false)}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl cursor-pointer"
            >
              Compris !
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="py-6 text-center"
      >
        <p className="text-sm text-gray-400">
          0.7% de frais • Bonus 10 USD • USSD *1709#
        </p>
      </motion.footer>
    </div>
  );
}
