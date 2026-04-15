'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export default function SendScreen() {
  const { user, navigateTo, setUser } = useAppStore();
  const [receiverPhone, setReceiverPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const fee = Math.round(numericAmount * 0.007 * 100) / 100;
  const total = numericAmount + fee;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!receiverPhone.trim()) {
      toast.error('Veuillez entrer le numéro du destinataire');
      return;
    }
    if (numericAmount <= 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }
    setShowConfirm(true);
  }

  async function confirmSend() {
    if (!user?.id) return;
    setLoading(true);
    setShowConfirm(false);

    try {
      const res = await fetch('/api/transfer/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          receiverPhone: receiverPhone.trim(),
          amount: numericAmount,
          currency,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Update user balance in store
        const updatedUser = {
          ...user,
          realBalance: Math.max(0, user.realBalance - total),
        };
        setUser(updatedUser);

        toast.success('Transfert envoyé avec succès !');
        setReceiverPhone('');
        setAmount('');
        setNote('');
        navigateTo('home');
      } else {
        toast.error(data.message || 'Erreur lors du transfert');
      }
    } catch (err) {
      toast.error('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => navigateTo('home')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Envoyer de l&apos;argent</h1>
      </div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="px-4"
      >
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 space-y-5">
            {/* Receiver Phone */}
            <div className="space-y-2">
              <Label htmlFor="receiver" className="text-sm font-medium">
                Numéro du destinataire
              </Label>
              <Input
                id="receiver"
                type="tel"
                placeholder="+1 234 567 8900"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Montant
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-11 pl-7"
                />
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Devise</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-full h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - Dollar US</SelectItem>
                  <SelectItem value="XOF">XOF - Franc CFA</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note" className="text-sm font-medium">
                Note <span className="text-muted-foreground font-normal">(optionnel)</span>
              </Label>
              <Input
                id="note"
                type="text"
                placeholder="Ajouter une note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Fee & Total */}
            {numericAmount > 0 && (
              <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frais ({0.7}%)</span>
                  <span className="font-medium">${fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-foreground">${total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-base"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Envoi en cours...
                </span>
              ) : (
                'Envoyer'
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirmer le transfert</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point d&apos;envoyer de l&apos;argent.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-muted/50 p-4 space-y-2 my-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Destinataire</span>
              <span className="font-medium">{receiverPhone}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant</span>
              <span className="font-medium">${numericAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Frais</span>
              <span className="font-medium">${fee.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-sm">
              <span className="font-medium">Total</span>
              <span className="font-bold text-emerald-600">${total.toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setShowConfirm(false)}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={confirmSend}
              disabled={loading}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
