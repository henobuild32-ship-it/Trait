'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Fingerprint,
  ShieldCheck,
  Zap,
  Smartphone,
  CheckCircle,
  Shield,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';

export default function BiometricSetupScreen() {
  const { user, navigateTo } = useAppStore();
  const { t } = useTranslation();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enabling, setEnabling] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  useEffect(() => {
    fetchBiometricStatus();
  }, []);

  async function fetchBiometricStatus() {
    if (!user?.id) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/biometric/status?userId=${user.id}`);
      const data = await res.json();
      if (data.success) setBiometricEnabled(data.enabled);
    } catch {}
    finally { setLoading(false); }
  }

  async function handleEnable() {
    setSimulating(true);
    // Simulate biometric verification
    await new Promise(r => setTimeout(r, 1500));
    setSimulating(false);
    setEnabling(true);

    try {
      const res = await fetch('/api/biometric/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json();
      if (data.success) {
        setBiometricEnabled(true);
        toast.success('Empreinte / Face ID activé !');
      } else toast.error(data.message || 'Erreur');
    } catch { toast.error('Erreur de connexion'); }
    finally { setEnabling(false); }
  }

  async function handleDisable() {
    try {
      const res = await fetch('/api/biometric/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json();
      if (data.success) {
        setBiometricEnabled(false);
        setShowDisable(false);
        toast.success('Empreinte / Face ID désactivé');
      } else toast.error(data.message || 'Erreur');
    } catch { toast.error('Erreur de connexion'); }
  }

  const benefits = [
    { icon: Zap, title: 'Rapide', desc: 'Déverrouillage instantané en une seconde' },
    { icon: ShieldCheck, title: 'Sécurisé', desc: 'Protection par données biométriques uniques' },
    { icon: Smartphone, title: 'Pratique', desc: 'Plus besoin de taper votre code PIN' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0D5C63]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigateTo('settings')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Sécurité biométrique</h1>
      </div>

      <div className="px-4 space-y-6">
        <div className="flex flex-col items-center py-6">
          <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-4 transition-all ${
            biometricEnabled
              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 shadow-lg shadow-emerald-500/20'
              : 'bg-muted text-muted-foreground'
          }`}>
            <Fingerprint className="h-12 w-12" />
          </div>
          {biometricEnabled ? (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-sm px-4 py-1.5">
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Activé
            </Badge>
          ) : (
            <p className="text-sm text-muted-foreground">Non configuré</p>
          )}
        </div>

        {biometricEnabled ? (
          <Card className="border-border">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200">
                <Shield className="h-8 w-8 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">Protection active</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">
                    Vos transactions sont sécurisées par empreinte digitale / Face ID
                  </p>
                </div>
              </div>

              <Button variant="outline" className="w-full h-12 rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setShowDisable(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Désactiver l&apos;empreinte / Face ID
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                    <div className="w-10 h-10 rounded-xl bg-[#0D5C63]/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-[#0D5C63]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{benefit.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{benefit.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {simulating ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-[#0D5C63]/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Fingerprint className="h-8 w-8 text-[#0D5C63]" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Vérification biométrique...</p>
                <p className="text-xs text-muted-foreground">Scannez votre empreinte ou visage</p>
                <div className="mt-4 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#0D5C63]" />
                </div>
              </div>
            ) : (
              <Button className="w-full h-14 bg-[#0D5C63] hover:bg-[#0D5C63]/90 text-white rounded-xl text-base font-semibold"
                onClick={handleEnable} disabled={enabling}>
                {enabling ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Fingerprint className="h-5 w-5 mr-2" />
                )}
                Activer l&apos;empreinte / Face ID
              </Button>
            )}

            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/10">
              <CardContent className="p-4 flex items-start gap-3">
                <Shield className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  Vos données biométriques restent sur votre appareil. Elles ne sont jamais partagées avec les serveurs TRAIT.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <AlertDialog open={showDisable} onOpenChange={setShowDisable}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver la biométrie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous devrez utiliser votre code PIN pour toutes les transactions. Vous pourrez réactiver à tout moment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDisable}>
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
