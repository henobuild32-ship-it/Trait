'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Fingerprint, Scan, ShieldAlert, Loader2, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

// ─── helpers ─────────────────────────────────────────────────────────────────
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
  return buffer.buffer;
}

export default function PinVerifyScreen() {
  const { goBack, navigateTo, user, clearPendingPinAction, pendingPinAction } = useAppStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricKey, setBiometricKey] = useState<string | null>(null);
  const [biometricCredId, setBiometricCredId] = useState<string | null>(null);
  const [biometricType, setBiometricType] = useState<'faceId' | 'fingerprint'>('fingerprint');
  const [verifyingBiometrics, setVerifyingBiometrics] = useState(false);
  const [biometricError, setBiometricError] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('trait_biometric_key');
    const storedCredId = localStorage.getItem('trait_biometric_cred_id');
    const storedType = localStorage.getItem('trait_biometric_type') as 'faceId' | 'fingerprint' | null;

    if (storedKey && user?.biometricEnabled) {
      setBiometricKey(storedKey);
      setBiometricCredId(storedCredId || null);
      setBiometricAvailable(true);
      setBiometricType(storedType || 'fingerprint');
      // Auto-trigger
      setTimeout(() => triggerBiometric(storedKey, storedCredId), 600);
    }
  }, [user]);

  const triggerBiometric = async (key: string, credId: string | null) => {
    if (verifyingBiometrics) return;
    setVerifyingBiometrics(true);
    setBiometricError('');
    setError('');

    try {
      if (typeof window === 'undefined' || !window.PublicKeyCredential) {
        throw new Error('Biométrie non supportée sur ce navigateur/appareil');
      }

      const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        throw new Error('Aucun capteur biométrique détecté sur cet appareil');
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Build allowCredentials if we have the credential ID stored
      const allowCredentials: PublicKeyCredentialDescriptor[] = credId
        ? [{ id: base64urlToBuffer(credId), type: 'public-key' as const }]
        : [];

      // Trigger native biometric prompt
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
          ...(allowCredentials.length > 0 ? { allowCredentials } : {}),
        },
      });

      // Native biometric passed — verify the stored key server-side
      const verifyRes = await fetch('/api/biometric?action=verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: key }),
      });
      const data = await verifyRes.json();

      if (data.success) {
        toast.success('✅ Authentification biométrique réussie');
        clearPendingPinAction?.();
        pendingPinAction?.();
      } else {
        // Key mismatch: ask user to re-register biometrics
        throw new Error(data.message || 'Vérification échouée');
      }
    } catch (err: any) {
      console.warn('[Biometric] error:', err?.name, err?.message);
      if (err?.name === 'NotAllowedError') {
        // User cancelled or timed out — don't show red error, just silent
        setBiometricError('');
      } else if (err?.name === 'InvalidStateError') {
        setBiometricError('Biométrie non enregistrée. Réactivez-la dans les paramètres.');
        toast.error('Biométrie non enregistrée sur cet appareil');
      } else {
        setBiometricError(err?.message || 'Échec biométrique. Utilisez votre PIN.');
      }
    } finally {
      setVerifyingBiometrics(false);
    }
  };

  const handleDigit = useCallback(async (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      setTimeout(async () => {
        try {
          const res = await fetch('/api/auth/verify-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user?.id, pin: newPin }),
          });
          const data = await res.json();
          if (data.success) {
            clearPendingPinAction?.();
            pendingPinAction?.();
          } else {
            throw new Error(data.message || 'Code PIN incorrect');
          }
        } catch (err: any) {
          setError(err.message || 'Code PIN incorrect');
          setShaking(true);
          setTimeout(() => {
            setPin('');
            setError('');
            setShaking(false);
          }, 1000);
        }
      }, 300);
    }
  }, [pin, user, pendingPinAction, clearPendingPinAction]);

  const handleDelete = () => setPin(prev => prev.slice(0, -1));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-4 py-4"
      >
        <button
          onClick={goBack}
          className="w-10 h-10 rounded-full hover:bg-accent flex items-center justify-center cursor-pointer"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>
        {biometricAvailable && (
          <button
            disabled={verifyingBiometrics}
            onClick={() => triggerBiometric(biometricKey!, biometricCredId)}
            className="w-10 h-10 rounded-full bg-[#0D5C63]/10 hover:bg-[#0D5C63]/20 flex items-center justify-center text-[#0D5C63] disabled:opacity-50"
          >
            {verifyingBiometrics ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : biometricType === 'faceId' ? (
              <Scan className="h-5 w-5" />
            ) : (
              <Fingerprint className="h-5 w-5" />
            )}
          </button>
        )}
      </motion.header>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-1 flex flex-col items-center justify-center px-6 py-8"
      >
        <div className="flex flex-col items-center gap-2 mb-8">
          <h2 className="text-xl font-bold text-foreground">Vérification de sécurité</h2>
          <p className="text-sm text-muted-foreground">Entrez votre code PIN pour valider</p>
        </div>

        {/* PIN dots */}
        <motion.div
          animate={shaking ? { x: [-5, 5, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex gap-4 mb-8"
        >
          {[0, 1, 2, 3].map(i => (
            <motion.div
              key={i}
              animate={{
                scale: i < pin.length ? 1.2 : 1,
                backgroundColor: i < pin.length
                  ? (error ? '#ef4444' : '#0D5C63')
                  : '#e5e7eb',
              }}
              transition={{ duration: 0.15 }}
              className="w-4 h-4 rounded-full"
            />
          ))}
        </motion.div>

        {/* Errors */}
        <AnimatePresence>
          {(error || biometricError) && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-1.5 text-red-500 text-sm mb-4 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40 max-w-[280px] text-center"
            >
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error || biometricError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Biometric loading state */}
        <AnimatePresence>
          {verifyingBiometrics && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2 text-[#0D5C63] text-sm mb-4 bg-[#0D5C63]/5 px-4 py-2 rounded-xl border border-[#0D5C63]/20"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {biometricType === 'faceId'
                  ? 'Regardez la caméra...'
                  : 'Posez votre doigt...'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map(key => {
            if (key === '') {
              return biometricAvailable ? (
                <button
                  key="biometric-trigger"
                  onClick={() => triggerBiometric(biometricKey!, biometricCredId)}
                  disabled={verifyingBiometrics}
                  className="h-14 rounded-xl bg-[#0D5C63]/10 hover:bg-[#0D5C63]/20 flex items-center justify-center text-[#0D5C63] transition-all active:scale-95 cursor-pointer border border-[#0D5C63]/20 disabled:opacity-50"
                >
                  {verifyingBiometrics
                    ? <Loader2 className="h-6 w-6 animate-spin" />
                    : biometricType === 'faceId'
                      ? <Scan className="h-6 w-6" />
                      : <Fingerprint className="h-6 w-6" />}
                </button>
              ) : <div key="empty" />;
            }
            if (key === 'del') {
              return (
                <button
                  key="del"
                  onClick={handleDelete}
                  className="h-14 rounded-xl bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground text-sm font-medium transition-colors cursor-pointer"
                >
                  ←
                </button>
              );
            }
            return (
              <button
                key={key}
                onClick={() => handleDigit(key)}
                className="h-14 rounded-xl bg-background border border-border hover:bg-[#0D5C63]/5 hover:border-[#0D5C63]/20 flex items-center justify-center text-xl font-semibold transition-colors active:scale-95 cursor-pointer"
              >
                {key}
              </button>
            );
          })}
        </div>
      </motion.main>
    </div>
  );
}
