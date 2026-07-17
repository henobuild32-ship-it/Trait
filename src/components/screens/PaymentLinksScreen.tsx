'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Copy,
  Share2,
  Link,
  ExternalLink,
  Check,
  Loader2,
  X,
  DollarSign,
  Globe,
  Calendar,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';

interface PaymentLink {
  id: string;
  code: string;
  amount: number;
  currency: string;
  description: string;
  status: 'active' | 'expired' | 'max_uses';
  useCount: number;
  maxUses: number | null;
  expiresAt: string | null;
  createdAt: string;
}

const statusConfig = {
  active: { label: 'Actif', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' },
  expired: { label: 'Expiré', color: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400' },
  max_uses: { label: 'Utilisations max', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400' },
};

const BASE_URL = 'trait-rho.vercel.app/pay/link';

export default function PaymentLinksScreen() {
  const { user, navigateTo } = useAppStore();
  const { t } = useTranslation();
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formAmount, setFormAmount] = useState('');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formDescription, setFormDescription] = useState('');
  const [formMaxUses, setFormMaxUses] = useState('');
  const [formExpiry, setFormExpiry] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  async function fetchLinks() {
    if (!user?.id) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/payment-links?userId=${user.id}`);
      const data = await res.json();
      if (data.success) setLinks(data.links ?? []);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!formAmount || parseFloat(formAmount) <= 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }
    if (!formDescription.trim()) {
      toast.error('Veuillez entrer une description');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/payment-links/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          amount: parseFloat(formAmount),
          currency: formCurrency,
          description: formDescription,
          maxUses: formMaxUses ? parseInt(formMaxUses) : null,
          expiresAt: formExpiry || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Lien de paiement créé !');
        setShowCreate(false);
        setFormAmount('');
        setFormCurrency('USD');
        setFormDescription('');
        setFormMaxUses('');
        setFormExpiry('');
        fetchLinks();
      } else {
        toast.error(data.message || 'Erreur');
      }
    } catch { toast.error('Erreur de connexion'); }
    finally { setCreating(false); }
  }

  function getShareUrl(code: string) {
    return `https://${BASE_URL}/${code}`;
  }

  async function handleCopy(code: string) {
    const url = getShareUrl(code);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(code);
      toast.success('URL copiée !');
      setTimeout(() => setCopiedId(null), 2000);
    } catch { toast.error('Erreur de copie'); }
  }

  async function handleShare(code: string) {
    const url = getShareUrl(code);
    try {
      await navigator.share({ title: 'Lien de paiement TRAIT', text: `Payez-moi via TRAIT: ${url}`, url });
    } catch {}
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigateTo('home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Liens de paiement</h1>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-border">
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : links.length === 0 ? (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Link className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">Aucun lien de paiement</p>
              <p className="text-sm text-muted-foreground text-center mb-6">Créez votre premier lien !</p>
              <Button className="bg-[#0D5C63] hover:bg-[#0D5C63]/90 text-white rounded-xl" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un lien
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {links.map((link, idx) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-border hover:border-[#0D5C63]/20 transition-all">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-lg font-bold text-foreground">
                          {link.currency === 'FC' ? '' : '$'}{link.amount.toFixed(2)} {link.currency === 'FC' ? 'FC' : 'USD'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                      </div>
                      <Badge className={`${statusConfig[link.status].color} border text-[10px] font-semibold`}>
                        {statusConfig[link.status].label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-xl border border-border/50">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[11px] font-mono text-muted-foreground truncate flex-1">
                        trait-rho.vercel.app/pay/link/{link.code}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {link.useCount} utilisations{link.maxUses ? ` / ${link.maxUses} max` : ''}
                      </span>
                      {link.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Expire le {new Date(link.expiresAt).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="flex-1 h-9 text-xs rounded-xl" onClick={() => handleCopy(link.code)}>
                        {copiedId === link.code ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        {copiedId === link.code ? 'Copié' : 'Copier'}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-9 text-xs rounded-xl" onClick={() => handleShare(link.code)}>
                        <Share2 className="h-3.5 w-3.5 mr-1" />
                        Partager
                      </Button>
                      <Button variant="ghost" size="sm" className="h-9 w-9 rounded-xl" onClick={() => window.open(getShareUrl(link.code), '_blank')}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#0D5C63] text-white shadow-lg shadow-[#0D5C63]/30 flex items-center justify-center hover:bg-[#0D5C63]/90 active:scale-95 transition-all z-40"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Nouveau lien de paiement</DialogTitle>
            <DialogDescription>Créez un lien à partager pour recevoir des paiements</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Montant</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="number" step="0.01" min="0" placeholder="0.00" value={formAmount}
                  onChange={e => setFormAmount(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Devise</Label>
              <Select value={formCurrency} onValueChange={setFormCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="FC">FC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="Ex: Paiement facture" value={formDescription}
                onChange={e => setFormDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
              <Label>Utilisations max <span className="text-muted-foreground">(opt.)</span></Label>
                <Input type="number" min="0" placeholder="Illimité" value={formMaxUses}
                  onChange={e => setFormMaxUses(e.target.value)} />
              </div>
              <div className="space-y-2">
              <Label>Expire le <span className="text-muted-foreground">(opt.)</span></Label>
                <Input type="date" value={formExpiry}
                  onChange={e => setFormExpiry(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button className="bg-[#0D5C63] hover:bg-[#0D5C63]/90 text-white rounded-xl" onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
