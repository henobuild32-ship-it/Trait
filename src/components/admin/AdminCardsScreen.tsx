'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CreditCard,
  RefreshCw,
  Loader2,
  Phone,
  Mail,
  Calendar,
  User,
  Search,
  Plus,
  Printer,
  Send,
  Shield,
  ShieldOff,
  Ban,
  Play,
  Eye,
  X,
  Check,
  Filter,
  QrCode,
  Wallet,
  Clock,
  AlertTriangle,
  BadgeCheck,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import TraitCard from '@/components/trait/TraitCard';

// ─── Types ────────────────────────────────────────────────────────────

interface CardUser {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  photoId: string | null;
  isVerified: boolean;
  realBalance: number;
  realBalanceFC: number;
  suspended: boolean;
  createdAt: string;
}

interface TraitCardData {
  id: string;
  cardType: string;
  cardNumber: string;
  cvv: string;
  qrCode: string;
  expiryDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: CardUser;
  request: { id: string; status: string; createdAt: string };
  _count: { payments: number };
}

interface ClientForCard {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  photoId: string | null;
  isVerified: boolean;
  realBalance: number;
  realBalanceFC: number;
  suspended: boolean;
  createdAt: string;
  _count: { cards: number };
}

interface CardStats {
  total: number;
  active: number;
  suspended: number;
  blocked: number;
  usd: number;
  fc: number;
}

type FilterTab = 'all' | 'active' | 'suspended' | 'blocked';

// ─── Helpers ──────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return (
        <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/40">
          <Check className="h-2.5 w-2.5 mr-0.5" />
          Active
        </Badge>
      );
    case 'suspended':
      return (
        <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800/40">
          <ShieldOff className="h-2.5 w-2.5 mr-0.5" />
          Suspendue
        </Badge>
      );
    case 'blocked':
      return (
        <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800/40">
          <Ban className="h-2.5 w-2.5 mr-0.5" />
          Bloquée
        </Badge>
      );
    default:
      return null;
  }
}

function getCardTypeBadge(cardType: string) {
  if (cardType === 'USD') {
    return (
      <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400 font-semibold">
        USD
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] border-red-300 text-red-700 dark:border-red-700 dark:text-red-400 font-semibold">
      FC
    </Badge>
  );
}

// ─── Component ────────────────────────────────────────────────────────

export default function AdminCardsScreen() {
  const { goBack, admin } = useAppStore();

  // ─── State ───────────────────────────────────────────────────────
  const [cards, setCards] = useState<TraitCardData[]>([]);
  const [stats, setStats] = useState<CardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Generate card dialog
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [clients, setClients] = useState<ClientForCard[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientForCard | null>(null);
  const [selectedCardType, setSelectedCardType] = useState<'USD' | 'FC'>('USD');
  const [clientSearch, setClientSearch] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedCard, setGeneratedCard] = useState<any>(null);

  // Card detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<TraitCardData | null>(null);

  // Print ref
  const printRef = useRef<HTMLDivElement>(null);

  // ─── Fetch cards ─────────────────────────────────────────────────

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', activeTab);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/cards/admin/cards?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCards(data.cards || []);
        setStats(data.stats || null);
      } else {
        toast.error(data.message || 'Erreur lors du chargement');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // ─── Fetch clients ──────────────────────────────────────────────

  async function fetchClients() {
    setClientsLoading(true);
    try {
      const params = new URLSearchParams();
      if (clientSearch.trim()) params.set('search', clientSearch.trim());

      const res = await fetch(`/api/admin/clients?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setClients(data.clients || []);
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setClientsLoading(false);
    }
  }

  useEffect(() => {
    if (generateDialogOpen) {
      fetchClients();
    }
  }, [generateDialogOpen, clientSearch]);

  // ─── Filtered cards ─────────────────────────────────────────────

  const filteredCards = activeTab === 'all'
    ? cards
    : cards.filter((c) => c.status === activeTab);

  // ─── Action helpers ─────────────────────────────────────────────

  function setActionLoadingState(id: string, isLoading: boolean) {
    setActionLoading((prev) => ({ ...prev, [id]: isLoading }));
  }

  // ─── Generate card ──────────────────────────────────────────────

  async function handleGenerateCard() {
    if (!admin?.id || !selectedClient) {
      toast.error('Sélectionnez un client');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/cards/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          userId: selectedClient.id,
          cardType: selectedCardType,
          action: 'generate',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Carte générée avec succès !');
        setGeneratedCard(data.card);
        fetchCards();
        fetchClients();
      } else {
        toast.error(data.message || 'Erreur lors de la génération');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setGenerating(false);
    }
  }

  // ─── Suspend / Activate / Block card ────────────────────────────

  async function handleCardAction(cardId: string, action: 'suspend' | 'activate', apiRoute: string) {
    if (!admin?.id) return;

    setActionLoadingState(cardId, true);
    try {
      const res = await fetch(apiRoute, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: admin.id, cardId, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          action === 'suspend' ? 'Carte suspendue' : 'Carte réactivée'
        );
        fetchCards();
      } else {
        toast.error(data.message || 'Erreur');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoadingState(cardId, false);
    }
  }

  async function handleBlockCard(cardId: string) {
    if (!admin?.id) return;

    setActionLoadingState(cardId, true);
    try {
      const res = await fetch('/api/cards/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          cardId,
          action: 'block',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Carte bloquée');
        fetchCards();
      } else {
        toast.error(data.message || 'Erreur');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoadingState(cardId, false);
    }
  }

  // ─── Send card info ─────────────────────────────────────────────

  async function handleSendCardInfo(cardId: string) {
    if (!admin?.id) return;

    setActionLoadingState(cardId, true);
    try {
      const res = await fetch('/api/cards/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          cardId,
          action: 'send-info',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Informations envoyées au client');
      } else {
        toast.error(data.message || 'Erreur');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoadingState(cardId, false);
    }
  }

  // ─── Print card ─────────────────────────────────────────────────

  function handlePrintCard(card: TraitCardData) {
    setSelectedCard(card);
    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Impossible d\'ouvrir la fenêtre d\'impression');
        return;
      }

    const isUSD = card.cardType === 'USD';
    const accentColor = isUSD ? '#3B82F6' : '#EF4444';
    const bgColor = isUSD
      ? 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 40%, #0D2847 100%)'
      : 'linear-gradient(135deg, #1A0A0A 0%, #5F1E1E 40%, #470D0D 100%)';
    const formattedNumber = card.cardNumber.replace(/(.{4})/g, '$1 ').trim();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Carte TRAIT - ${card.cardNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f8fafc;
          }
          .card-container {
            width: 430px;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            background: ${bgColor};
            color: white;
            position: relative;
          }
          .card-dots {
            position: absolute;
            inset: 0;
            opacity: 0.06;
            background-image: radial-gradient(circle, ${accentColor} 1px, transparent 1px);
            background-size: 20px 20px;
          }
          .card-glow-1 {
            position: absolute;
            top: 0; right: 0;
            width: 200px; height: 200px;
            background: radial-gradient(ellipse at top right, ${accentColor}, transparent 70%);
            opacity: 0.2;
          }
          .card-glow-2 {
            position: absolute;
            bottom: 0; left: 0;
            width: 150px; height: 150px;
            background: radial-gradient(ellipse at bottom left, ${accentColor}, transparent 70%);
            opacity: 0.1;
          }
          .card-content {
            position: relative;
            z-index: 1;
            padding: 28px;
          }
          .card-label {
            position: absolute;
            top: 14px; right: 14px;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            background: ${accentColor}30;
            color: ${accentColor};
            border: 1px solid ${accentColor}40;
          }
          .card-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 32px;
          }
          .card-logo {
            width: 36px; height: 36px;
            border-radius: 10px;
            background: ${accentColor}20;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .card-logo svg { color: ${accentColor}; }
          .card-brand { font-size: 16px; font-weight: 900; letter-spacing: 2px; }
          .card-sub { font-size: 8px; color: rgba(255,255,255,0.4); font-weight: 500; letter-spacing: 1px; margin-top: 2px; }
          .card-number-label { font-size: 10px; color: rgba(255,255,255,0.4); font-weight: 500; letter-spacing: 1px; margin-bottom: 6px; }
          .card-number { font-size: 22px; font-family: monospace; font-weight: 700; letter-spacing: 4px; margin-bottom: 28px; }
          .card-bottom { display: flex; align-items: flex-end; justify-content: space-between; }
          .card-name-label { font-size: 8px; color: rgba(255,255,255,0.4); font-weight: 500; letter-spacing: 1px; margin-bottom: 4px; }
          .card-name { font-size: 14px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
          .card-qr {
            width: 56px; height: 56px;
            border-radius: 10px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .card-qr-inner {
            width: 40px; height: 40px;
            border-radius: 6px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .card-qr-pattern {
            width: 30px; height: 30px;
            background: ${isUSD ? '#0A1628' : '#1A0A0A'};
            opacity: 0.8;
          }
          .card-balance-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 18px;
            padding-top: 18px;
            border-top: 1px solid rgba(255,255,255,0.1);
          }
          .balance-label { font-size: 8px; color: rgba(255,255,255,0.4); font-weight: 500; letter-spacing: 1px; }
          .balance-value { font-size: 18px; font-weight: 700; }
          .security-badge {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .security-text { font-size: 9px; font-weight: 600; letter-spacing: 1px; color: ${accentColor}; opacity: 0.8; }
          .back-section {
            margin-top: 20px;
            padding: 20px 28px;
            background: ${isUSD ? '#0D2847' : '#470D0D'};
            border-radius: 12px;
            color: white;
          }
          .back-title { font-size: 12px; font-weight: 700; margin-bottom: 12px; }
          .back-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .back-label { font-size: 10px; color: rgba(255,255,255,0.5); }
          .back-value { font-size: 10px; font-weight: 600; }
          .back-cvv { font-size: 16px; font-family: monospace; font-weight: 700; letter-spacing: 4px; }
          .print-footer {
            text-align: center;
            margin-top: 16px;
            font-size: 10px;
            color: #94a3b8;
          }
          @media print {
            body { background: white; }
          }
        </style>
      </head>
      <body>
        <div>
          <div class="card-container">
            <div class="card-dots"></div>
            <div class="card-glow-1"></div>
            <div class="card-glow-2"></div>
            <div class="card-content">
              <div class="card-label">CARTE ${card.cardType}</div>
              <div class="card-header">
                <div class="card-logo">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="22" height="16" x="1" y="4" rx="2"/><line x1="1" x2="23" y1="10" y2="10"/>
                  </svg>
                </div>
                <div>
                  <div class="card-brand">TRAIT</div>
                  <div class="card-sub">CARTE NUMÉRIQUE</div>
                </div>
              </div>
              <div class="card-number-label">NUMÉRO CRYPTÉ</div>
              <div class="card-number">${formattedNumber}</div>
              <div class="card-bottom">
                <div>
                  <div class="card-name-label">NOM DU TITULAIRE</div>
                  <div class="card-name">${card.user?.name || 'TITULAIRE'}</div>
                </div>
                <div class="card-qr">
                  <div class="card-qr-inner">
                    <div class="card-qr-pattern"></div>
                  </div>
                </div>
              </div>
              <div class="card-balance-row">
                <div>
                  <div class="balance-label">SOLDE DISPONIBLE</div>
                  <div class="balance-value">${isUSD ? '$' : ''}${isUSD ? card.user?.realBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) : card.user?.realBalanceFC?.toLocaleString('en-US', { minimumFractionDigits: 2 })}${isUSD ? '' : ' FC'}</div>
                </div>
                <div class="security-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span class="security-text">SÉCURISÉE PAR TRAIT</span>
                </div>
              </div>
            </div>
          </div>
          <div class="back-section">
            <div class="back-title">Informations de sécurité</div>
            <div class="back-row">
              <span class="back-label">Code de sécurité (CCV)</span>
              <span class="back-cvv">${card.cvv}</span>
            </div>
            <div class="back-row">
              <span class="back-label">Date d'expiration</span>
              <span class="back-value">${card.expiryDate}</span>
            </div>
            <div class="back-row">
              <span class="back-label">Type de carte</span>
              <span class="back-value">TRAIT ${card.cardType}</span>
            </div>
            <div class="back-row">
              <span class="back-label">ID Carte</span>
              <span class="back-value">${card.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>
          <div class="print-footer">
            TRAIT – Carte numérique sécurisée | Imprimé le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    }, 100);
  }

  // ─── Open card detail ───────────────────────────────────────────

  function openCardDetail(card: TraitCardData) {
    setSelectedCard(card);
    setDetailDialogOpen(true);
  }

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' as const }}
        className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-border"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={goBack}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Retour</span>
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground leading-tight">
              Cartes
            </h1>
            <p className="text-xs text-muted-foreground">
              Gestion des cartes numériques TRAIT
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setLoading(true); fetchCards(); }}
              disabled={loading}
              className="rounded-full"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full px-4 gap-1.5"
              onClick={() => {
                setSelectedClient(null);
                setGeneratedCard(null);
                setSelectedCardType('USD');
                setGenerateDialogOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Générer
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="px-4 pt-4 space-y-4">
        {/* ─── Stats Grid ─────────────────────────────────────────── */}
        {stats && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-3 gap-2.5"
          >
            {[
              { label: 'Total', value: stats.total, color: 'text-foreground', bg: 'bg-muted', icon: CreditCard },
              { label: 'Actives', value: stats.active, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40', icon: Check },
              { label: 'Suspendues', value: stats.suspended, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40', icon: ShieldOff },
              { label: 'Bloquées', value: stats.blocked, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40', icon: Ban },
              { label: 'USD', value: stats.usd, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', icon: Wallet },
              { label: 'FC', value: stats.fc, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30', icon: Wallet },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  <Card className="border-border">
                    <CardContent className="p-3 text-center">
                      <div className={`w-7 h-7 rounded-md ${stat.bg} flex items-center justify-center mx-auto mb-1.5`}>
                        <Icon className={`h-3.5 w-3.5 ${stat.color}`} />
                      </div>
                      <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {loading && stats === null && (
          <div className="grid grid-cols-3 gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <Skeleton className="h-7 w-7 rounded-md mx-auto mb-1.5" />
                  <Skeleton className="h-6 w-10 mx-auto mb-1" />
                  <Skeleton className="h-3 w-12 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ─── Search ─────────────────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, téléphone ou numéro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl text-sm bg-muted/50 border-border"
          />
        </div>

        {/* ─── Filter Tabs ────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all" className="text-xs gap-1">
              Tous
              {stats && stats.total > 0 && (
                <span className="ml-0.5 bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">
                  {stats.total}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs gap-1">
              <Check className="h-3 w-3" />
              Actives
            </TabsTrigger>
            <TabsTrigger value="suspended" className="text-xs gap-1">
              <ShieldOff className="h-3 w-3" />
              Suspendues
            </TabsTrigger>
            <TabsTrigger value="blocked" className="text-xs gap-1">
              <Ban className="h-3 w-3" />
              Bloquées
            </TabsTrigger>
          </TabsList>

          {/* ─── Cards List ───────────────────────────────────────── */}
          {['all', 'active', 'suspended', 'blocked'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-3">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <div className="flex gap-1.5">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredCards.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-lg">Aucune carte</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {tab === 'all'
                      ? 'Aucune carte générée pour le moment'
                      : `Aucune carte ${tab === 'active' ? 'active' : tab === 'suspended' ? 'suspendue' : 'bloquée'}`}
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredCards.map((card, index) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.25, delay: index * 0.03 }}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            {/* Top: User info + badges */}
                            <div className="flex items-start gap-3 mb-3">
                              {card.user?.photoId ? (
                                <div className="h-11 w-11 rounded-full overflow-hidden shrink-0 border-2 border-border">
                                  <Image
                                    src={card.user.photoId}
                                    alt={card.user.name || 'Client'}
                                    width={44}
                                    height={44}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center shrink-0">
                                  <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-sm font-semibold text-foreground truncate">
                                    {card.user?.name || 'Client'}
                                  </h3>
                                  {getCardTypeBadge(card.cardType)}
                                  {getStatusBadge(card.status)}
                                </div>
                                <p className="text-xs font-mono text-muted-foreground mt-0.5 tracking-wider">
                                  {card.cardNumber.replace(/(.{4})/g, '$1 ').trim()}
                                </p>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-3">
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span className="truncate">{card.user?.phone}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3 shrink-0" />
                                <span>Exp: {card.expiryDate}</span>
                              </div>
                              {card.user?.email && (
                                <div className="flex items-center gap-1.5">
                                  <Mail className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{card.user.email}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>{formatDate(card.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Wallet className="h-3 w-3 shrink-0" />
                                <span className="font-semibold">
                                  {card.cardType === 'USD'
                                    ? `$${(card.user?.realBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                                    : `${(card.user?.realBalanceFC ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} FC`}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <QrCode className="h-3 w-3 shrink-0" />
                                <span className="truncate">{card._count.payments} paiement(s)</span>
                              </div>
                            </div>

                            <Separator className="my-2.5" />

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 text-[11px] gap-1"
                                onClick={() => openCardDetail(card)}
                              >
                                <Eye className="h-3 w-3" />
                                Voir
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 text-[11px] gap-1"
                                onClick={() => handlePrintCard(card)}
                              >
                                <Printer className="h-3 w-3" />
                                Imprimer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 text-[11px] gap-1"
                                onClick={() => handleSendCardInfo(card.id)}
                                disabled={actionLoading[card.id]}
                              >
                                {actionLoading[card.id] ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                                Envoyer
                              </Button>

                              {card.status === 'active' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2.5 text-[11px] gap-1 text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20"
                                    onClick={() => handleCardAction(card.id, 'suspend', '/api/cards/admin/manage')}
                                    disabled={actionLoading[card.id]}
                                  >
                                    {actionLoading[card.id] ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <ShieldOff className="h-3 w-3" />
                                    )}
                                    Suspendre
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2.5 text-[11px] gap-1 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                                    onClick={() => handleBlockCard(card.id)}
                                    disabled={actionLoading[card.id]}
                                  >
                                    {actionLoading[card.id] ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Ban className="h-3 w-3" />
                                    )}
                                    Bloquer
                                  </Button>
                                </>
                              )}

                              {(card.status === 'suspended' || card.status === 'blocked') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2.5 text-[11px] gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-900/20"
                                  onClick={() => handleCardAction(card.id, 'activate', '/api/cards/admin/manage')}
                                  disabled={actionLoading[card.id]}
                                >
                                  {actionLoading[card.id] ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Play className="h-3 w-3" />
                                  )}
                                  Réactiver
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* ─── Generate Card Dialog ────────────────────────────────── */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              Générer une carte TRAIT
            </DialogTitle>
            <DialogDescription>
              Sélectionnez un client et le type de carte à générer
            </DialogDescription>
          </DialogHeader>

          {generatedCard ? (
            /* ─── Generated Card Preview ──────────────────────────── */
            <div className="space-y-4 py-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, type: 'spring' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <BadgeCheck className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-600">
                    Carte générée avec succès !
                  </p>
                </div>

                <TraitCard
                  cardType={generatedCard.cardType as 'USD' | 'FC'}
                  cardNumber={generatedCard.cardNumber}
                  cardHolder={selectedClient?.name || 'TITULAIRE'}
                  expiryDate={generatedCard.expiryDate}
                  cvv={generatedCard.cvv}
                  qrCode={generatedCard.qrCode}
                  balance={generatedCard.cardType === 'USD'
                    ? (selectedClient?.realBalance ?? 0)
                    : (selectedClient?.realBalanceFC ?? 0)
                  }
                  status="active"
                />
              </motion.div>

              <Card className="bg-muted/30 border-dashed">
                <CardContent className="p-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Numéro</p>
                      <p className="font-mono font-semibold">{generatedCard.cardNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CCV</p>
                      <p className="font-mono font-semibold">{generatedCard.cvv}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expiration</p>
                      <p className="font-semibold">{generatedCard.expiryDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">QR Code</p>
                      <p className="font-mono text-[10px] truncate">{generatedCard.qrCode}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
                <Send className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Les informations de la carte ont été automatiquement envoyées au client via notifications et messages.
                </p>
              </div>
            </div>
          ) : (
            /* ─── Client Selection ────────────────────────────────── */
            <div className="space-y-4 py-2">
              {/* Card type selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Type de carte</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedCardType('USD')}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      selectedCardType === 'USD'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-border hover:border-emerald-300'
                    }`}
                  >
                    <p className="text-sm font-bold text-emerald-600">USD</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Dollar US</p>
                  </button>
                  <button
                    onClick={() => setSelectedCardType('FC')}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      selectedCardType === 'FC'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-border hover:border-red-300'
                    }`}
                  >
                    <p className="text-sm font-bold text-red-600">FC</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Franc Congolais</p>
                  </button>
                </div>
              </div>

              {/* Client search */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Rechercher un client</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nom, téléphone ou email..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pl-9 h-10 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Client list */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {clientsLoading ? (
                  <div className="space-y-2 py-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-36" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : clients.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-6">
                    Aucun client trouvé
                  </p>
                ) : (
                  clients.map((client) => {
                    const isSelected = selectedClient?.id === client.id;
                    return (
                      <button
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-transparent hover:bg-muted/50 hover:border-border'
                        }`}
                      >
                        {client.photoId ? (
                          <div className="h-9 w-9 rounded-full overflow-hidden shrink-0 border border-border">
                            <Image
                              src={client.photoId}
                              alt={client.name || 'Client'}
                              width={36}
                              height={36}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold truncate">
                              {client.name || 'Sans nom'}
                            </p>
                            {client.isVerified && (
                              <BadgeCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {client.phone}
                            {client.email && ` • ${client.email}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-muted-foreground">
                            {client._count.cards} carte(s)
                          </p>
                          {client.suspended && (
                            <Badge className="text-[9px] bg-red-100 text-red-600 mt-0.5">Suspendu</Badge>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Selected client details */}
              {selectedClient && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-muted/50 border border-border"
                >
                  <p className="text-xs font-semibold mb-2 text-foreground">Informations du client</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      <span className="truncate">{selectedClient.name || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      <span className="truncate">{selectedClient.phone}</span>
                    </div>
                    {selectedClient.email && (
                      <div className="flex items-center gap-1.5 col-span-2">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{selectedClient.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Wallet className="h-3 w-3 text-emerald-600" />
                      <span className="font-semibold text-emerald-600">
                        ${selectedClient.realBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wallet className="h-3 w-3 text-red-600" />
                      <span className="font-semibold text-red-600">
                        {selectedClient.realBalanceFC.toLocaleString('en-US', { minimumFractionDigits: 2 })} FC
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      <span>Inscrit le {formatDateShort(selectedClient.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-3 w-3" />
                      <span>{selectedClient._count.cards} carte(s)</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          <DialogFooter>
            {!generatedCard ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setGenerateDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleGenerateCard}
                  disabled={!selectedClient || generating || selectedClient.suspended}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Générer la carte {selectedCardType}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setGenerateDialogOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Terminer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Card Detail Dialog ──────────────────────────────────── */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedCard && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  Détails de la carte
                </DialogTitle>
                <DialogDescription>
                  {selectedCard.cardNumber.replace(/(.{4})/g, '$1 ').trim()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Card preview */}
                <TraitCard
                  cardType={selectedCard.cardType as 'USD' | 'FC'}
                  cardNumber={selectedCard.cardNumber}
                  cardHolder={selectedCard.user?.name || 'TITULAIRE'}
                  expiryDate={selectedCard.expiryDate}
                  cvv={selectedCard.cvv}
                  qrCode={selectedCard.qrCode}
                  balance={selectedCard.cardType === 'USD'
                    ? (selectedCard.user?.realBalance ?? 0)
                    : (selectedCard.user?.realBalanceFC ?? 0)
                  }
                  status={selectedCard.status}
                />

                {/* Owner info */}
                <Card className="border-border">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      Propriétaire
                    </p>
                    <div className="flex items-center gap-3">
                      {selectedCard.user?.photoId ? (
                        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-border">
                          <Image
                            src={selectedCard.user.photoId}
                            alt={selectedCard.user.name || ''}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{selectedCard.user?.name || 'Sans nom'}</p>
                        <p className="text-xs text-muted-foreground">{selectedCard.user?.phone}</p>
                        {selectedCard.user?.email && (
                          <p className="text-xs text-muted-foreground truncate">{selectedCard.user.email}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {selectedCard.user?.isVerified && (
                          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">
                            <BadgeCheck className="h-3 w-3 mr-0.5" />
                            Vérifié
                          </Badge>
                        )}
                        {getStatusBadge(selectedCard.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card details */}
                <Card className="border-border">
                  <CardContent className="p-4 space-y-2.5">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      Informations de la carte
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Numéro de carte</p>
                        <p className="font-mono font-semibold">{selectedCard.cardNumber}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-semibold">{selectedCard.cardType}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">CCV</p>
                        <p className="font-mono font-semibold">{selectedCard.cvv}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expiration</p>
                        <p className="font-semibold">{selectedCard.expiryDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ID Carte</p>
                        <p className="font-mono text-[10px] truncate">{selectedCard.id}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">QR Code</p>
                        <p className="font-mono text-[10px] truncate">{selectedCard.qrCode}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Solde {selectedCard.cardType}</p>
                        <p className="font-semibold">
                          {selectedCard.cardType === 'USD'
                            ? `$${(selectedCard.user?.realBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                            : `${(selectedCard.user?.realBalanceFC ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} FC`}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Paiements</p>
                        <p className="font-semibold">{selectedCard._count.payments}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card className="border-border">
                  <CardContent className="p-4 space-y-2">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Historique
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Créée le {formatDate(selectedCard.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>Dernière modification le {formatDate(selectedCard.updatedAt)}</span>
                      </div>
                      {selectedCard.request && (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          <span>Demande: {formatDate(selectedCard.request.createdAt)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePrintCard(selectedCard)}
                  className="gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  Imprimer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSendCardInfo(selectedCard.id)}
                  disabled={actionLoading[selectedCard.id]}
                  className="gap-1.5"
                >
                  {actionLoading[selectedCard.id] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Envoyer au client
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div ref={printRef} />
    </div>
  );
}
