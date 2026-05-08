'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Building2, CreditCard, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

const depositMethods = [
  { id: 'mobile_money', label: 'Mobile Money', icon: Phone, description: 'Orange Money, MTN, Moov' },
  { id: 'bank_transfer', label: 'Virement bancaire', icon: Building2, description: 'Transfert direct vers votre compte' },
  { id: 'card', label: 'Carte bancaire', icon: CreditCard, description: 'Visa, Mastercard' },
  { id: 'agent', label: 'Via Agent', icon: Users, description: 'Dépôt via un agent Trait' },
];

export default function DepositScreen() {
  const { user, navigateTo, setUser } = useAppStore();
  const [selectedMethod, setSelectedMethod] = useState('mobile_money');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAgentInfo, setShowAgentInfo] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const realBalance = user?.realBalance ?? 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (numericAmount <= 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }
    if (selectedMethod === 'agent') {
      setShowAgentInfo(true);
      return;
    }
    setShowConfirm(true);
  }

  async function confirmDeposit() {
    if (!user?.id) return;
    setLoading(true);
    setShowConfirm(false);

    try {
      const res = await fetch('/api/transfer/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount: numericAmount, currency, method: selectedMethod }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedUser = { ...user, realBalance: realBalance + numericAmount };
        setUser(updatedUser);
        toast.success('Dépôt effectué avec succès !');
        setAmount('');
        navigateTo('home');
      } else {
        toast.error(data.message || 'Erreur lors du dépôt');
      }
    } catch {
      toast.error('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigateTo('home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Déposer de l&apos;argent</h1>
      </div>

      {/* Current Balance */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="px-4 mb-6">
        <Card className="border-border bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">Solde actuel</p>
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">${realBalance.toFixed(2)}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Deposit Methods */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }} className="px-4 mb-6">
        <p className="text-sm font-medium text-foreground mb-3">Méthode de dépôt</p>
        <div className="grid grid-cols-2 gap-3">
          {depositMethods.map((m) => {
            const Icon = m.icon;
            const isSelected = selectedMethod === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                className={`flex flex-col items-center gap-2 rounded-xl p-4 border-2 transition-all active:scale-95 ${
                  isSelected ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950' : 'border-border bg-card hover:border-emerald-300'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isSelected ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className={`text-xs font-medium ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'}`}>{m.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }} className="px-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 space-y-5">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="depositAmount" className="text-sm font-medium">Montant</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                <Input id="depositAmount" type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-11 pl-7" />
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Devise</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-full h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - Dollar US</SelectItem>
                  <SelectItem value="XOF">XOF - Franc CFA</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Agent info for agent method */}
            {selectedMethod === 'agent' && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4">
                <div className="flex items-start gap-3">
                  <Users className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Dépôt via Agent</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      Rapprochez-vous d&apos;un agent Trait avec votre montant. L&apos;agent effectuera le dépôt directement sur votre compte.
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 font-medium">
                      Demandez le code agent : <span className="font-mono">17xxxxx</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TRAIT info */}
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 p-3">
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Le dépôt est crédité sur votre solde après validation. Ce service USSD *1709# appartient exclusivement à TRAIT et n&apos;est pas lié aux réseaux mobiles classiques.
              </p>
            </div>

            {/* Submit */}
            <Button
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-base"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Traitement...
                </span>
              ) : selectedMethod === 'agent' ? 'Trouver un agent' : 'Déposer'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Agent Info Dialog */}
      <Dialog open={showAgentInfo} onOpenChange={setShowAgentInfo}>
        <DialogContent className="mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Dépôt via Agent</DialogTitle>
            <DialogDescription>Comment déposer via un agent Trait</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-sm font-bold text-emerald-700">1</div>
                <p className="text-sm text-foreground">Rendez-vous chez un agent Trait</p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-sm font-bold text-emerald-700">2</div>
                <p className="text-sm text-foreground">Donnez votre numéro de téléphone</p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-sm font-bold text-emerald-700">3</div>
                <p className="text-sm text-foreground">L&apos;agent dépose le montant sur votre compte</p>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-sm font-bold text-emerald-700">4</div>
                <p className="text-sm text-foreground">Recevez la confirmation sur votre téléphone</p>
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 p-3">
              <p className="text-xs text-emerald-700 dark:text-emerald-300 text-center">
                Ou utilisez le code USSD <span className="font-mono font-bold">*1709#</span> → Option 4
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowAgentInfo(false)}>Fermer</Button>
            <Button className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigateTo('ussd')}>Ouvrir USSD</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirmer le dépôt</DialogTitle>
            <DialogDescription>Vous êtes sur le point de déposer de l&apos;argent sur votre compte.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-muted/50 p-4 space-y-2 my-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant</span>
              <span className="font-medium text-emerald-600">+${numericAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Méthode</span>
              <span className="font-medium">{depositMethods.find((m) => m.id === selectedMethod)?.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Devise</span>
              <span className="font-medium">{currency}</span>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowConfirm(false)}>Annuler</Button>
            <Button className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" onClick={confirmDeposit} disabled={loading}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
