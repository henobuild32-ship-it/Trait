'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Fingerprint, ShieldCheck, Smartphone,
  CheckCircle, Shield, Loader2, Trash2, Lock,
  Info, CheckCircle2, AlertTriangle, Scan, Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
  const [faceIdEnabled, setFaceIdEnabled] = useState(false);
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enablingType, setEnablingType] = useState<'faceId' | 'fingerprint' | null>(null);
  
  const [step, setStep] = useState<Step>('idle');
  const [stepMessage, setStepMessage] = useState('');
  const [webauthnSupported, setWebauthnSupported] = useState<boolean | null>(null);
  const [showSettingsGuide, setShowSettingsGuide] = useState(false);

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
      if (data.success) {
        setFaceIdEnabled(data.faceIdEnabled);
        setFingerprintEnabled(data.fingerprintEnabled);
      }
    } catch {
      toast.error('Erreur lors du chargement des paramètres biométriques');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(type: 'faceId' | 'fingerprint', checked: boolean) {
    if (!checked) {
      // Disable biometric
      try {
        const res = await fetch(`/api/biometric?type=${type}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          if (type === 'faceId') setFaceIdEnabled(false);
          if (type === 'fingerprint') setFingerprintEnabled(false);
          toast.success(`${type === 'faceId' ? 'Face ID' : 'Empreinte digitale'} désactivé(e)`);
          
          // Clear localStorage if both are disabled
          if (type === 'faceId' && !fingerprintEnabled || type === 'fingerprint' && !faceIdEnabled) {
            localStorage.removeItem('trait_biometric_key');
            localStorage.removeItem('trait_biometric_public_key');
            localStorage.removeItem('trait_biometric_type');
          }
        } else {
          toast.error(data.message || 'Erreur lors de la désactivation');
        }
      } catch {
        toast.error('Erreur de connexion');
      }
      return;
    }

    // Enable biometric
    setEnablingType(type);
    setStep('requesting');
    setStepMessage(`Demande d'activation de ${type === 'faceId' ? 'Face ID' : 'l\'empreinte'}...`);

    try {
      if (!webauthnSupported) {
        // Fallback for unsupported devices - show guide modal
        setStep('error');
        setStepMessage('Authentification plateforme non disponible.');
        setShowSettingsGuide(true);
        setEnablingType(null);
        await new Promise(r => setTimeout(r, 1500));
        setStep('idle');
        return;
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      setStepMessage(type === 'faceId' 
        ? 'Regardez la caméra pour activer Face ID...' 
        : 'Posez votre doigt sur le lecteur d\'empreinte...'
      );
      setStep('scanning');

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'TRAIT', id: window.location.hostname },
          user: {
            id: new TextEncoder().encode(user?.id || 'guest'),
            name: user?.phone || user?.email || 'user',
            displayName: user?.name || 'Utilisateur TRAIT',
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
        setStepMessage('Enregistrement sécurisé...');

        const res = await fetch('/api/biometric?action=register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicKey, type }),
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('trait_biometric_key', publicKey);
          localStorage.setItem('trait_biometric_public_key', publicKey);
          localStorage.setItem('trait_biometric_type', type);
          
          if (type === 'faceId') setFaceIdEnabled(true);
          if (type === 'fingerprint') setFingerprintEnabled(true);
          
          toast.success(`${type === 'faceId' ? 'Face ID' : 'L\'empreinte digitale'} activé avec succès !`);
        } else {
          throw new Error(data.message || 'Erreur lors de l\'enregistrement');
        }
      } else {
        throw new Error('Annulé par l\'utilisateur');
      }
    } catch (err: any) {
      setStep('error');
      if (err?.name === 'NotAllowedError') {
        setStepMessage('Accès annulé ou refusé.');
        toast.error('Activation biométrique annulée.');
      } else {
        setStepMessage(err?.message || 'Erreur de configuration.');
        toast.error(err?.message || 'Erreur d\'activation');
      }
    } finally {
      setEnablingType(null);
      await new Promise(r => setTimeout(r, 1200));
      setStep('idle');
    }
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

  const isAnyBiometricEnabled = faceIdEnabled || fingerprintEnabled;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigateTo('settings')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Sécurité Biométrique</h1>
      </div>

      <div className="px-4 space-y-5">
        {/* Status indicator */}
        <Card className="border-border overflow-hidden">
          <div className={`h-1.5 w-full ${isAnyBiometricEnabled ? 'bg-emerald-500' : 'bg-muted'}`} />
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                isAnyBiometricEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600'
                  : 'bg-muted text-muted-foreground'
              }`}>
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-sm">
                  {isAnyBiometricEnabled ? 'Protection active' : 'Protection désactivée'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isAnyBiometricEnabled
                    ? 'Sécurité renforcée activée sur votre compte'
                    : 'Configurez la biométrie pour sécuriser vos connexions et paiements'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Scan Panel */}
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
                        {enablingType === 'faceId' 
                          ? <Scan className={`h-10 w-10 ${stepIconColors[step]}`} />
                          : <Fingerprint className={`h-10 w-10 ${stepIconColors[step]}`} />
                        }
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
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggles */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Méthodes disponibles</p>
          
          <Card className="border-border">
            <CardContent className="p-4 space-y-4">
              {/* Face ID Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0D5C63]/10 text-[#0D5C63] flex items-center justify-center shrink-0">
                    <Scan className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Face ID</p>
                    <p className="text-xs text-muted-foreground">Reconnaissance faciale</p>
                  </div>
                </div>
                <Switch
                  checked={faceIdEnabled}
                  onCheckedChange={(checked) => handleToggle('faceId', checked)}
                  disabled={enablingType !== null}
                />
              </div>

              <div className="border-t border-border/60" />

              {/* Fingerprint Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0D5C63]/10 text-[#0D5C63] flex items-center justify-center shrink-0">
                    <Fingerprint className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Empreinte digitale</p>
                    <p className="text-xs text-muted-foreground">Scanner d'empreinte</p>
                  </div>
                </div>
                <Switch
                  checked={fingerprintEnabled}
                  onCheckedChange={(checked) => handleToggle('fingerprint', checked)}
                  disabled={enablingType !== null}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info panel */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/40">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Les données de vos clés biométriques restent stockées localement sur la puce de sécurité de votre appareil (Secure Enclave ou Keystore) et ne transitent jamais sur nos serveurs.
          </p>
        </div>
      </div>

      {/* Guide Dialog for unsupported devices */}
      <AlertDialog open={showSettingsGuide} onOpenChange={setShowSettingsGuide}>
        <AlertDialogContent className="mx-4 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-amber-500" />
              Biométrie non configurée
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-left text-foreground">
              <p>Votre appareil ne répond pas aux exigences d'authentification biométrique sécurisée ou aucune donnée n'est configurée.</p>
              <div className="bg-muted p-3 rounded-xl space-y-1.5 text-xs">
                <p className="font-bold">Pour activer la biométrie :</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Ouvrez les <strong>Paramètres</strong> de votre téléphone.</li>
                  <li>Allez dans <strong>Sécurité & Confidentialité</strong> (ou Face ID / Empreinte digitale).</li>
                  <li>Configurez un scan d'empreinte ou de visage.</li>
                  <li>Revenez sur TRAIT pour activer la fonction.</li>
                </ol>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSettingsGuide(false)}>Compris</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
