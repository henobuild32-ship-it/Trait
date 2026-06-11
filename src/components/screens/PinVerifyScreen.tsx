'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Fingerprint } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export default function PinVerifyScreen() {
  const { goBack, navigateTo, user, clearPendingPinAction, pendingPinAction } = useAppStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

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
        <Fingerprint className="h-5 w-5 text-emerald-600" />
      </motion.header>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-1 flex flex-col items-center justify-center px-6 py-12"
      >
        <div className="flex flex-col items-center gap-2 mb-10">
          <h2 className="text-xl font-bold text-foreground">Vérification PIN</h2>
          <p className="text-sm text-muted-foreground">Entrez votre code PIN</p>
        </div>

        {/* PIN dots */}
        <motion.div
          animate={shaking ? { x: [-5, 5, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex gap-4 mb-10"
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: i < pin.length ? 1.2 : 1,
                backgroundColor: i < pin.length
                  ? (error ? '#ef4444' : '#059669')
                  : '#e5e7eb',
              }}
              transition={{ duration: 0.15 }}
              className="w-4 h-4 rounded-full"
            />
          ))}
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-sm mb-4"
          >
            {error}
          </motion.p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
            if (key === '') {
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
                className="h-14 rounded-xl bg-background border border-border hover:bg-emerald-50 hover:border-emerald-200 flex items-center justify-center text-xl font-semibold transition-colors active:scale-95 cursor-pointer"
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
