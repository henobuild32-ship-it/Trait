'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  X,
  Loader2,
  Check,
  XCircle,
  Eye,
  Ban,
  AlertTriangle,
  Copy,
  CheckCheck,
  DollarSign,
  Users,
  Activity,
  RefreshCw,
  Clock,
  Terminal,
  Key,
  Globe,
  Mail,
  Phone,
  Building,
  Shield,
  Code2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────

interface Developer {
  id: string;
  fullName: string;
  companyName: string | null;
  email: string;
  phone: string;
  country: string;
  appName: string;
  projectType: string;
  description: string | null;
  appUrl: string | null;
  userEstimate: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  publicKey: string | null;
  secretKey: string | null;
  webhookUrl: string | null;
  totalCommissions: number;
  transactionCount: number;
  totalVolume: number;
  rejectReason: string | null;
  createdAt: string;
}

interface DeveloperStats {
  total: number;
  pending: number;
  approved: number;
  totalCommissions: number;
  totalVolume: number;
}

type TabStatus = 'pending' | 'approved' | 'rejected';

// ─── Helpers ──────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return (
        <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800/40">
          <Clock className="h-3 w-3 mr-1" />
          En attente
        </Badge>
      );
    case 'approved':
      return (
        <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/40">
          <Shield className="h-3 w-3 mr-1" />
          Approuvé
        </Badge>
      );
    case 'rejected':
      return (
        <Badge className="text-xs bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800/40">
          <XCircle className="h-3 w-3 mr-1" />
          Refusé
        </Badge>
      );
    case 'suspended':
      return (
        <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800/40">
          <Ban className="h-3 w-3 mr-1" />
          Suspendu
        </Badge>
      );
    default:
      return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────

export default function AdminDevelopersScreen() {
  const { admin, goBack } = useAppStore();

  // Data
  const [pendingDevs, setPendingDevs] = useState<Developer[]>([]);
  const [approvedDevs, setApprovedDevs] = useState<Developer[]>([]);
  const [rejectedDevs, setRejectedDevs] = useState<Developer[]>([]);
  const [stats, setStats] = useState<DeveloperStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState<TabStatus>('pending');

  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailDev, setDetailDev] = useState<Developer | null>(null);

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Developer | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  // Suspend dialog
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<Developer | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendLoading, setSuspendLoading] = useState(false);

  // API Keys dialog
  const [keysDialogOpen, setKeysDialogOpen] = useState(false);
  const [keysDev, setKeysDev] = useState<Developer | null>(null);
  const [generatedKeys, setGeneratedKeys] = useState<{
    publicKey: string;
    secretKey: string;
    webhookUrl: string;
  } | null>(null);
  const [keysLoading, setKeysLoading] = useState(false);
  const [sendEmailLoading, setSendEmailLoading] = useState(false);

  // Copy state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Action loading
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ─── Debounce search ──────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── Fetch developers ─────────────────────────────────────────────

  const fetchDevelopers = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const statuses: TabStatus[] = ['pending', 'approved', 'rejected'];
      const results = await Promise.allSettled(
        statuses.map(async (status) => {
          const params = new URLSearchParams({ status });
          if (search.trim()) {
            params.set('search', search.trim());
          }
          const res = await fetch(`/api/developers?${params.toString()}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Erreur');
          return { status, developers: (data.developers ?? []) as Developer[] };
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { status, developers } = result.value;
          switch (status) {
            case 'pending':
              setPendingDevs(developers);
              break;
            case 'approved':
              setApprovedDevs(developers);
              break;
            case 'rejected':
              setRejectedDevs(developers);
              break;
          }
        }
      }

      // Fetch stats
      try {
        const statsRes = await fetch('/api/developers?stats=true');
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats ?? null);
        }
      } catch {
        // Stats fetch failure is non-critical
      }
    } catch (err) {
      console.error('Failed to fetch developers:', err);
      toast.error('Erreur lors du chargement des développeurs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevelopers(debouncedSearch);
  }, [fetchDevelopers, debouncedSearch]);

  // ─── Filtered developers ─────────────────────────────────────────

  const getFilteredDevs = (devs: Developer[]): Developer[] => {
    if (!debouncedSearch.trim()) return devs;
    const q = debouncedSearch.toLowerCase();
    return devs.filter(
      (d) =>
        d.fullName.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.appName.toLowerCase().includes(q) ||
        (d.companyName?.toLowerCase().includes(q) ?? false)
    );
  };

  const currentDevs = getFilteredDevs(
    activeTab === 'pending'
      ? pendingDevs
      : activeTab === 'approved'
        ? approvedDevs
        : rejectedDevs
  );

  const totalCounts = {
    pending: pendingDevs.length,
    approved: approvedDevs.length,
    rejected: rejectedDevs.length,
  };

  // ─── Copy helper ─────────────────────────────────────────────────

  async function copyToClipboard(text: string, field: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copié !');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Échec de la copie');
    }
  }

  // ─── Action handlers ─────────────────────────────────────────────

  function openDetailDialog(dev: Developer) {
    setDetailDev(dev);
    setDetailDialogOpen(true);
  }

  function openRejectDialog(dev: Developer) {
    setRejectTarget(dev);
    setRejectReason('');
    setRejectDialogOpen(true);
  }

  function openSuspendDialog(dev: Developer) {
    setSuspendTarget(dev);
    setSuspendReason('');
    setSuspendDialogOpen(true);
  }

  function openKeysDialog(dev: Developer) {
    setKeysDev(dev);
    setGeneratedKeys(null);
    setKeysDialogOpen(true);
  }

  // ─── Approve ─────────────────────────────────────────────────────

  async function handleApprove(dev: Developer) {
    if (!admin?.id) {
      toast.error('Session admin invalide');
      return;
    }

    setActionLoading(dev.id);
    try {
      const res = await fetch('/api/developers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          action: 'approve',
          developerId: dev.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${dev.fullName} a été approuvé`);
        fetchDevelopers(debouncedSearch);
      } else {
        toast.error(data.error || "Échec de l'approbation");
      }
    } catch (err) {
      console.error('Approve error:', err);
      toast.error("Erreur lors de l'approbation");
    } finally {
      setActionLoading(null);
    }
  }

  // ─── Reject ──────────────────────────────────────────────────────

  async function handleRejectSubmit() {
    if (!rejectTarget || !admin?.id) {
      toast.error('Données manquantes');
      return;
    }
    if (!rejectReason.trim()) {
      toast.error('Veuillez saisir une raison du refus');
      return;
    }

    setRejectLoading(true);
    try {
      const res = await fetch('/api/developers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          action: 'reject',
          developerId: rejectTarget.id,
          reason: rejectReason.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${rejectTarget.fullName} a été refusé`);
        setRejectDialogOpen(false);
        setRejectTarget(null);
        fetchDevelopers(debouncedSearch);
      } else {
        toast.error(data.error || 'Échec du refus');
      }
    } catch (err) {
      console.error('Reject error:', err);
      toast.error('Erreur lors du refus');
    } finally {
      setRejectLoading(false);
    }
  }

  // ─── Suspend ─────────────────────────────────────────────────────

  async function handleSuspendSubmit() {
    if (!suspendTarget || !admin?.id) {
      toast.error('Données manquantes');
      return;
    }

    setSuspendLoading(true);
    try {
      const res = await fetch('/api/developers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          action: 'suspend',
          developerId: suspendTarget.id,
          reason: suspendReason.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${suspendTarget.fullName} a été suspendu`);
        setSuspendDialogOpen(false);
        setSuspendTarget(null);
        fetchDevelopers(debouncedSearch);
      } else {
        toast.error(data.error || 'Échec de la suspension');
      }
    } catch (err) {
      console.error('Suspend error:', err);
      toast.error('Erreur lors de la suspension');
    } finally {
      setSuspendLoading(false);
    }
  }

  // ─── Generate Keys ───────────────────────────────────────────────

  async function handleGenerateKeys() {
    if (!keysDev || !admin?.id) {
      toast.error('Données manquantes');
      return;
    }

    setKeysLoading(true);
    try {
      const res = await fetch('/api/developers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          action: 'generate-keys',
          developerId: keysDev.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setGeneratedKeys({
          publicKey: data.publicKey ?? '',
          secretKey: data.secretKey ?? '',
          webhookUrl: data.webhookUrl ?? '',
        });
        toast.success('Clés API générées avec succès');
        fetchDevelopers(debouncedSearch);
      } else {
        toast.error(data.error || "Échec de la génération des clés");
      }
    } catch (err) {
      console.error('Generate keys error:', err);
      toast.error('Erreur lors de la génération des clés');
    } finally {
      setKeysLoading(false);
    }
  }

  // ─── Send keys by email ──────────────────────────────────────────

  async function handleSendKeysByEmail() {
    if (!keysDev || !admin?.id) { toast.error('Données manquantes'); return }
    setSendEmailLoading(true)
    try {
      const res = await fetch('/api/developers/send-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          developerId: keysDev.id,
          publicKey: generatedKeys?.publicKey || keysDev.publicKey,
          secretKey: generatedKeys?.secretKey || keysDev.secretKey,
          webhookUrl: generatedKeys?.webhookUrl || keysDev.webhookUrl,
          email: keysDev.email,
          name: keysDev.fullName,
          appName: keysDev.appName,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Clés envoyées à ${keysDev.email}`)
      } else {
        toast.error(data.error || "Échec de l'envoi")
      }
    } catch {
      toast.error("Erreur lors de l'envoi")
    } finally {
      setSendEmailLoading(false)
    }
  }

  // ─── Reactivate ──────────────────────────────────────────────────

  async function handleReactivate(dev: Developer) {
    if (!admin?.id) {
      toast.error('Session admin invalide');
      return;
    }

    setActionLoading(dev.id);
    try {
      const res = await fetch('/api/developers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          action: 'reactivate',
          developerId: dev.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${dev.fullName} a été réactivé`);
        fetchDevelopers(debouncedSearch);
      } else {
        toast.error(data.error || 'Échec de la réactivation');
      }
    } catch (err) {
      console.error('Reactivate error:', err);
      toast.error('Erreur lors de la réactivation');
    } finally {
      setActionLoading(null);
    }
  }

  // ─── Render developer card ───────────────────────────────────────

  function renderDevCard(dev: Developer, index: number) {
    const isPending = dev.status === 'pending';
    const isApproved = dev.status === 'approved';
    const isSuspended = dev.status === 'suspended';
    const isRejected = dev.status === 'rejected';

    return (
      <motion.div
        key={dev.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: index * 0.03, ease: 'easeOut' as const }}
      >
        <Card
          className={`border-border hover:shadow-md transition-shadow cursor-pointer ${
            isPending
              ? 'border-amber-200 dark:border-amber-800/40'
              : isSuspended
                ? 'border-orange-200 dark:border-orange-800/40 opacity-70'
                : isRejected
                  ? 'border-red-200 dark:border-red-800/40'
                  : ''
          }`}
        >
          <CardContent className="p-4">
            {/* Top row: name + status + actions */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div
                className="flex items-center gap-2 flex-wrap min-w-0 flex-1"
                onClick={() => openDetailDialog(dev)}
              >
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Code2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {dev.fullName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {getStatusBadge(dev.status)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
                  onClick={() => openDetailDialog(dev)}
                  title="Voir les détails"
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Détails</span>
                </Button>

                {isPending && (
                  <>
                    <Button
                      size="sm"
                      className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                      onClick={() => handleApprove(dev)}
                      disabled={actionLoading === dev.id}
                    >
                      {actionLoading === dev.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1" />
                          <span className="hidden sm:inline">Approuver</span>
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 px-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium"
                      onClick={() => openRejectDialog(dev)}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      <span className="hidden sm:inline">Refuser</span>
                    </Button>
                  </>
                )}

                {isApproved && (
                  <>
                    <Button
                      size="sm"
                      className="h-8 px-2.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium"
                      onClick={() => openKeysDialog(dev)}
                    >
                      <Key className="h-3.5 w-3.5 mr-1" />
                      <span className="hidden sm:inline">Clés API</span>
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 px-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium"
                      onClick={() => openSuspendDialog(dev)}
                    >
                      <Ban className="h-3.5 w-3.5 mr-1" />
                      <span className="hidden sm:inline">Suspendre</span>
                    </Button>
                  </>
                )}

                {(isSuspended || isRejected) && (
                  <Button
                    size="sm"
                    className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                    onClick={() => handleReactivate(dev)}
                    disabled={actionLoading === dev.id}
                  >
                    {actionLoading === dev.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden sm:inline">Réactiver</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{dev.email}</span>
              </div>
              {dev.companyName && (
                <div className="flex items-center gap-2">
                  <Building className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{dev.companyName}</span>
                </div>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{dev.appName}</span>
                </div>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {dev.projectType}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {dev.country}
                </Badge>
              </div>
              {isApproved && (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium text-foreground">{formatAmount(dev.totalCommissions)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-slate-500" />
                    <span>{dev.transactionCount} tx</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-slate-500" />
                    <span>Vol: {formatAmount(dev.totalVolume)}</span>
                  </div>
                </div>
              )}
              {isSuspended && dev.rejectReason && (
                <div className="mt-2 rounded-md bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 px-2.5 py-1.5">
                  <p className="text-[11px] text-orange-700 dark:text-orange-400">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    <strong>Raison :</strong> {dev.rejectReason}
                  </p>
                </div>
              )}
              {isRejected && dev.rejectReason && (
                <div className="mt-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 px-2.5 py-1.5">
                  <p className="text-[11px] text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    <strong>Raison :</strong> {dev.rejectReason}
                  </p>
                </div>
              )}
            </div>

            <Separator className="my-3" />

            {/* Bottom row: date */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDate(dev.createdAt)}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{dev.userEstimate} utilisateurs</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ─── Render skeleton ─────────────────────────────────────────────

  function renderSkeletons() {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-16 rounded-md" />
                  <Skeleton className="h-8 w-16 rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ─── Render empty state ──────────────────────────────────────────

  function renderEmptyState(status: TabStatus) {
    const messages: Record<TabStatus, { icon: typeof Clock; title: string; desc: string }> = {
      pending: {
        icon: Clock,
        title: 'Aucune demande en attente',
        desc: 'Les nouvelles demandes de développeurs apparaîtront ici',
      },
      approved: {
        icon: Shield,
        title: 'Aucun développeur approuvé',
        desc: 'Les développeurs approuvés apparaîtront ici',
      },
      rejected: {
        icon: XCircle,
        title: 'Aucun développeur refusé/suspendu',
        desc: 'Les développeurs refusés ou suspendus apparaîtront ici',
      },
    };
    const msg = messages[status];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' as const }}
      >
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <msg.icon className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-base font-medium text-foreground mb-1">{msg.title}</p>
            <p className="text-sm text-muted-foreground text-center">{msg.desc}</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Sticky Header */}
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
              Développeurs API
            </h1>
            <p className="text-xs text-muted-foreground">
              Gérer les demandes et accès développeurs
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Terminal className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-muted-foreground">
              {totalCounts.pending} en attente
            </span>
          </div>
        </div>
      </motion.div>

      <div className="px-4 pt-4 space-y-4">
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-border bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Users className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Total</p>
                  <p className="text-lg font-bold text-foreground">
                    {stats?.total ?? totalCounts.pending + totalCounts.approved + totalCounts.rejected}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 dark:border-amber-800/40 bg-gradient-to-br from-amber-50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                  <Clock className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">En attente</p>
                  <p className="text-lg font-bold text-foreground">
                    {stats?.pending ?? totalCounts.pending}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <Shield className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Approuvés</p>
                  <p className="text-lg font-bold text-foreground">
                    {stats?.approved ?? totalCounts.approved}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <DollarSign className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Volume total</p>
                  <p className="text-lg font-bold text-foreground">
                    {stats?.totalVolume ? formatAmount(stats.totalVolume) : '$0.00'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' as const }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par nom, email, nom d'application..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-10 bg-muted/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabStatus)}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="pending" className="text-xs gap-1">
              <Clock className="h-3.5 w-3.5" />
              En attente
              {totalCounts.pending > 0 && (
                <span className="ml-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">
                  {totalCounts.pending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs gap-1">
              <Shield className="h-3.5 w-3.5" />
              Approuvés
              {totalCounts.approved > 0 && (
                <span className="ml-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">
                  {totalCounts.approved}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs gap-1">
              <Ban className="h-3.5 w-3.5" />
              Refusés/Suspendus
              {totalCounts.rejected > 0 && (
                <span className="ml-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">
                  {totalCounts.rejected}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {loading ? (
              renderSkeletons()
            ) : currentDevs.length === 0 ? (
              renderEmptyState('pending')
            ) : (
              <div className="space-y-3">
                {currentDevs.map((dev, index) => renderDevCard(dev, index))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-4">
            {loading ? (
              renderSkeletons()
            ) : currentDevs.length === 0 ? (
              renderEmptyState('approved')
            ) : (
              <div className="space-y-3">
                {currentDevs.map((dev, index) => renderDevCard(dev, index))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-4">
            {loading ? (
              renderSkeletons()
            ) : currentDevs.length === 0 ? (
              renderEmptyState('rejected')
            ) : (
              <div className="space-y-3">
                {currentDevs.map((dev, index) => renderDevCard(dev, index))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── Detail Dialog ────────────────────────────────────────── */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          {detailDev && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Détails du développeur
                </DialogTitle>
                <DialogDescription>
                  Informations complètes de la demande
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Avatar + name + status */}
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Code2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {detailDev.fullName}
                    </h3>
                    <div className="mt-0.5">{getStatusBadge(detailDev.status)}</div>
                  </div>
                </div>

                <Separator />

                {/* Info grid */}
                <div className="grid grid-cols-1 gap-3">
                  {detailDev.companyName && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Building className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                          Entreprise
                        </p>
                        <p className="font-medium text-foreground">{detailDev.companyName}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Email</p>
                      <p className="font-medium text-foreground truncate">{detailDev.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        Téléphone
                      </p>
                      <p className="font-medium text-foreground">{detailDev.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Pays</p>
                      <p className="font-medium text-foreground">{detailDev.country}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Terminal className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        Application
                      </p>
                      <p className="font-medium text-foreground">{detailDev.appName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Code2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        Type de projet
                      </p>
                      <p className="font-medium text-foreground">{detailDev.projectType}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        Utilisateurs estimés
                      </p>
                      <p className="font-medium text-foreground">{detailDev.userEstimate}</p>
                    </div>
                  </div>

                  {detailDev.appUrl && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                          URL de l&apos;application
                        </p>
                        <p className="font-medium text-foreground truncate">{detailDev.appUrl}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        Date d&apos;inscription
                      </p>
                      <p className="font-medium text-foreground">{formatDate(detailDev.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {detailDev.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1.5">
                        Description du projet
                      </p>
                      <p className="text-sm text-foreground bg-muted/50 rounded-md p-3">
                        {detailDev.description}
                      </p>
                    </div>
                  </>
                )}

                {/* Stats (if approved) */}
                {detailDev.status === 'approved' && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-2.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20">
                        <p className="text-[10px] text-muted-foreground">Commissions</p>
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                          {formatAmount(detailDev.totalCommissions)}
                        </p>
                      </div>
                      <div className="text-center p-2.5 rounded-md bg-muted/50">
                        <p className="text-[10px] text-muted-foreground">Transactions</p>
                        <p className="text-sm font-bold text-foreground">{detailDev.transactionCount}</p>
                      </div>
                      <div className="text-center p-2.5 rounded-md bg-muted/50">
                        <p className="text-[10px] text-muted-foreground">Volume</p>
                        <p className="text-sm font-bold text-foreground">
                          {formatAmount(detailDev.totalVolume)}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Reject/Suspend reason */}
                {(detailDev.status === 'rejected' || detailDev.status === 'suspended') && detailDev.rejectReason && (
                  <>
                    <Separator />
                    <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 p-3">
                      <p className="text-xs text-red-700 dark:text-red-400 mb-1 font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Raison
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-300">
                        {detailDev.rejectReason}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                {detailDev.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 sm:flex-initial border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800/40 dark:text-red-400 dark:hover:bg-red-900/20"
                      onClick={() => {
                        setDetailDialogOpen(false);
                        openRejectDialog(detailDev);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Refuser
                    </Button>
                    <Button
                      className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      onClick={() => {
                        setDetailDialogOpen(false);
                        handleApprove(detailDev);
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                  </>
                )}
                {detailDev.status === 'approved' && (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 sm:flex-initial border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800/40 dark:text-slate-400 dark:hover:bg-slate-900/20"
                      onClick={() => {
                        setDetailDialogOpen(false);
                        openKeysDialog(detailDev);
                      }}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Clés API
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 sm:flex-initial border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800/40 dark:text-amber-400 dark:hover:bg-amber-900/20"
                      onClick={() => {
                        setDetailDialogOpen(false);
                        openSuspendDialog(detailDev);
                      }}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Suspendre
                    </Button>
                  </>
                )}
                {(detailDev.status === 'rejected' || detailDev.status === 'suspended') && (
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    onClick={() => {
                      setDetailDialogOpen(false);
                      handleReactivate(detailDev);
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réactiver
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Reject Dialog ────────────────────────────────────────── */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="h-5 w-5" />
              Refuser la demande
            </DialogTitle>
            <DialogDescription>
              Voulez-vous refuser la demande de{' '}
              <strong>{rejectTarget?.fullName}</strong> ({rejectTarget?.appName}) ?
              Cette action peut être annulée ultérieurement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">
                Raison du refus <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reject-reason"
                placeholder="Expliquez pourquoi cette demande est refusée..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="bg-muted/50 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={rejectLoading}
            >
              Annuler
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white font-medium"
              onClick={handleRejectSubmit}
              disabled={rejectLoading || !rejectReason.trim()}
            >
              {rejectLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Refus...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Refuser
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Suspend Dialog ───────────────────────────────────────── */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Ban className="h-5 w-5" />
              Suspendre le développeur
            </DialogTitle>
            <DialogDescription>
              Voulez-vous suspendre <strong>{suspendTarget?.fullName}</strong> ({suspendTarget?.appName}) ?
              Ses accès API seront temporairement désactivés.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="suspend-reason">
                Raison de la suspension (optionnel)
              </Label>
              <Textarea
                id="suspend-reason"
                placeholder="Expliquez pourquoi ce développeur est suspendu..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
                className="bg-muted/50 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSuspendDialogOpen(false)}
              disabled={suspendLoading}
            >
              Annuler
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
              onClick={handleSuspendSubmit}
              disabled={suspendLoading}
            >
              {suspendLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Suspension...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Suspendre
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── API Keys Dialog ──────────────────────────────────────── */}
      <Dialog open={keysDialogOpen} onOpenChange={setKeysDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          {keysDev && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Clés API - {keysDev.appName}
                </DialogTitle>
                <DialogDescription>
                  Gérer les clés d&apos;accès API pour ce développeur.
                </DialogDescription>
              </DialogHeader>

              {keysDev.publicKey && keysDev.secretKey && !generatedKeys ? (
                /* Show existing keys */
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium">
                      Clé publique
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-muted rounded-md p-2.5 font-mono break-all">
                        {keysDev.publicKey}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => copyToClipboard(keysDev.publicKey!, 'existing-public')}
                      >
                        {copiedField === 'existing-public' ? (
                          <CheckCheck className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium">
                      Clé secrète
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-muted rounded-md p-2.5 font-mono break-all">
                        {keysDev.secretKey}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => copyToClipboard(keysDev.secretKey!, 'existing-secret')}
                      >
                        {copiedField === 'existing-secret' ? (
                          <CheckCheck className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {keysDev.webhookUrl && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground font-medium">
                        URL Webhook
                      </Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-muted rounded-md p-2.5 font-mono break-all">
                          {keysDev.webhookUrl}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => copyToClipboard(keysDev.webhookUrl!, 'existing-webhook')}
                        >
                          {copiedField === 'existing-webhook' ? (
                            <CheckCheck className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 p-3">
                    <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>
                        Régénérer les clés invalidera les clés actuelles. Assurez-vous que le développeur
                        est informé avant de procéder.
                      </span>
                    </p>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      variant="outline"
                      onClick={() => setKeysDialogOpen(false)}
                    >
                      Fermer
                    </Button>
                    <Button
                      variant="outline"
                      className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/30 font-medium"
                      onClick={handleSendKeysByEmail}
                      disabled={sendEmailLoading}
                    >
                      {sendEmailLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Envoi...</>
                      ) : (
                        <><Mail className="h-4 w-4 mr-2" /> Envoyer par email</>
                      )}
                    </Button>
                    <Button
                      className="bg-slate-700 hover:bg-slate-800 text-white font-medium"
                      onClick={handleGenerateKeys}
                      disabled={keysLoading}
                    >
                      {keysLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Régénérer
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              ) : generatedKeys ? (
                /* Show newly generated keys */
                <div className="space-y-4 py-2">
                  <div className="rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 p-3 flex items-center gap-2">
                    <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      Nouvelles clés générées avec succès
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium">
                      Clé publique
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-emerald-50 dark:bg-emerald-900/20 rounded-md p-2.5 font-mono break-all border border-emerald-200 dark:border-emerald-800/30">
                        {generatedKeys.publicKey}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => copyToClipboard(generatedKeys.publicKey, 'new-public')}
                      >
                        {copiedField === 'new-public' ? (
                          <CheckCheck className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium">
                      Clé secrète
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-amber-50 dark:bg-amber-900/20 rounded-md p-2.5 font-mono break-all border border-amber-200 dark:border-amber-800/30">
                        {generatedKeys.secretKey}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => copyToClipboard(generatedKeys.secretKey, 'new-secret')}
                      >
                        {copiedField === 'new-secret' ? (
                          <CheckCheck className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Ne partagez jamais la clé secrète publiquement
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium">
                      URL Webhook
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-muted rounded-md p-2.5 font-mono break-all">
                        {generatedKeys.webhookUrl}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => copyToClipboard(generatedKeys.webhookUrl, 'new-webhook')}
                      >
                        {copiedField === 'new-webhook' ? (
                          <CheckCheck className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      variant="outline"
                      className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/30 font-medium gap-2"
                      onClick={handleSendKeysByEmail}
                      disabled={sendEmailLoading}
                    >
                      {sendEmailLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Envoi...</>
                      ) : (
                        <><Mail className="h-4 w-4" /> Envoyer par email</>
                      )}
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      onClick={() => setKeysDialogOpen(false)}
                    >
                      Terminé
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                /* No keys yet - prompt generation */
                <div className="space-y-4 py-2">
                  <div className="rounded-md bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-4 text-center">
                    <Key className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground mb-1">
                      Aucune clé API générée
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Générez les clés pour donner accès aux APIs à {keysDev.fullName}.
                    </p>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      variant="outline"
                      onClick={() => setKeysDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      onClick={handleGenerateKeys}
                      disabled={keysLoading}
                    >
                      {keysLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4 mr-2" />
                          Générer les clés
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
