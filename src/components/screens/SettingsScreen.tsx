'use client';

import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Shield,
  Moon,
  Globe,
  Download,
  Info,
  LogOut,
  ChevronRight,
  Lock,
  LayoutDashboard,
  GraduationCap,
  BadgeCheck,
  Check,
  Smartphone,
  Apple,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useState } from 'react';

function AndroidGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Installer sur Android</h3>
            <p className="text-xs text-gray-500">Suivez ces étapes simples</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          {[
            { step: '1', title: 'Ouvrir dans Chrome', desc: 'Utilisez le navigateur Google Chrome sur votre téléphone' },
            { step: '2', title: 'Appuyez sur le menu', desc: 'Touchez les trois points (⋮) en haut à droite de Chrome' },
            { step: '3', title: '"Installer l\'application"', desc: 'Sélectionnez "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"' },
            { step: '4', title: 'Confirmez', desc: 'Appuyez sur "Installer" — l\'app sera sur votre écran d\'accueil' },
          ].map((item) => (
            <div key={item.step} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-bold text-emerald-700">{item.step}</span>
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={onClose}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl cursor-pointer"
        >
          Compris !
        </Button>
      </motion.div>
    </motion.div>
  );
}

function IOSGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
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
          {[
            { step: '1', title: 'Ouvrir dans Safari', desc: 'Copiez le lien et ouvrez-le dans Safari' },
            { step: '2', title: 'Icône Partager', desc: 'Appuyez sur le bouton partage en bas de Safari' },
            { step: '3', title: '"Sur l\'écran d\'accueil"', desc: 'Faites défiler et sélectionnez cette option' },
            { step: '4', title: 'Touchez "Ajouter"', desc: 'Confirmez en haut à droite' },
          ].map((item) => (
            <div key={item.step} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-bold text-emerald-700">{item.step}</span>
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={onClose}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl cursor-pointer"
        >
          Compris !
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default function SettingsScreen() {
  const { goBack, user, logout, navigateTo, isDarkMode, toggleTheme } =
    useAppStore();
  const { canInstall, isIOS, isInstalled, isStandalone, installApp } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  const isAgent = user?.role === 'agent';

  const handleLogout = () => {
    logout();
    toast.success('Déconnecté avec succès');
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    setInstalling(true);
    const success = await installApp();
    setInstalling(false);
    if (success) {
      toast.success('Application installée avec succès !');
    } else {
      // Native install not available — show manual guide
      setShowAndroidGuide(true);
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.pseudo?.[0].toUpperCase() || '?';

  const settingsItems = [
    {
      section: 'Sécurité',
      items: [
        {
          icon: Lock,
          label: 'Changer le code PIN',
          value: null,
          action: () => toast.info('Fonctionnalité à venir'),
        },
        {
          icon: Shield,
          label: 'Activer l\'authentification 2FA',
          value: 'toggle',
          action: () => toast.info('Fonctionnalité à venir'),
        },
      ],
    },
    {
      section: 'Application',
      items: [
        {
          icon: Moon,
          label: 'Mode sombre',
          value: 'darkMode',
          action: toggleTheme,
        },
        {
          icon: Globe,
          label: 'Langue',
          value: 'Français',
          action: () => toast.info('Langue par défaut : Français'),
        },
        {
          icon: GraduationCap,
          label: 'Voir le tutoriel',
          value: null,
          action: () => navigateTo('onboarding'),
        },
        {
          icon: Download,
          label: 'Télécharger l\'application',
          value: (isInstalled || isStandalone) ? 'Installée' : 'PWA',
          action: handleInstall,
          badge: !(isInstalled || isStandalone),
        },
        {
          icon: Info,
          label: 'À propos de Trait',
          value: 'v1.0',
          action: () =>
            toast.info('Trait v1.0 — Votre partenaire financier digital'),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-lg font-semibold">Paramètres</h1>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 space-y-5 pb-8">
        {/* Profile section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 ${
                  isAgent
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                    : 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                }`}>
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg truncate">
                      {user?.name || user?.pseudo || 'Utilisateur'}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {user?.phone || 'Non défini'}
                  </p>
                  {user?.pseudo && (
                    <p className="text-sm text-muted-foreground">
                      @{user.pseudo}
                    </p>
                  )}
                </div>
              </div>

              {/* Agent code display */}
              {isAgent && user?.agentCode && (
                <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <BadgeCheck className="size-4 text-amber-600 shrink-0" />
                  <span className="text-sm text-amber-700">Code Agent :</span>
                  <span className="text-sm font-bold font-mono text-amber-800 tracking-wider">
                    {user.agentCode}
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-3 flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  onClick={() => navigateTo('profile')}
                >
                  Modifier le profil
                  <ChevronRight className="size-4 ml-auto" />
                </Button>
                {isAgent && (
                  <Button
                    variant="outline"
                    className="w-full text-amber-700 border-amber-200 hover:bg-amber-50"
                    onClick={() => navigateTo('agent-dashboard')}
                  >
                    <LayoutDashboard className="size-4 mr-2" />
                    Tableau de bord agent
                    <ChevronRight className="size-4 ml-auto" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Settings sections */}
        {settingsItems.map((section, sIndex) => (
          <motion.div
            key={section.section}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + sIndex * 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {section.section}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {section.items.map((item, iIndex) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label}>
                      {iIndex > 0 && <Separator />}
                      <div
                        onClick={item.action}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.action(); } }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left cursor-pointer disabled:opacity-50"
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          item.badge ? 'bg-emerald-100' : 'bg-muted'
                        }`}>
                          <Icon className={`size-4 ${item.badge ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                        </div>
                        <span className="flex-1 text-sm">{item.label}</span>

                        {item.value === 'toggle' && (
                          <Switch
                            onCheckedChange={() => item.action()}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        {item.value === 'darkMode' && (
                          <Switch
                            checked={isDarkMode}
                            onCheckedChange={() => item.action()}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        {item.value &&
                          item.value !== 'toggle' &&
                          item.value !== 'darkMode' && (
                            <span className={`text-sm mr-1 ${
                              item.value === 'Installée' ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'
                            }`}>
                              {item.value}
                            </span>
                          )}
                        {item.value !== 'toggle' && item.value !== 'darkMode' && (
                          <ChevronRight className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Install App Card */}
        {!(isInstalled || isStandalone) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900">Télécharger l&apos;application</h3>
                    <p className="text-xs text-gray-500">Installez Trait sur votre téléphone</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleInstall}
                    disabled={installing}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-xl py-2.5 px-3 hover:bg-emerald-700 active:scale-[0.98] transition-all duration-150 cursor-pointer disabled:opacity-50"
                  >
                    {installing ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <Smartphone className="w-4 h-4" />
                    )}
                    <span className="text-xs font-semibold">
                      {installing ? 'Installation...' : 'Android'}
                    </span>
                  </button>
                  <button
                    onClick={() => setShowIOSGuide(true)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl py-2.5 px-3 hover:bg-gray-800 active:scale-[0.98] transition-all duration-150 cursor-pointer"
                  >
                    <Apple className="w-4 h-4" />
                    <span className="text-xs font-semibold">iOS</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Danger zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-red-200">
            <CardContent className="p-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                Se déconnecter
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Version */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground"
        >
          Trait v1.0.0 — Fait avec ❤️ en Afrique
        </motion.p>
      </div>

      {/* Android Installation Guide Modal */}
      {showAndroidGuide && <AndroidGuideModal onClose={() => setShowAndroidGuide(false)} />}

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && <IOSGuideModal onClose={() => setShowIOSGuide(false)} />}
    </div>
  );
}
