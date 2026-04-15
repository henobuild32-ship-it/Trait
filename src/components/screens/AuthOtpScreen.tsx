'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { useAppStore, type User } from '@/lib/store';
import { toast } from 'sonner';

export default function AuthOtpScreen() {
  const goBack = useAppStore((s) => s.goBack);
  const navigateTo = useAppStore((s) => s.navigateTo);
  const setUser = useAppStore((s) => s.setUser);
  const phoneNumber = useAppStore((s) => s.phoneNumber);
  const setOtpCode = useAppStore((s) => s.setOtpCode);
  const setOtpVerified = useAppStore((s) => s.setOtpVerified);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const maskedPhone = phoneNumber
    ? phoneNumber.replace(/(\d{2})\d+(\d{2})$/, '$1****$2')
    : '*** ******';

  const handleResend = useCallback(async () => {
    if (countdown > 0) return;
    setCountdown(60);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Code renvoyé avec succès');
      } else {
        toast.error(data.message || 'Erreur lors du renvoi');
      }
    } catch {
      toast.error('Erreur de connexion');
    }
  }, [countdown, phoneNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length < 4) {
      toast.error('Veuillez entrer le code complet');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, code: otp }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Code invalide');
        return;
      }

      const user = data.user as User;
      setUser(user);
      setOtpCode(otp);
      setOtpVerified(true);

      // Routing logic after OTP verification
      if (!user.name || user.name.trim() === '') {
        // New user — go to profile setup
        navigateTo('auth-profile');
      } else if (!user.hasCompletedOnboarding) {
        // Existing user but hasn't completed onboarding
        navigateTo('onboarding');
      } else {
        // Returning user — go home
        navigateTo('home');
      }
    } catch {
      toast.error('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center px-4 py-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          className="rounded-full hover:bg-emerald-50 cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Button>
      </motion.header>

      {/* Content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-1 flex flex-col px-6 pt-4 pb-8"
      >
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Vérification</h1>
          <p className="text-gray-500">
            Entrez le code envoyé au{' '}
            <span className="font-medium text-gray-700">{maskedPhone}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* OTP Input */}
          <div className="flex flex-col items-center gap-6">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
              disabled={loading}
              className="justify-center"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="h-14 w-12 text-xl rounded-lg border-gray-200 data-[active=true]:border-emerald-500 data-[active=true]:ring-emerald-500/20" />
                <InputOTPSlot index={1} className="h-14 w-12 text-xl rounded-lg border-gray-200 data-[active=true]:border-emerald-500 data-[active=true]:ring-emerald-500/20" />
                <InputOTPSlot index={2} className="h-14 w-12 text-xl rounded-lg border-gray-200 data-[active=true]:border-emerald-500 data-[active=true]:ring-emerald-500/20" />
              </InputOTPGroup>
              <InputOTPSeparator className="mx-2 text-gray-300" />
              <InputOTPGroup>
                <InputOTPSlot index={3} className="h-14 w-12 text-xl rounded-lg border-gray-200 data-[active=true]:border-emerald-500 data-[active=true]:ring-emerald-500/20" />
                <InputOTPSlot index={4} className="h-14 w-12 text-xl rounded-lg border-gray-200 data-[active=true]:border-emerald-500 data-[active=true]:ring-emerald-500/20" />
                <InputOTPSlot index={5} className="h-14 w-12 text-xl rounded-lg border-gray-200 data-[active=true]:border-emerald-500 data-[active=true]:ring-emerald-500/20" />
              </InputOTPGroup>
            </InputOTP>

            {/* Demo hint */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2.5 text-center">
              <p className="text-sm text-emerald-700 font-medium">
                Code demo : <span className="font-mono font-bold">1234</span>
              </p>
            </div>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={loading || otp.length < 4}
            className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Vérification...
              </>
            ) : (
              'Vérifier'
            )}
          </Button>
        </form>

        {/* Resend */}
        <div className="mt-8 flex items-center justify-center">
          {countdown > 0 ? (
            <p className="text-sm text-gray-400">
              Renvoyer le code dans{' '}
              <span className="font-medium text-emerald-600">{countdown}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 underline underline-offset-2 cursor-pointer"
            >
              Renvoyer le code
            </button>
          )}
        </div>
      </motion.main>
    </div>
  );
}
