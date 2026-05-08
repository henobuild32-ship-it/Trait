'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Send,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Phone,
  Store,
  BadgeCheck,
  Activity,
  UserPlus,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

const clientQuickActions = [
  { emoji: '💸', label: 'Envoyer', icon: Send, page: 'send' as const },
  { emoji: '🏧', label: 'Retirer', icon: ArrowDownToLine, page: 'withdraw' as const },
  { emoji: '➕', label: 'Déposer', icon: ArrowUpFromLine, page: 'deposit' as const },
  { emoji: '📜', label: 'Historique', icon: History, page: 'history' as const },
  { emoji: '📶', label: 'USSD', icon: Phone, page: 'ussd' as const },
  { emoji: '🛒', label: 'Marketplace', icon: Store, page: 'marketplace' as const },
];

const agentQuickActions = [
  { emoji: '💵', label: 'Dépôt client', icon: UserPlus, page: 'agent-deposit' as const },
  { emoji: '✅', label: 'Valider retrait', icon: ShieldCheck, page: 'agent-withdraw-validate' as const },
  { emoji: '📊', label: 'Mon activité', icon: Activity, page: 'agent-activity' as const },
  { emoji: '📶', label: 'USSD', icon: Phone, page: 'ussd' as const },
  { emoji: '🛒', label: 'Marketplace', icon: Store, page: 'marketplace' as const },
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

function fmtCurrency(amount: number, currency: string) {
  const symbol = currency === 'FC' ? '' : '$';
  return `${symbol}${amount.toFixed(2)} ${currency === 'FC' ? 'FC' : 'USD'}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function HomeScreen() {
  const { user, navigateTo } = useAppStore();
  const [recentTransactions, setRecentTransactions] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isAgent = user?.role === 'agent';
  const realBalanceUSD = user?.realBalance ?? 0;
  const bonusBalanceUSD = user?.bonusBalance ?? 0;
  const totalUSD = realBalanceUSD + bonusBalanceUSD;
  const realBalanceFC = user?.realBalanceFC ?? 0;
  const bonusBalanceFC = user?.bonusBalanceFC ?? 0;
  const totalFC = realBalanceFC + bonusBalanceFC;

  const quickActions = isAgent ? agentQuickActions : clientQuickActions;

  useEffect(() => {
    fetchRecentTransactions();
  }, [user?.id]);

  async function fetchRecentTransactions() {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/transfer/history?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setRecentTransactions(data.history.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Bienvenue,</p>
            <h1 className="text-xl font-bold text-foreground">
              {user?.name || user?.pseudo || 'Utilisateur'}
            </h1>
          </div>
          {isAgent && (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-semibold px-2 py-0.5">
              Agent
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          onClick={() => navigateTo('notifications')}
        >
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>

      {/* Agent code display */}
      {isAgent && user?.agentCode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="px-4 mb-4"
        >
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <BadgeCheck className="size-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Code Agent</p>
                <p className="text-lg font-bold font-mono text-emerald-800 tracking-wider">
                  {user.agentCode}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-emerald-600 hover:text-emerald-700 text-xs"
                onClick={() => {
                  navigator.clipboard?.writeText(user.agentCode!);
                  toast.success('Code copié !');
                }}
              >
                Copier
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* USD Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="px-4 mb-3"
      >
        <div className={`rounded-2xl p-5 text-white shadow-lg ${
          isAgent
            ? 'bg-gradient-to-br from-amber-500 to-amber-700'
            : 'bg-gradient-to-br from-emerald-600 to-emerald-800'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="size-4 opacity-80" />
            <p className="text-sm opacity-80">
              {isAgent ? 'Portefeuille USD' : 'Solde USD'}
            </p>
          </div>
          <p className="text-3xl font-bold tracking-tight mb-3">
            {totalUSD.toFixed(2)} <span className="text-lg opacity-80">USD</span>
          </p>
          <div className="flex gap-5">
            <div>
              <p className="text-xs opacity-70 mb-0.5">Réel</p>
              <p className="text-base font-semibold">{realBalanceUSD.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs opacity-70 mb-0.5">Bonus</p>
              <p className="text-base font-semibold">{bonusBalanceUSD.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* FC Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        className="px-4 mb-6"
      >
        <div className="rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br from-blue-600 to-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="size-4 opacity-80" />
            <p className="text-sm opacity-80">
              {isAgent ? 'Portefeuille FC' : 'Solde FC'}
            </p>
          </div>
          <p className="text-3xl font-bold tracking-tight mb-3">
            {totalFC.toFixed(2)} <span className="text-lg opacity-80">FC</span>
          </p>
          <div className="flex gap-5">
            <div>
              <p className="text-xs opacity-70 mb-0.5">Réel</p>
              <p className="text-base font-semibold">{realBalanceFC.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs opacity-70 mb-0.5">Bonus</p>
              <p className="text-base font-semibold">{bonusBalanceFC.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        className="px-4 mb-6"
      >
        <div className={`grid gap-4 ${
          isAgent ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-3'
        }`}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.page}
                onClick={() => navigateTo(action.page)}
                className="flex flex-col items-center gap-2 rounded-xl bg-card p-4 shadow-sm border border-border transition-colors hover:bg-accent active:scale-95"
              >
                <span className="text-2xl">{action.emoji}</span>
                <span className={`text-xs font-medium text-foreground ${isAgent ? 'text-center leading-tight' : ''}`}>
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
        className="px-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Transactions récentes
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            onClick={() => navigateTo('history')}
          >
            Voir tout
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <span className="text-4xl mb-3">📭</span>
              <p className="text-sm text-muted-foreground">Aucune transaction</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isAgent
                  ? 'Les transactions de vos clients apparaîtront ici'
                  : 'Vos transactions apparaîtront ici'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-lg">
                  {getTypeIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {tx.description}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      tx.type === 'receive' || tx.type === 'deposit'
                        ? 'text-emerald-600'
                        : 'text-red-500'
                    }`}
                  >
                    {tx.type === 'receive' || tx.type === 'deposit' ? '+' : '-'}
                    {fmtCurrency(tx.amount, tx.currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
