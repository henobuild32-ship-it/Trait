'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  Clock,
  User,
  Filter,
  ClipboardList,
  Shield,
  LogIn,
  Ban,
  Trash2,
  Plus,
  Package,
  ArrowRightLeft,
  Bell,
  CheckCircle2,
  Gavel,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface ActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  details: string;
  targetId: string | null;
  createdAt: string;
}

type ActionType =
  | 'login'
  | 'suspend_user'
  | 'delete_user'
  | 'create_agent'
  | 'suspend_agent'
  | 'delete_agent'
  | 'publish_product'
  | 'delete_product'
  | 'block_transaction'
  | 'send_notification';

const actionFilters: { value: string; label: string }[] = [
  { value: '', label: 'Toutes les actions' },
  { value: 'login', label: 'Connexion' },
  { value: 'suspend_user', label: 'Suspendre utilisateur' },
  { value: 'delete_user', label: 'Supprimer utilisateur' },
  { value: 'create_agent', label: 'Créer agent' },
  { value: 'suspend_agent', label: 'Suspendre agent' },
  { value: 'delete_agent', label: 'Supprimer agent' },
  { value: 'publish_product', label: 'Publier produit' },
  { value: 'delete_product', label: 'Supprimer produit' },
  { value: 'block_transaction', label: 'Bloquer transaction' },
  { value: 'send_notification', label: 'Envoyer notification' },
];

function getActionConfig(action: string) {
  switch (action) {
    case 'login':
      return {
        label: 'Connexion',
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800/40',
        icon: LogIn,
      };
    case 'suspend_user':
    case 'suspend_agent':
      return {
        label: action === 'suspend_user' ? 'Suspendre utilisateur' : 'Suspendre agent',
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800/40',
        icon: Ban,
      };
    case 'delete_user':
    case 'delete_agent':
    case 'delete_product':
      return {
        label: action === 'delete_user' ? 'Supprimer utilisateur' : action === 'delete_agent' ? 'Supprimer agent' : 'Supprimer produit',
        color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800/40',
        icon: Trash2,
      };
    case 'create_agent':
      return {
        label: 'Créer agent',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/40',
        icon: Plus,
      };
    case 'publish_product':
      return {
        label: 'Publier produit',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/40',
        icon: Package,
      };
    case 'block_transaction':
      return {
        label: 'Bloquer transaction',
        color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800/40',
        icon: Shield,
      };
    case 'send_notification':
      return {
        label: 'Envoyer notification',
        color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-400 dark:border-purple-800/40',
        icon: Bell,
      };
    case 'validate_transaction':
    case 'validate':
      return {
        label: 'Valider transaction',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/40',
        icon: CheckCircle2,
      };
    case 'moderate':
      return {
        label: 'Modérer',
        color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800/40',
        icon: Gavel,
      };
    default:
      return {
        label: action,
        color: 'bg-muted text-muted-foreground border-border',
        icon: ClipboardList,
      };
  }
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "à l'instant";
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function truncateId(id: string | null, maxLen: number = 12): string {
  if (!id) return '—';
  if (id.length <= maxLen) return id;
  return `${id.slice(0, maxLen - 3)}...`;
}

export default function AdminActivityLogScreen() {
  const { goBack } = useAppStore();

  // Data
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  // ─── Fetch Logs ────────────────────────────────────────────────

  const fetchLogs = useCallback(async (p: number, append: boolean) => {
    if (!append) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('limit', '20');

      if (actionFilter) {
        params.set('action', actionFilter);
      }

      const res = await fetch(`/api/admin/activity-log?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        const fetched: ActivityLog[] = data.logs ?? [];
        if (append) {
          setLogs((prev) => [...prev, ...fetched]);
        } else {
          setLogs(fetched);
        }
        setHasMore(fetched.length >= 20);
        setPage(p);
      } else {
        toast.error(data.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    setPage(1);
    fetchLogs(1, false);
  }, [fetchLogs]);

  function handleFilterChange(value: string) {
    setActionFilter(value);
  }

  function handleLoadMore() {
    fetchLogs(page + 1, true);
  }

  // ─── Render ────────────────────────────────────────────────────

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
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-tight">
              Journal d&apos;Activité
            </h1>
            <p className="text-xs text-muted-foreground">
              {logs.length} activité{logs.length !== 1 ? 's' : ''} enregistrée{logs.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="px-4 pt-4 space-y-4">
        {/* Filter Dropdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
          className="flex items-center gap-3"
        >
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select
            value={actionFilter}
            onValueChange={handleFilterChange}
          >
            <SelectTrigger className="bg-muted/50 flex-1">
              <SelectValue placeholder="Filtrer par type d'action" />
            </SelectTrigger>
            <SelectContent>
              {actionFilters.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        <Separator />

        {/* Activity Logs List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' as const }}
          >
            <Card className="border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-base font-medium text-foreground mb-1">
                  Aucune activité enregistrée
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  {actionFilter
                    ? 'Aucune activité ne correspond à ce filtre'
                    : "Aucune action n'a encore été enregistrée"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            <div className="space-y-3">
              {logs.map((log, index) => {
                const actionConfig = getActionConfig(log.action);
                const ActionIcon = actionConfig.icon;

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3), ease: 'easeOut' as const }}
                  >
                    <Card className="border-border hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        {/* Top row: admin name + action badge + time */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 shrink-0">
                              <User className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-sm font-medium text-foreground truncate">
                              {log.adminName}
                            </span>
                          </div>
                          <Badge className={`text-xs font-medium shrink-0 ${actionConfig.color}`}>
                            <ActionIcon className="h-3 w-3 mr-1" />
                            {actionConfig.label}
                          </Badge>
                        </div>

                        {/* Details */}
                        <p className="text-xs text-muted-foreground mb-2 pl-9">
                          {log.details}
                        </p>

                        {/* Bottom row: target ID + timestamp */}
                        <div className="flex items-center justify-between pl-9 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <ClipboardList className="h-3 w-3" />
                            <span className="font-mono text-xs">
                              {truncateId(log.targetId)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            <span>{getRelativeTime(log.createdAt)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800/40 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Chargement...
                    </>
                  ) : (
                    'Charger plus'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
