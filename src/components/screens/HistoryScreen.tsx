'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface HistoryItem {
  id: string;
  type: string;
  amount: number;
  fee: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
}

type FilterTab = 'all' | 'send' | 'receive' | 'deposit' | 'withdrawal';

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'send', label: 'Envois' },
  { id: 'receive', label: 'Reçus' },
  { id: 'deposit', label: 'Dépôts' },
  { id: 'withdrawal', label: 'Retraits' },
];

function getTypeIcon(type: string) {
  switch (type) {
    case 'send': return '💸';
    case 'receive': return '💰';
    case 'deposit': return '➕';
    case 'withdrawal': return '🏧';
    default: return '📄';
  }
}

function getTypeBg(type: string) {
  switch (type) {
    case 'send': return 'bg-red-50';
    case 'receive': return 'bg-emerald-50';
    case 'deposit': return 'bg-emerald-50';
    case 'withdrawal': return 'bg-orange-50';
    default: return 'bg-muted';
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">Terminé</Badge>;
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">En attente</Badge>;
    case 'failed':
      return <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">Échoué</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
  }
}

function fmtCur(amount: number, currency: string) {
  if (currency === 'FC') return `${amount.toFixed(2)} FC`;
  return `$${amount.toFixed(2)}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryScreen() {
  const { user, navigateTo } = useAppStore();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/transfer/history?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  function handleRefresh() {
    setRefreshing(true);
    fetchHistory();
  }

  const filteredHistory =
    activeTab === 'all'
      ? history
      : history.filter((item) => item.type === activeTab);

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
        <h1 className="text-xl font-bold text-foreground">Historique</h1>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-4 mb-4"
      >
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Transaction List */}
      <div className="px-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
              >
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="space-y-1.5 text-right">
                  <Skeleton className="h-4 w-16 ml-auto" />
                  <Skeleton className="h-3 w-12 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredHistory.length === 0 ? (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <span className="text-5xl mb-4">📭</span>
              <p className="text-base font-medium text-foreground mb-1">
                {activeTab === 'all'
                  ? 'Aucune transaction'
                  : `Aucun${
                      activeTab === 'receive'
                        ? 'e'
                        : activeTab === 'deposit'
                        ? ''
                        : ''
                    } ${filterTabs.find((t) => t.id === activeTab)?.label.toLowerCase()}`}
              </p>
              <p className="text-sm text-muted-foreground">
                Vos transactions apparaîtront ici
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-xl"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {filteredHistory.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border transition-colors"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-lg shrink-0 ${getTypeBg(tx.type)}`}
                  >
                    {getTypeIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </p>
                      {getStatusBadge(tx.status)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-semibold ${
                        tx.type === 'receive' || tx.type === 'deposit'
                          ? 'text-emerald-600'
                          : tx.type === 'send'
                          ? 'text-red-500'
                          : 'text-orange-500'
                      }`}
                    >
                      {tx.type === 'receive' || tx.type === 'deposit'
                        ? '+'
                        : '-'}
                      {fmtCur(tx.amount, tx.currency)}
                    </p>
                    {tx.fee > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        Frais: {fmtCur(tx.fee, tx.currency)}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Bottom Spacer */}
      <div className="h-8" />
    </div>
  );
}
