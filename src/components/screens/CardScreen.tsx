'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Loader2, Clock, XCircle, Plus, Payment, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import TraitCard from '@/components/trait/TraitCard';

interface CardData {
  id: string;
  cardType: 'USD' | 'FC';
  cardNumber: string;
  cvv: string;
  qrCode: string;
  expiryDate: string;
  status: string;
  createdAt: string;
}

interface PendingRequest {
  id: string;
  cardType: 'USD' | 'FC';
  status: string;
  rejectReason: string | null;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'En attente', color: '#F59E0B', icon: Clock },
  approved: { label: 'Approuvée', color: '#10B981', icon: Plus },
  rejected: { label: 'Refusée', color: '#EF4444', icon: XCircle },
  suspended: { label: 'Suspendue', color: '#8B5CF6', icon: XCircle },
};

export default function CardScreen() {
  const { user, navigateTo } = useAppStore();
  const [cards, setCards] = useState<CardData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch cards and pending requests
  useEffect(() => {
    async function fetchCards() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/cards/my-cards?userId=${user.id}`);
        const data = await res.json();
        if (data.success) {
          setCards(data.cards || []);
          setPendingRequests(data.pendingRequests || []);
        }
      } catch {
        toast.error('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    }
    fetchCards();
  }, [user?.id]);

  function getCardBalance(cardType: 'USD' | 'FC'): number {
    return cardType === 'USD'
      ? (user?.realBalance ?? 0)
      : (user?.realBalanceFC ?? 0);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Chargement de vos cartes...</p>
        </div>
      </div>
    );
  }

  const hasContent = cards.length > 0 || pendingRequests.length > 0;

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
        <h1 className="text-xl font-bold text-foreground">Mes Cartes</h1>
      </div>

      {!hasContent ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center px-6 pt-20"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, type: 'spring' }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center mb-5"
          >
            <CreditCard className="w-10 h-10 text-muted-foreground" />
          </motion.div>

          <h2 className="text-lg font-semibold text-foreground mb-2">
            Aucune carte
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">
            Vous n&apos;avez pas encore de carte TRAIT. Demandez une carte numérique et profitez de tous les avantages.
          </p>

          <div className="w-full max-w-xs space-y-3">
            <Button
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
              onClick={() => navigateTo('card-request' as any)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Demander une carte
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="px-4 pb-6 space-y-6">
          {/* Active Cards Section */}
          {cards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground">
                  Cartes actives ({cards.length})
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-7 px-2"
                  onClick={() => navigateTo('card-request' as any)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Demander
                </Button>
              </div>

              <div className="space-y-5">
                {cards.map((card, index) => {
                  const balance = getCardBalance(card.cardType);
                  const isUSD = card.cardType === 'USD';
                  const accentColor = isUSD ? '#3B82F6' : '#EF4444';

                  return (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.15,
                        ease: [0.23, 1, 0.32, 1],
                      }}
                    >
                      <TraitCard
                        cardType={card.cardType}
                        cardNumber={card.cardNumber}
                        cardHolder={user?.name || 'TITULAIRE'}
                        expiryDate={card.expiryDate}
                        cvv={card.cvv}
                        qrCode={card.qrCode}
                        balance={balance}
                        status={card.status}
                      />

                      {/* Payment button below card */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.15 + 0.3 }}
                        className="mt-3"
                      >
                        <Button
                          variant="outline"
                          className="w-full h-11 rounded-xl font-medium text-sm"
                          style={{
                            borderColor: `${accentColor}40`,
                            color: accentColor,
                          }}
                          onClick={() => navigateTo('card-payment' as any)}
                        >
                          <Payment className="w-4 h-4 mr-2" />
                          Paiement par carte {card.cardType}
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Pending Requests Section */}
          {pendingRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
            >
              <p className="text-sm font-semibold text-foreground mb-3">
                Demandes en cours ({pendingRequests.length})
              </p>

              <div className="space-y-3">
                {pendingRequests.map((request, index) => {
                  const config = statusConfig[request.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  const isUSD = request.cardType === 'USD';
                  const accentColor = isUSD ? '#3B82F6' : '#EF4444';

                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.3 + index * 0.1,
                        ease: 'easeOut',
                      }}
                    >
                      <Card className="border-border shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            {/* Icon */}
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${accentColor}15` }}
                            >
                              <CreditCard
                                className="w-5 h-5"
                                style={{ color: accentColor }}
                              />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  Carte TRAIT {request.cardType}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] shrink-0"
                                  style={{
                                    backgroundColor: `${config.color}15`,
                                    color: config.color,
                                  }}
                                >
                                  <StatusIcon className="w-2.5 h-2.5 mr-1" />
                                  {config.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Demandée le {formatDate(request.createdAt)}
                              </p>
                              {request.rejectReason && (
                                <p className="text-xs text-red-500 mt-1">
                                  Raison : {request.rejectReason}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Request another card button (if has cards) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
          >
            <Button
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
              onClick={() => navigateTo('card-request' as any)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Demander une nouvelle carte
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
