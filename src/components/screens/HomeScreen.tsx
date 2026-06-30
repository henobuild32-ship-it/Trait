'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
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
  Globe,
  MessageSquare,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';
import TraitCard from '@/components/trait/TraitCard';
import { usePushSubscription } from '@/hooks/usePushSubscription';

interface UserCard {
  id: string;
  cardType: 'USD' | 'FC';
  cardNumber: string;
  cvv: string;
  qrCode: string;
  expiryDate: string;
  status: string;
}

interface PendingRequest {
  id: string;
  cardType: string;
  status: string;
  createdAt: string;
}

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
  { labelKey: 'action.send', icon: Send, page: 'send' as const, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400' },
  { labelKey: 'action.withdraw', icon: ArrowDownToLine, page: 'withdraw' as const, color: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' },
  { labelKey: 'action.deposit', icon: ArrowUpFromLine, page: 'deposit' as const, color: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400' },
  { labelKey: 'action.intl_transfer', icon: Globe, page: 'international-transfer' as const, color: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400' },
  { labelKey: 'action.history', icon: History, page: 'history' as const, color: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400' },
  { labelKey: 'action.marketplace', icon: Store, page: 'marketplace' as const, color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400' },
  { labelKey: 'Espace Service', icon: Store, page: 'seller-dashboard' as const, color: 'bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400' },
];

const agentQuickActions = [
  { labelKey: 'action.agent_deposit', icon: UserPlus, page: 'agent-deposit' as const, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400' },
  { labelKey: 'action.agent_validate', icon: ShieldCheck, page: 'agent-withdraw-validate' as const, color: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400' },
  { labelKey: 'action.agent_activity', icon: Activity, page: 'agent-activity' as const, color: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400' },
  { labelKey: 'action.ussd', icon: Phone, page: 'ussd' as const, color: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400' },
  { labelKey: 'action.marketplace', icon: Store, page: 'marketplace' as const, color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400' },
  { labelKey: 'action.messages', icon: MessageSquare, page: 'agent-messages' as const, color: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' },
];

function getTypeIcon(type: string) {
  switch (type) {
    case 'send': return ArrowUpRight;
    case 'receive': return ArrowDownLeft;
    case 'deposit': return ArrowDownLeft;
    case 'withdrawal': return ArrowUpRight;
    default: return History;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'send': return 'bg-red-50 text-red-500 dark:bg-red-950 dark:text-red-400';
    case 'receive': return 'bg-green-50 text-green-500 dark:bg-green-950 dark:text-green-400';
    case 'deposit': return 'bg-blue-50 text-blue-500 dark:bg-blue-950 dark:text-blue-400';
    case 'withdrawal': return 'bg-red-50 text-red-500 dark:bg-red-950 dark:text-red-400';
    default: return 'bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400';
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
  const { user, navigateTo, setUser } = useAppStore();
  const { t } = useTranslation();
  const [recentTransactions, setRecentTransactions] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  const isAgent = user?.role === 'agent';
  const realBalanceUSD = user?.realBalance ?? 0;
  const bonusBalanceUSD = user?.bonusBalance ?? 0;
  const totalUSD = realBalanceUSD + bonusBalanceUSD;
  const realBalanceFC = user?.realBalanceFC ?? 0;
  const bonusBalanceFC = user?.bonusBalanceFC ?? 0;
  const totalFC = realBalanceFC + bonusBalanceFC;

  const quickActions = isAgent ? agentQuickActions : clientQuickActions;
  const agentCode = user?.agentNumber || user?.agentCode;

  const { subscribe } = usePushSubscription();

  useEffect(() => {
    fetchRecentTransactions();
    refreshUserBalance();
    fetchUserCards();
    
    // Auto-subscribe to push notifications
    if ('serviceWorker' in navigator && 'PushManager' in window && Notification.permission === 'granted') {
      subscribe().catch(() => {});
    }
    
    // Real-time balance polling every 30 seconds
    const balanceInterval = setInterval(() => {
      refreshUserBalance();
    }, 30000);
    
    return () => clearInterval(balanceInterval);
  }, [user?.id]);

  async function refreshUserBalance() {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/auth/profile?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser({
            ...user,
            realBalance: data.user.realBalance,
            realBalanceFC: data.user.realBalanceFC,
            bonusBalance: data.user.bonusBalance,
            bonusBalanceFC: data.user.bonusBalanceFC,
          } as any);
        }
      }
    } catch {
      // Silently fail - use cached data
    }
  }

  async function fetchRecentTransactions() {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/transfer/history?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setRecentTransactions((data.history ?? []).slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserCards() {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/cards/my-cards?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setUserCards(data.cards || []);
        setPendingRequests(data.pendingRequests || []);
      }
    } catch {
      // silent
    }
  }

  const hasCards = userCards.length > 0;
  const hasPendingRequests = pendingRequests.length > 0;
  const showCardButton = !isAgent && !hasCards && !hasPendingRequests;

  function handleCopyCode() {
    if (!agentCode) return;
    navigator.clipboard?.writeText(agentCode);
    setCodeCopied(true);
    toast.success(t('home.copied'));
    setTimeout(() => setCodeCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ─── Top Bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* TRAIT Logo - WhatsApp style */}
            <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-gradient-to-br from-[#0D5C63] to-[#0A7B84] flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20">
              <div className="rounded-[6px] bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden w-[30px] h-[30px]">
                <Image
                  src="/trait-logo.png"
                  alt="TRAIT"
                  width={26}
                  height={26}
                  className="object-contain"
                />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground leading-none">
                {t('home.welcome')}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-base font-bold text-foreground truncate">
                  {user?.name || user?.pseudo || 'Utilisateur'}
                </h1>
                {isAgent && (
                  <Badge className="bg-[#0D5C63]/10 text-[#0D5C63] border-[#0D5C63]/20 text-[10px] font-semibold px-1.5 py-0 dark:bg-[#0D5C63]/20 dark:text-blue-300 dark:border-[#0D5C63]/30 shrink-0">
                    Agent
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full h-9 w-9"
            onClick={() => navigateTo('notifications')}
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="sr-only">{t('nav.notifications')}</span>
          </Button>
        </div>
      </header>

      <main className="px-4 pt-5 space-y-6">
        {/* ─── Agent Code Display ────────────────────────────── */}
        {isAgent && agentCode && (
          <Card className="border-[#0D5C63]/20 bg-[#0D5C63]/5 dark:border-[#0D5C63]/30 dark:bg-[#0D5C63]/10 shadow-lg shadow-blue-900/5">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0D5C63]/10 flex items-center justify-center shrink-0">
                <BadgeCheck className="size-5 text-[#0D5C63]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  {t('home.agent_code')}
                </p>
                <p className="text-lg font-bold font-mono text-[#0D5C63] tracking-wider dark:text-blue-300">
                  {agentCode}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-[#0D5C63] hover:text-[#0D5C63]/80 hover:bg-[#0D5C63]/10 text-xs font-medium dark:text-blue-300"
                onClick={handleCopyCode}
              >
                {codeCopied ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {codeCopied ? 'OK' : t('home.copy')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ─── Balance Cards ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {/* USD Balance */}
          <div className="rounded-2xl p-4 text-white shadow-lg shadow-blue-900/10 bg-gradient-to-br from-[#0D5C63] to-[#14888F] relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" />

            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <Wallet className="size-3.5" />
                </div>
                <p className="text-[11px] font-medium opacity-90">
                  {isAgent ? t('home.wallet_usd') : t('home.balance_usd')}
                </p>
              </div>
              <p className="text-xl font-bold tracking-tight leading-tight">
                $ {totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              {(bonusBalanceUSD > 0) && (
                <div className="mt-2 flex items-center gap-2 text-[10px] opacity-80">
                  <span>{t('home.real')}: ${realBalanceUSD.toFixed(2)}</span>
                  <span className="w-px h-3 bg-white/40" />
                  <span>+{t('home.bonus')}: ${bonusBalanceUSD.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* FC Balance */}
          <div className="rounded-2xl p-4 text-white shadow-lg shadow-red-900/10 bg-gradient-to-br from-[#DC2626] to-[#EF4444] relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" />

            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <Wallet className="size-3.5" />
                </div>
                <p className="text-[11px] font-medium opacity-90">
                  {isAgent ? t('home.wallet_fc') : t('home.balance_fc')}
                </p>
              </div>
              <p className="text-xl font-bold tracking-tight leading-tight">
                {totalFC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs font-medium opacity-80 ml-1">FC</span>
              </p>
              {(bonusBalanceFC > 0) && (
                <div className="mt-2 flex items-center gap-2 text-[10px] opacity-80">
                  <span>{t('home.real')}: {realBalanceFC.toFixed(2)}</span>
                  <span className="w-px h-3 bg-white/40" />
                  <span>+{t('home.bonus')}: {bonusBalanceFC.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Recommandé (Client only) ────────────────────── */}
        {!isAgent && (
          <section className="space-y-3">
            <h2 className="text-base font-bold text-foreground">Recommandé</h2>
            <Card
              className="border-primary/20 bg-gradient-to-br from-[#0D5C63]/5 via-background to-background dark:from-blue-950/20 shadow-md cursor-pointer hover:border-[#0D5C63]/40 active:scale-[0.98] transition-all relative overflow-hidden"
              onClick={() => navigateTo('child-sponsorship')}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#0D5C63]/10 to-transparent rounded-full -mr-8 -mt-8" />
              <CardContent className="p-4 flex items-start gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center shrink-0 mt-0.5 text-amber-500 font-bold text-lg shadow-sm">
                  ⭐
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    Parrainage
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Créez une carte TRAIT pour votre enfant, rechargez-la à tout moment et suivez ses dépenses en temps réel depuis votre compte parent.
                  </p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground/60 shrink-0 self-center" />
              </CardContent>
            </Card>
          </section>
        )}

        {/* ─── TRAIT Cards Section (Client only) ──────────── */}
        {!isAgent && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <CreditCard className="size-4 text-[#0D5C63]" />
                Mes Cartes TRAIT
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#0D5C63] hover:text-[#0D5C63]/80 hover:bg-[#0D5C63]/10 text-xs font-semibold dark:text-blue-400"
                onClick={() => navigateTo('card')}
              >
                Voir tout
                <ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
            </div>

            {/* Active cards */}
            {hasCards && (
              <div className="space-y-3 mb-3">
                {userCards.map((card) => (
                  <TraitCard
                    key={card.id}
                    cardType={card.cardType}
                    cardNumber={card.cardNumber}
                    cardHolder={user?.name || user?.pseudo || 'TRAIT USER'}
                    expiryDate={card.expiryDate}
                    cvv={card.cvv}
                    qrCode={card.qrCode}
                    balance={card.cardType === 'USD'
                      ? (user?.realBalance ?? 0)
                      : (user?.realBalanceFC ?? 0)
                    }
                    status={card.status}
                  />
                ))}
              </div>
            )}

            {/* Pending requests */}
            {hasPendingRequests && !hasCards && (
              <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/20">
                <CardContent className="flex items-center gap-3 p-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                    <Clock className="size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Demande en attente
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Votre demande de carte est en cours de validation.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Demander une carte button */}
            {showCardButton && (
              <button
                onClick={() => navigateTo('card-request')}
                className="w-full rounded-2xl p-4 shadow-sm border border-[#0D5C63]/20 bg-gradient-to-r from-[#0A1628] via-[#1E3A5F] to-[#0D2847] hover:shadow-lg hover:border-[#0D5C63]/40 transition-all active:scale-[0.98] relative overflow-hidden"
              >
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-blue-500/10" />
                <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-red-500/5" />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <CreditCard className="size-5 text-blue-300" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">
                      Demander une carte
                    </p>
                    <p className="text-[10px] text-blue-200/70 mt-0.5">
                      Carte numérique TRAIT USD ou FC
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-white/40 ml-auto" />
                </div>
              </button>
            )}
          </section>
        )}

        {/* ─── Quick Actions ─────────────────────────────────── */}
        <section>
          <div className={`grid gap-3 ${
            isAgent ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-3'
          }`}>
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.page}
                  onClick={() => {
                    if (action.labelKey === 'Espace Service') {
                      navigateTo(user?.role === 'seller' ? 'seller-dashboard' : 'seller-register');
                    } else {
                      navigateTo(action.page);
                    }
                  }}
                  className="flex flex-col items-center gap-2.5 rounded-2xl bg-card p-4 shadow-sm border border-border hover:shadow-md hover:border-[#0D5C63]/20 transition-all active:scale-[0.97] dark:hover:border-blue-500/30"
                >
                  <div className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center`}>
                    <Icon className="size-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-foreground text-center leading-tight">
                    {action.labelKey === 'Espace Service' 
                      ? (user?.role === 'seller' ? 'Espace Service' : 'Devenir un fournisseur de services') 
                      : t(action.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── Recent Transactions ───────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">
              {t('home.recent_transactions')}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#0D5C63] hover:text-[#0D5C63]/80 hover:bg-[#0D5C63]/10 text-xs font-semibold dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-500/10"
              onClick={() => navigateTo('history')}
            >
              {t('home.view_all')}
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                  <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <Card className="border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center mb-3">
                  <History className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">
                  {t('home.no_transactions')}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {isAgent
                    ? t('home.no_transactions_agent')
                    : t('home.no_transactions_client')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => {
                const TypeIcon = getTypeIcon(tx.type);
                const typeColor = getTypeColor(tx.type);
                const isReceive = tx.type === 'receive' || tx.type === 'deposit';
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:shadow-sm hover:border-[#0D5C63]/15 transition-all dark:hover:border-blue-500/20"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${typeColor} shrink-0`}>
                      <TypeIcon className="size-[18px]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {tx.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatDate(tx.createdAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-bold ${
                          isReceive
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-500 dark:text-red-400'
                        }`}
                      >
                        {isReceive ? '+' : '-'}
                        {fmtCurrency(tx.amount, tx.currency)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
