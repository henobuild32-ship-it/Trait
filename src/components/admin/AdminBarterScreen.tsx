'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Phone,
  User,
  Tag,
  Repeat,
  ShieldCheck,
  XCircle,
  Trash2,
  Gavel,
  X as XIcon,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface BarterOffer {
  id: string;
  title: string;
  description: string;
  category: string;
  wantedItem: string | null;
  status: string;
  offeredById: string;
  offeredByName: string;
  offeredByPhone: string;
  createdAt: string;
}

type FilterTab = 'all' | 'active' | 'closed' | 'moderated';

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'active', label: 'Actives' },
  { key: 'closed', label: 'Fermées' },
  { key: 'moderated', label: 'Modérées' },
];

function getCategoryConfig(cat: string) {
  switch (cat) {
    case 'electronics':
      return { label: 'Électronique', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800/40' };
    case 'clothing':
      return { label: 'Vêtements', color: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/40 dark:text-pink-400 dark:border-pink-800/40' };
    case 'services':
      return { label: 'Services', color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800/40' };
    case 'vehicles':
      return { label: 'Véhicules', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800/40' };
    case 'real_estate':
      return { label: 'Immobilier', color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-400 dark:border-purple-800/40' };
    case 'food':
      return { label: 'Alimentation', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/40' };
    case 'other':
      return { label: 'Autre', color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/40 dark:text-gray-400 dark:border-gray-800/40' };
    default:
      return { label: cat, color: 'bg-muted text-muted-foreground border-border' };
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'active':
      return { label: 'Active', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/40' };
    case 'closed':
      return { label: 'Fermée', color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/40 dark:text-gray-400 dark:border-gray-800/40' };
    case 'moderated':
      return { label: 'Modérée', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800/40' };
    default:
      return { label: status, color: 'bg-muted text-muted-foreground border-border' };
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminBarterScreen() {
  const { admin, goBack } = useAppStore();

  // Data
  const [offers, setOffers] = useState<BarterOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  // Moderate dialog
  const [moderateDialogOpen, setModerateDialogOpen] = useState(false);
  const [moderateTarget, setModerateTarget] = useState<BarterOffer | null>(null);
  const [moderateReason, setModerateReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BarterOffer | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Fetch Offers ──────────────────────────────────────────────

  const fetchOffers = useCallback(async (p: number, append: boolean) => {
    if (!append) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('limit', '10');

      if (activeFilter === 'active') params.set('status', 'active');
      else if (activeFilter === 'closed') params.set('status', 'closed');
      else if (activeFilter === 'moderated') params.set('status', 'moderated');

      const res = await fetch(`/api/admin/barter?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        const fetched: BarterOffer[] = data.offers ?? [];
        if (append) {
          setOffers((prev) => [...prev, ...fetched]);
        } else {
          setOffers(fetched);
        }
        setHasMore(fetched.length >= 10);
        setPage(p);
      } else {
        toast.error(data.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      console.error('Failed to fetch barter offers:', err);
      toast.error('Erreur lors du chargement des publications troc');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    setPage(1);
    fetchOffers(1, false);
  }, [fetchOffers]);

  function handleFilterChange(filter: FilterTab) {
    setActiveFilter(filter);
  }

  function handleLoadMore() {
    fetchOffers(page + 1, true);
  }

  // ─── Moderate Offer ────────────────────────────────────────────

  function openModerateDialog(offer: BarterOffer) {
    setModerateTarget(offer);
    setModerateReason('');
    setModerateDialogOpen(true);
  }

  async function handleModerateSubmit() {
    if (!moderateTarget || !admin?.id) {
      toast.error('Données manquantes');
      return;
    }
    if (!moderateReason.trim()) {
      toast.error('Veuillez saisir une raison');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/barter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: moderateTarget.id,
          adminId: admin.id,
          action: 'moderate',
          reason: moderateReason.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Publication modérée avec succès');
        setModerateDialogOpen(false);
        setModerateTarget(null);
        fetchOffers(1, false);
      } else {
        toast.error(data.error || 'Échec de la modération');
      }
    } catch (err) {
      console.error('Moderate error:', err);
      toast.error('Erreur lors de la modération');
    } finally {
      setActionLoading(false);
    }
  }

  // ─── Close Offer ───────────────────────────────────────────────

  async function handleCloseOffer(offer: BarterOffer) {
    if (!admin?.id) {
      toast.error('Session admin invalide');
      return;
    }

    try {
      const res = await fetch('/api/admin/barter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: offer.id,
          adminId: admin.id,
          action: 'close',
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Publication fermée avec succès');
        fetchOffers(1, false);
      } else {
        toast.error(data.error || 'Échec de la fermeture');
      }
    } catch (err) {
      console.error('Close error:', err);
      toast.error('Erreur lors de la fermeture');
    }
  }

  // ─── Delete Offer ──────────────────────────────────────────────

  function openDeleteDialog(offer: BarterOffer) {
    setDeleteTarget(offer);
    setDeleteReason('');
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget || !admin?.id) {
      toast.error('Données manquantes');
      return;
    }
    if (!deleteReason.trim()) {
      toast.error('Veuillez saisir une raison de suppression');
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await fetch('/api/admin/barter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: deleteTarget.id,
          adminId: admin.id,
          action: 'delete',
          reason: deleteReason.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Publication supprimée définitivement');
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
        fetchOffers(1, false);
      } else {
        toast.error(data.error || 'Échec de la suppression');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteLoading(false);
    }
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
              Offres de Troc
            </h1>
            <p className="text-xs text-muted-foreground">
              {offers.length} publication{offers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="px-4 pt-4 space-y-4">
        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
          className="flex gap-2 overflow-x-auto pb-1 no-scrollbar"
        >
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === tab.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        <Separator />

        {/* Offers List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' as const }}
          >
            <Card className="border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Repeat className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-base font-medium text-foreground mb-1">
                  Aucune publication troc
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  Aucune publication ne correspond à ce filtre
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            <div className="space-y-3">
              {offers.map((offer, index) => {
                const catConfig = getCategoryConfig(offer.category);
                const statusConfig = getStatusConfig(offer.status);

                return (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.03, ease: 'easeOut' as const }}
                  >
                    <Card className="border-border hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        {/* Top row: title + badges + actions */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <h3 className="text-sm font-semibold text-foreground truncate">
                              {offer.title}
                            </h3>
                            <Badge className={`text-xs font-medium ${catConfig.color}`}>
                              {catConfig.label}
                            </Badge>
                            <Badge className={`text-xs font-medium ${statusConfig.color}`}>
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-md text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                              onClick={() => openModerateDialog(offer)}
                              title="Modérer"
                            >
                              <Gavel className="h-4 w-4" />
                              <span className="sr-only">Modérer</span>
                            </Button>
                            {offer.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                                onClick={() => handleCloseOffer(offer)}
                                title="Fermer"
                              >
                                <XIcon className="h-4 w-4" />
                                <span className="sr-only">Fermer</span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => openDeleteDialog(offer)}
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Supprimer</span>
                            </Button>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {offer.description}
                        </p>

                        {/* Wanted item */}
                        {offer.wantedItem && (
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-2">
                            <Repeat className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="truncate">
                              <span className="font-medium">Recherche :</span> {offer.wantedItem}
                            </span>
                          </div>
                        )}

                        <Separator className="my-2" />

                        {/* Bottom row: offered by, date */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5" />
                            <span className="truncate">{offer.offeredByName}</span>
                            <Phone className="h-3.5 w-3.5" />
                            <span>{offer.offeredByPhone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(offer.createdAt)}</span>
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

      {/* ─── Moderate Dialog ─────────────────────────────────────── */}
      <Dialog open={moderateDialogOpen} onOpenChange={setModerateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Gavel className="h-5 w-5" />
              Modérer la publication
            </DialogTitle>
            <DialogDescription>
              Publication : <strong>{moderateTarget?.title}</strong>
              <br />
              La publication sera marquée comme modérée et masquée.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="moderate-reason">Raison de la modération</Label>
              <Textarea
                id="moderate-reason"
                placeholder="Décrivez la raison de la modération..."
                value={moderateReason}
                onChange={(e) => setModerateReason(e.target.value)}
                rows={3}
                className="bg-muted/50 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setModerateDialogOpen(false)} disabled={actionLoading}>
              Annuler
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
              onClick={handleModerateSubmit}
              disabled={actionLoading || !moderateReason.trim()}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Modération...
                </>
              ) : (
                <>
                  <Gavel className="h-4 w-4 mr-2" />
                  Modérer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Dialog ────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Supprimer la publication
            </DialogTitle>
            <DialogDescription>
              Voulez-vous vraiment supprimer définitivement{' '}
              <strong>{deleteTarget?.title}</strong> ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="delete-reason">Raison de la suppression</Label>
              <Textarea
                id="delete-reason"
                placeholder="Décrivez la raison de la suppression..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
                className="bg-muted/50 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading || !deleteReason.trim()}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer définitivement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
