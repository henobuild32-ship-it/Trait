'use client';

import { motion } from 'framer-motion';
import { Send, ArrowLeftRight, Store, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-emerald-50/30 to-white">
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm flex flex-col items-center gap-8"
        >
          {/* Logo */}
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-4">
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-200 flex items-center justify-center overflow-hidden">
              <img
                src="/trait-logo.png"
                alt="Trait Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Trait</h1>
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
          <motion.div variants={itemVariants} className="w-full mt-2 flex flex-col gap-3">
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
        </motion.div>
      </main>

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
