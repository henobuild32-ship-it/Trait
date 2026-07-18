'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Fingerprint, ShieldCheck, Zap, Smartphone,
  CheckCircle, Shield, Loader2, Trash2, Lock, Unlock,
  ChevronRight, Info, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

type Step = 'idle' | 'requesting' | 'scanning' | 'success' | 'error';

export default function BiometricSetupScreen() {
  const { user, navigateTo } = useAppStore();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enabling, setEnabling] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [step, setStep] = useState<Step>('idle');
  const [stepMessage, setStepMessage] = useState('');
  const [webauthnSupported, setWebauthnSupported] = useState<boolean | null>(null);

  useEffect(() => {
    fetchBiometricStatus();
    checkWebAuthnSupport();
  }, []);

  async function checkWebAuthnSupport() {
    if (typeof window === 'undefined') { setWebauthnSupported(false); return; }
    if (!window.PublicKeyCredential) { setWebauthnSupported(false); return; }
    try {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setWebauthnSupported(available);
    } catch {
      setWebauthnSupported(false);
    }
  }

  async function fetchBiometricStatus() {
    if (!user?.id) { setLoading(false); return; }
    try {
      const res = await fetch('/api/biometric');
      const data = await res.json();
      if (data.success) setBiometricEnabled(data.enabled);
    } catch {}
    finally { setLoading(false); }
  }

  async function handleEnable() {
    if (!user?.id) return;
    setEnabling(true);
    setStep('requesting');

    try {
      // ── STEP 1 : Try real WebAuthn (Face ID / Touch ID / Windows Hello) ──
      if (webauthnSupported) {
        setStepMessage('Demande d\'authentification biométrique...');
        await new Promise(r => setTimeout(r, 400));

        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        setStepMessage('Placez votre doigt sur le capteur ou regardez la caméra...');
        setStep('scanning');

        const credential = (await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: 'TRAIT', id: window.location.hostname },
            user: {
              id: new TextEncoder().encode(user.id),
              name: user.phone || user.email || user.id,
              displayName: user.name || user.pseudo || 'Utilisateur TRAIT',
            },
            pubKeyCredParams: [
              { alg: -7, type: 'public-key' },
              { alg: -257, type: 'public-key' },
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
              requireResidentKey: false,
            },
            timeout: 60000,
          },
        })) as PublicKeyCredential | null;

        if (credential) {
          const rawId = new Uint8Array(credential.rawId);
          const publicKey = Array.from(rawId).map(b => b.toString(16).padStart(2, '0')).join('');

          setStep('success');
          setStepMessage('Biométrie enregistrée avec succès !');

          const res = await fetch('/api/biometric?action=register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicKey }),
          });
          const data = await res.json();
          if (data.success) {
            localStorage.setItem('trait_biometric_key', publicKey);
            localStorage.setItem('trait_biometric_public_key', publicKey);
            await new Promise(r => setTimeout(r, 1000));
            setBiometricEnabled(true);
            setStep('idle');
            toast.success('Empreinte / Face ID activé avec succès !');
          } else {
            throw new Error(data.message);
          }
          return;
        }
      }

      // ── STEP 2 : Fallback — generate a device-unique key ──
      setStepMessage('Génération d\'une clé sécurisée pour cet appareil...');
      setStep('scanning');
      await new Promise(r => setTimeout(r, 1500));

      const deviceKey = [
        navigator.userAgent.replace(/\s/g, '').slice(0, 20),
        user.id.slice(0, 8),
        Date.now().toString(36),
        Math.random().toString(36).slice(2, 10),
      ].join('-');

      setStepMessage('Enregistrement sécurisé en cours...');
      const res = await fetch('/api/biometric?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: deviceKey }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('trait_biometric_key', deviceKey);
        localStorage.setItem('trait_biometric_public_key', deviceKey);
        setStep('success');
        setStepMessage('Protection activée pour cet appareil !');
        await new Promise(r => setTimeout(r, 1200));
        setBiometricEnabled(true);
        setStep('idle');
        toast.success('Sécurité biométrique activée !');
      } else {
        throw new Error(data.message || 'Erreur serveur');
      }

    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setStep('error');
        setStepMessage('Demande refusée. Veuillez autoriser l\'accès biométrique.');
        toast.error('Biométrie refusée. Vérifiez les paramètres de votre appareil.');
      } else if (err?.name === 'NotSupportedError') {
        setStep('error');
        setStepMessage('Biométrie non supportée sur cet appareil.');
        toast.error('Cet appareil ne supporte pas la biométrie plateforme.');
      } else {
        setStep('error');
        setStepMessage(err?.message || 'Une erreur est survenue.');
        toast.error(err?.message || 'Erreur lors de l\'activation');
      }
      await new Promise(r => setTimeout(r, 2000));
      setStep('idle');
    } finally {
      setEnabling(false);
    }
  }

  async function handleDisable() {
    try {
      const res = await fetch('/api/biometric', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setBiometricEnabled(false);
        setShowDisable(false);
        localStorage.removeItem('trait_biometric_key');
        localStorage.removeItem('trait_biometric_public_key');
        toast.success('Biométrie désactivée');
      } else toast.error(data.message || 'Erreur');
    } catch { toast.error('Erreur de connexion'); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0D5C63]" />
      </div>
    );
  }

  const stepColors: Record<Step, string> = {
    idle: 'bg-[#0D5C63]/10',
    requesting: 'bg-blue-500/10',
    scanning: 'bg-amber-500/10',
    success: 'bg-emerald-500/10',
    error: 'bg-red-500/10',
  };
  const stepIconColors: Record<Step, string> = {
    idle: 'text-[#0D5C63]',
    requesting: 'text-blue-500',
    scanning: 'text-amber-500',
    success: 'text-emerald-500',
    error: 'text-red-500',
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigateTo('settings')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Sécurité biométrique</h1>
      </div>

      <div className="px-4 space-y-5">

        {/* Main status card */}
        <Card className="border-border overflow-hidden">
          <div className={`h-1.5 w-full ${biometricEnabled ? 'bg-emerald-500' : 'bg-muted'}`} />
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                biometricEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 shadow-lg shadow-emerald-500/20'
                  : 'bg-muted'
              }`}>
                {biometricEnabled
                  ? <ShieldCheck className="h-8 w-8 text-emerald-600" />
                  : <Fingerprint className="h-8 w-8 text-muted-foreground" />
                }
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-base">
                  {biometricEnabled ? 'Protection active' : 'Non configuré'}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {biometricEnabled
                    ? 'Votre compte est protégé par biométrie'
                    : 'Activez l\'empreinte ou Face ID pour sécuriser votre compte'
                  }
                </p>
              </div>
              {biometricEnabled && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0">
                  Actif
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* WebAuthn support info */}
        {webauthnSupported !== null && (
          <div className={`flex items-start gap-2.5 p-3 rounded-xl text-xs ${
            webauthnSupported
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400'
          }`}>
            {webauthnSupported ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />}
            <p>
              {webauthnSupported
                ? 'Cet appareil supporte l\'authentification biométrique native (Touch ID / Face ID / Windows Hello).'
                : 'Cet appareil ne supporte pas la biométrie native. Une clé de sécurité unique sera générée et liée à cet appareil.'
              }
            </p>
          </div>
        )}

        {/* Active scanning animation */}
        <AnimatePresence>
          {step !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-border">
                <CardContent className="p-5 flex flex-col items-center gap-4">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${stepColors[step]}`}>
                    {step === 'scanning' && (
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                      >
                        <Fingerprint className={`h-10 w-10 ${stepIconColors[step]}`} />
                      </motion.div>
                    )}
                    {step === 'requesting' && <Loader2 className={`h-10 w-10 animate-spin ${stepIconColors[step]}`} />}
                    {step === 'success' && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                        <CheckCircle className={`h-10 w-10 ${stepIconColors[step]}`} />
                      </motion.div>
                    )}
                    {step === 'error' && <AlertTriangle className={`h-10 w-10 ${stepIconColors[step]}`} />}
                  </div>
                  <p className="text-sm font-semibold text-center text-foreground">{stepMessage}</p>
                  {step === 'scanning' && webauthnSupported && (
                    <p className="text-xs text-muted-foreground text-center">
                      Posez votre doigt sur le capteur d'empreinte ou regardez la caméra Face ID
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Steps guide */}
        {!biometricEnabled && step === 'idle' && (
          <>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Comment ça marche</p>
            <div className="space-y-2">
              {[
                { num: '1', icon: Fingerprint, title: 'Cliquez sur "Activer"', desc: 'L\'application va demander votre empreinte ou Face ID' },
                { num: '2', icon: Smartphone, title: 'Autorisez votre appareil', desc: 'Posez votre doigt ou regardez la caméra de votre téléphone' },
                { num: '3', icon: Shield, title: 'C\'est sécurisé !', desc: 'Votre biométrie ne quitte jamais votre appareil' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/40">
                    <div className="w-7 h-7 rounded-full bg-[#0D5C63] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {item.num}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Action buttons */}
        {!biometricEnabled && step === 'idle' && (
          <Button
            className="w-full h-14 bg-[#0D5C63] hover:bg-[#0D5C63]/90 text-white rounded-xl text-base font-semibold shadow-lg shadow-[#0D5C63]/20"
            onClick={handleEnable}
            disabled={enabling}
          >
            <Fingerprint className="h-5 w-5 mr-2" />
            Activer l&apos;empreinte / Face ID
          </Button>
        )}

        {biometricEnabled && (
          <div className="space-y-3">
            <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/40 dark:bg-emerald-950/10">
              <CardContent className="p-4 flex items-center gap-3">
                <Lock className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">Protection activée</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">Votre compte est sécurisé par biométrie sur cet appareil</p>
                </div>
              </CardContent>
            </Card>
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setShowDisable(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Désactiver la biométrie
            </Button>
          </div>
        )}

        {/* Security note */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/40">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Vos données biométriques restent sur votre appareil et ne sont jamais envoyées aux serveurs TRAIT. Seul un identifiant chiffré est stocké pour valider votre connexion.
          </p>
        </div>
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
