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
  Smartphone,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';

export default function SettingsScreen() {
  const { goBack, user, logout, navigateTo, isDarkMode, toggleTheme } =
    useAppStore();

  const handleLogout = () => {
    logout();
    toast.success('Déconnecté avec succès');
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
          icon: Download,
          label: 'Installer l\'application',
          value: 'PWA',
          action: () => toast.info('Ajoutez l\'application à votre écran d\'accueil'),
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
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {user?.name || user?.pseudo || 'Utilisateur'}
                  </h3>
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

              <Button
                variant="outline"
                className="w-full mt-4 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                onClick={() => navigateTo('profile')}
              >
                Modifier le profil
                <ChevronRight className="size-4 ml-auto" />
              </Button>
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
                      <button
                        onClick={item.action}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Icon className="size-4 text-muted-foreground" />
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
                            <span className="text-sm text-muted-foreground mr-1">
                              {item.value}
                            </span>
                          )}
                        {item.value !== 'toggle' && item.value !== 'darkMode' && (
                          <ChevronRight className="size-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        ))}

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
    </div>
  );
}
