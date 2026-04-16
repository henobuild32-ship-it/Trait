'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, User as UserIcon, Building2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore, type User } from '@/lib/store';
import { toast } from 'sonner';

const countryCodes = [
  { code: '+228', label: '+228', country: 'Togo' },
  { code: '+229', label: '+229', country: 'Bénin' },
  { code: '+225', label: '+225', country: "Côte d'Ivoire" },
  { code: '+224', label: '+224', country: 'Guinée' },
  { code: '+237', label: '+237', country: 'Cameroun' },
  { code: '+243', label: '+243', country: 'RDC' },
  { code: '+221', label: '+221', country: 'Sénégal' },
  { code: '+223', label: '+223', country: 'Mali' },
  { code: '+226', label: '+226', country: 'Burkina Faso' },
  { code: '+234', label: '+234', country: 'Nigeria' },
  { code: '+233', label: '+233', country: 'Ghana' },
  { code: '+1', label: '+1', country: 'US/CA' },
  { code: '+33', label: '+33', country: 'France' },
  { code: '+44', label: '+44', country: 'UK' },
];

export default function AuthLoginScreen() {
  const navigateTo = useAppStore((s) => s.navigateTo);
  const setUser = useAppStore((s) => s.setUser);

  const [selectedRole, setSelectedRole] = useState<'client' | 'agent'>('client');
  const [countryCode, setCountryCode] = useState('+228');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedPhone = phone.replace(/\s/g, '');
    if (!cleanedPhone || cleanedPhone.length < 6) {
      toast.error('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    if (!password.trim()) {
      toast.error('Veuillez entrer votre mot de passe');
      return;
    }

    const fullPhone = `${countryCode}${cleanedPhone}`;
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, password: password.trim(), role: selectedRole }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Numéro ou mot de passe incorrect');
        return;
      }

      const user = data.user as User;

      // Verify role matches
      if (user.role !== selectedRole) {
        toast.error(`Ce compte est un compte ${user.role === 'agent' ? 'Agent' : 'Client'}. Veuillez sélectionner le bon type.`);
        return;
      }

      setUser(user);

      // Route based on role and onboarding status
      if (!user.hasCompletedOnboarding) {
        navigateTo('onboarding');
      } else if (user.role === 'agent') {
        navigateTo('agent-dashboard');
      } else {
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
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center px-4 py-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateTo('welcome')}
          className="rounded-full hover:bg-emerald-50 cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Button>
      </motion.header>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-1 flex flex-col px-6 pt-4 pb-8"
      >
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Se connecter</h1>
          <p className="text-gray-500">Choisissez votre type de compte et connectez-vous</p>
        </div>

        {/* Role Toggle */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => setSelectedRole('client')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
              selectedRole === 'client'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Client
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('agent')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
              selectedRole === 'agent'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Agent
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Phone Number */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="login-phone" className="text-gray-700 font-medium">
              Numéro de téléphone
            </Label>
            <div className="flex gap-2">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="w-[100px] shrink-0 border-gray-200">
                  <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent>
                  {countryCodes.map((item) => (
                    <SelectItem key={item.code + item.country} value={item.code}>
                      <span className="text-xs">{item.code} {item.country}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="login-phone"
                type="tel"
                placeholder="90 11 22 33"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 border-gray-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 h-12 text-base"
                autoComplete="tel"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="login-password" className="text-gray-700 font-medium">
              Mot de passe
            </Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 border-gray-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 text-base pr-12"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading || !phone.trim() || !password.trim()}
            className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200 disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>

        {/* Register link */}
        <div className="mt-6 flex items-center justify-center">
          <p className="text-sm text-gray-500">
            Pas de compte ?{' '}
            <button
              onClick={() => navigateTo('auth-role')}
              className="font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-2 cursor-pointer"
            >
              Créer un compte
            </button>
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <p className="text-xs text-gray-400 text-center">
            En continuant, vous acceptez nos conditions d&apos;utilisation
          </p>
        </div>
      </motion.main>
    </div>
  );
}
