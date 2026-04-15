'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function PinSetupScreen() {
  const { navigateTo, user, setUser } = useAppStore();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm' | 'success'>('create');
  const [error, setError] = useState('');

  const handleDigit = (digit: string) => {
    if (step === 'create') {
      if (pin.length >= 4) return;
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => {
          setStep('confirm');
          setError('');
        }, 300);
      }
    } else if (step === 'confirm') {
      if (confirmPin.length >= 4) return;
      const newConfirm = confirmPin + digit;
      setConfirmPin(newConfirm);
      if (newConfirm.length === 4) {
        setTimeout(() => {
          if (newConfirm === pin) {
            setStep('success');
            if (user) {
              setUser({ ...user, pin: newConfirm });
            }
            setTimeout(() => {
              navigateTo('onboarding');
            }, 1500);
          } else {
            setError('Les codes PIN ne correspondent pas');
            setConfirmPin('');
            setTimeout(() => {
              setStep('create');
              setPin('');
              setError('');
            }, 1500);
          }
        }, 300);
      }
    }
  };

  const handleDelete = () => {
    if (step === 'create') {
      setPin((prev) => prev.slice(0, -1));
    } else if (step === 'confirm') {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const currentPin = step === 'create' ? pin : confirmPin;

  const dotIndices = [0, 1, 2, 3];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col items-center justify-center px-6 py-12"
      >
        {step === 'success' ? (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Code PIN configuré !</h2>
            <p className="text-sm text-gray-500 text-center">
              Votre code PIN a été enregistré avec succès
            </p>
          </motion.div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 mb-10">
              <h2 className="text-xl font-bold text-gray-900">
                {step === 'create' ? 'Créez votre code PIN' : 'Confirmez votre PIN'}
              </h2>
              <p className="text-sm text-gray-500">
                {step === 'create'
                  ? 'Choisissez un code PIN à 4 chiffres'
                  : 'Entrez à nouveau votre code PIN'}
              </p>
            </div>

            {/* PIN dots */}
            <div className="flex gap-4 mb-10">
              {dotIndices.map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8 }}
                  animate={{
                    scale: i < currentPin.length ? 1.2 : 1,
                    backgroundColor: i < currentPin.length ? '#059669' : '#e5e7eb',
                  }}
                  transition={{ duration: 0.15 }}
                  className="w-4 h-4 rounded-full"
                />
              ))}
            </div>

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
                      className="h-14 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium transition-colors cursor-pointer"
                    >
                      ←
                    </button>
                  );
                }
                return (
                  <button
                    key={key}
                    onClick={() => handleDigit(key)}
                    className="h-14 rounded-xl bg-white border border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 flex items-center justify-center text-xl font-semibold transition-colors active:scale-95 cursor-pointer"
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </motion.main>
    </div>
  );
}
