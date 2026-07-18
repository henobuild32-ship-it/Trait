'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Fingerprint, Scan, ShieldAlert, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export default function PinVerifyScreen() {
  const { goBack, navigateTo, user, clearPendingPinAction, pendingPinAction } = useAppStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricKey, setBiometricKey] = useState<string | null>(null);
  const [verifyingBiometrics, setVerifyingBiometrics] = useState(false);

  // Check user biometric settings and local keys
  useEffect(() => {
    const storedKey = localStorage.getItem('trait_biometric_key');
    if (storedKey && user?.biometricEnabled) {
      setBiometricKey(storedKey);
      setBiometricAvailable(true);
      // Auto-trigger biometric on mount
      setTimeout(() => {
        handleBiometricVerify(storedKey);
      }, 500);
    }
  }, [user]);

  const handleBiometricVerify = async (keyToVerify: string) => {
    if (verifyingBiometrics) return;
    setVerifyingBiometrics(true);
    setError('');

    try {
      if (typeof window === 'undefined' || !window.PublicKeyCredential) {
        throw new Error('Biométrie non supportée sur ce navigateur');
      }

      // Check if user verification is available
      const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        throw new Error('Biométrie système non configurée ou non disponible');
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Trigger native biometric prompt (Touch ID / Face ID / Android BiometricPrompt)
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
        },
      });

      // Verify key on server
      const verifyRes = await fetch('/api/biometric?action=verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: keyToVerify }),
      });
      const data = await verifyRes.json();

      if (data.success) {
        toast.success('Authentification biométrique réussie');
        clearPendingPinAction?.();
        pendingPinAction?.();
      } else {
        throw new Error(data.message || 'Authentification échouée');
      }
    } catch (err: any) {
      console.warn('Biometric verify error:', err);
      // Show warning only if user didn't explicitly cancel
      if (err?.name !== 'NotAllowedError') {
        setError(err?.message || 'Échec de la biométrie');
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

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

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
            onClick={() => handleBiometricVerify(biometricKey!)}
            className="w-10 h-10 rounded-full bg-[#0D5C63]/10 hover:bg-[#0D5C63]/20 flex items-center justify-center text-[#0D5C63]"
          >
            {verifyingBiometrics ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : user?.faceIdEnabled ? (
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
          {[0, 1, 2, 3].map((i) => (
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

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 text-red-500 text-sm mb-4 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40"
          >
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
            if (key === '') {
              // Return biometric button if available
              if (biometricAvailable) {
                return (
                  <button
                    key="biometric-trigger"
                    onClick={() => handleBiometricVerify(biometricKey!)}
                    disabled={verifyingBiometrics}
                    className="h-14 rounded-xl bg-[#0D5C63]/10 hover:bg-[#0D5C63]/20 flex items-center justify-center text-[#0D5C63] transition-all active:scale-95 cursor-pointer border border-[#0D5C63]/20"
                  >
                    {user?.faceIdEnabled ? <Scan className="h-6 w-6" /> : <Fingerprint className="h-6 w-6" />}
                  </button>
                );
              }
              return <div key="empty" />;
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
