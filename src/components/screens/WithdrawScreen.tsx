'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock } from 'lucide-react';
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

export default function WithdrawScreen() {
  const { user, navigateTo, setUser, setPendingPinAction } = useAppStore();
  const [amount, setAmount] = useState('');
  const [agentCode, setAgentCode] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [method, setMethod] = useState('mobile_money');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const fee = Math.round(numericAmount * 0.007 * 100) / 100;
  const total = numericAmount + fee;
  const realBalance = user?.realBalance ?? 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (numericAmount <= 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }
    if (total > realBalance) {
      toast.error(`Solde insuffisant. Solde réel: $${realBalance.toFixed(2)}`);
      return;
    }
    setShowConfirm(true);
  }

  function requestPinAndWithdraw() {
    if (!user?.id) return;
    setShowConfirm(false);

    setPendingPinAction(async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/transfer/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            amount: numericAmount,
            currency,
            method,
          }),
        });
        const data = await res.json();
        if (data.success) {
          const updatedUser = { ...user, realBalance: Math.max(0, realBalance - total) };
          setUser(updatedUser);
          toast.success('Retrait effectué avec succès !');
          setAmount('');
          setAgentCode('');
          navigateTo('home');
        } else {
          toast.error(data.message || 'Erreur lors du retrait');
        }
      } catch {
        toast.error('Erreur de connexion. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    });

    navigateTo('pin-verify');
  }

  const methodLabels: Record<string, string> = {
    mobile_money: 'Mobile Money',
    bank_transfer: 'Virement bancaire',
    card: 'Carte',
    agent: 'Via Agent',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigateTo('home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Retirer de l&apos;argent</h1>
      </div>

      {/* PIN info */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="size-3" />
          <span>Code PIN requis pour confirmer</span>
        </div>
      </div>

      {/* Current Balance */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="px-4 mb-6">
        <Card className="border-border bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">Solde disponible</p>
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">${realBalance.toFixed(2)}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Form Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }} className="px-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 space-y-5">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="withdrawAmount" className="text-sm font-medium">Montant</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                <Input id="withdrawAmount" type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-11 pl-7" />
              </div>
            </div>

            {/* Agent Code (optional) */}
            <div className="space-y-2">
              <Label htmlFor="agentCode" className="text-sm font-medium">
                Code agent <span className="text-muted-foreground font-normal">(optionnel)</span>
              </Label>
              <Input
                id="agentCode"
                type="text"
                placeholder="1704567"
                value={agentCode}
                onChange={(e) => setAgentCode(e.target.value)}
                className="h-11"
                maxLength={7}
              />
              <p className="text-xs text-muted-foreground">Entrez le code agent pour un retrait via agent</p>
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

            {/* Withdrawal Method */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Méthode de retrait</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-full h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                  <SelectItem value="card">Carte</SelectItem>
                  <SelectItem value="agent">Via Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fee & Total */}
            {numericAmount > 0 && (
              <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frais ({0.7}%)</span>
                  <span className="font-medium">${fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total débité</span>
                  <span className="font-bold text-foreground">${total.toFixed(2)}</span>
                </div>
                {total > realBalance && <p className="text-xs text-red-500 mt-1">Solde insuffisant</p>}
              </div>
            )}

            {/* Submit */}
            <Button
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-base"
              onClick={handleSubmit}
              disabled={loading || (numericAmount > 0 && total > realBalance)}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Traitement...
                </span>
              ) : 'Retirer'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirmer le retrait</DialogTitle>
            <DialogDescription>Vous êtes sur le point de retirer de l&apos;argent.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-muted/50 p-4 space-y-2 my-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant</span>
              <span className="font-medium">${numericAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Méthode</span>
              <span className="font-medium">{methodLabels[method] || method}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Frais</span>
              <span className="font-medium">${fee.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-sm">
              <span className="font-medium">Total débité</span>
              <span className="font-bold text-red-500">-${total.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="size-3" />Votre code PIN sera demandé pour confirmer
          </p>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowConfirm(false)}>Annuler</Button>
            <Button className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" onClick={requestPinAndWithdraw} disabled={loading}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
