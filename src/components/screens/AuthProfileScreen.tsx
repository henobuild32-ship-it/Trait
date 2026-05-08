'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Gift } from 'lucide-react';
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

const countries = [
  { value: 'Togo', label: '🇹🇬 Togo' },
  { value: 'Bénin', label: '🇧🇯 Bénin' },
  { value: "Côte d'Ivoire", label: "🇨🇮 Côte d'Ivoire" },
  { value: 'Sénégal', label: '🇸🇳 Sénégal' },
  { value: 'Mali', label: '🇲🇱 Mali' },
  { value: 'Burkina Faso', label: '🇧🇫 Burkina Faso' },
  { value: 'Niger', label: '🇳🇪 Niger' },
  { value: 'Guinée', label: '🇬🇳 Guinée' },
  { value: 'Cameroun', label: '🇨🇲 Cameroun' },
  { value: 'RDC', label: '🇨🇩 RDC' },
  { value: 'Congo', label: '🇨🇬 Congo' },
  { value: 'Gabon', label: '🇬🇦 Gabon' },
  { value: 'Nigeria', label: '🇳🇬 Nigeria' },
  { value: 'Ghana', label: '🇬🇭 Ghana' },
  { value: 'France', label: '🇫🇷 France' },
  { value: 'US', label: '🇺🇸 États-Unis' },
  { value: 'Canada', label: '🇨🇦 Canada' },
  { value: 'UK', label: '🇬🇧 Royaume-Uni' },
];

export default function AuthProfileScreen() {
  const phoneNumber = useAppStore((s) => s.phoneNumber);
  const registrationPassword = useAppStore((s) => s.registrationPassword);
  const selectedRole = useAppStore((s) => s.selectedRole);
  const setUser = useAppStore((s) => s.setUser);
  const navigateTo = useAppStore((s) => s.navigateTo);

  const [name, setName] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Veuillez entrer votre nom complet');
      return;
    }

    if (!pseudo.trim()) {
      toast.error('Veuillez entrer un pseudo');
      return;
    }

    if (!country) {
      toast.error('Veuillez sélectionner votre pays');
      return;
    }

    if (!phoneNumber) {
      toast.error('Erreur : numéro de téléphone non trouvé');
      navigateTo('auth-role');
      return;
    }

    if (!registrationPassword) {
      toast.error('Erreur : mot de passe non trouvé');
      navigateTo('auth-phone');
      return;
    }

    setLoading(true);

    try {
      // Create the full account via register API
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          password: registrationPassword,
          role: selectedRole,
          name: name.trim(),
          pseudo: pseudo.trim(),
          country,
          pin: '', // PIN will be set in next step
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Erreur lors de la création du compte');
        return;
      }

      const user = data.user as User;
      setUser(user);
      navigateTo('pin-setup');
    } catch {
      toast.error('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center px-4 py-4"
      >
        <h1 className="text-lg font-bold text-foreground">Créez votre profil</h1>
      </motion.header>

      {/* Content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-1 flex flex-col px-6 pt-2 pb-8"
      >
        {/* Bonus card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-6 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-xl px-4 py-3.5 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm text-emerald-800 font-medium">
            🎁 Vous recevez <span className="font-bold">10 USD</span> de bonus !
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Full Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-foreground font-medium">
              Nom complet
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Ex: Kofi Amegah"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12  focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 text-base"
              autoComplete="name"
              disabled={loading}
            />
          </div>

          {/* Pseudo */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="pseudo" className="text-foreground font-medium">
              Pseudo
            </Label>
            <Input
              id="pseudo"
              type="text"
              placeholder="Ex: @kofi_trader"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              className="h-12  focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 text-base"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          {/* Country */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="country" className="text-foreground font-medium">
              Pays
            </Label>
            <Select value={country} onValueChange={setCountry} disabled={loading}>
              <SelectTrigger className="w-full h-12  focus:ring-emerald-500/20 text-base">
                <SelectValue placeholder="Sélectionnez votre pays" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={loading || !name.trim() || !pseudo.trim() || !country}
            className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200 disabled:opacity-50 cursor-pointer mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Création...
              </>
            ) : (
              'Créer mon compte'
            )}
          </Button>
        </form>
      </motion.main>
    </div>
  );
}
