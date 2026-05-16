'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Send,
  Megaphone,
  User,
  MessageSquare,
  Mail,
  Clock,
  RefreshCw,
  Loader2,
  Inbox,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/lib/store';

// ─── Types ────────────────────────────────────────────────────────────

interface ClientOption {
  id: string;
  name: string;
  phone: string;
  suspended: boolean;
}

interface ClientMessage {
  id: string;
  adminId: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'individual' | 'broadcast';
  allowCopy: boolean;
  createdAt: string;
  recipient: { id: string; name: string; phone: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function formatTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────

export default function AdminClientMessagesScreen() {
  const { goBack, admin } = useAppStore();

  // Data
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Broadcast dialog
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);

  // Individual form
  const [indRecipientId, setIndRecipientId] = useState('');
  const [indTitle, setIndTitle] = useState('');
  const [indMessage, setIndMessage] = useState('');
  const [indAllowCopy, setIndAllowCopy] = useState(false);

  // Broadcast form
  const [bcastTitle, setBcastTitle] = useState('');
  const [bcastMessage, setBcastMessage] = useState('');
  const [bcastAllowCopy, setBcastAllowCopy] = useState(false);

  // ─── Fetch clients ───────────────────────────────────────────────

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users?role=client&limit=200');
      const data = await res.json();
      if (data.success) {
        setClients(
          (data.users ?? []).map((u: { id: string; name: string; phone: string; suspended: boolean }) => ({
            id: u.id,
            name: u.name,
            phone: u.phone,
            suspended: u.suspended,
          }))
        );
      }
    } catch {
      // silent
    }
  }, []);

  // ─── Fetch messages ──────────────────────────────────────────────

  const fetchMessages = useCallback(async () => {
    if (!admin?.id) return;
    try {
      const res = await fetch(`/api/admin/client-messages?adminId=${admin.id}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch {
      toast.error('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  }, [admin]);

  useEffect(() => {
    Promise.all([fetchClients(), fetchMessages()]);
  }, [fetchClients, fetchMessages]);

  // ─── Individual send ─────────────────────────────────────────────

  const handleIndividualSend = async () => {
    if (!admin?.id) return;
    if (!indRecipientId) {
      toast.error('Veuillez sélectionner un client');
      return;
    }
    if (!indTitle.trim() || !indMessage.trim()) {
      toast.error('Titre et message requis');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/client-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          action: 'individual',
          recipientId: indRecipientId,
          title: indTitle.trim(),
          message: indMessage.trim(),
          allowCopy: indAllowCopy,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Message envoyé avec succès');
        setIndRecipientId('');
        setIndTitle('');
        setIndMessage('');
        setIndAllowCopy(false);
        fetchMessages();
      } else {
        toast.error(data.message || "Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  // ─── Broadcast send ──────────────────────────────────────────────

  const handleBroadcastSend = async () => {
    if (!admin?.id) return;
    if (!bcastTitle.trim() || !bcastMessage.trim()) {
      toast.error('Titre et message requis');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/client-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          action: 'broadcast',
          title: bcastTitle.trim(),
          message: bcastMessage.trim(),
          allowCopy: bcastAllowCopy,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Diffusion envoyée');
        setBcastTitle('');
        setBcastMessage('');
        setBcastAllowCopy(false);
        setShowBroadcastConfirm(false);
        fetchMessages();
      } else {
        toast.error(data.message || "Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  // ─── Count of active (non-suspended) clients ─────────────────────

  const activeClientCount = clients.filter((c) => !c.suspended).length;

  // ─── Group broadcast messages ────────────────────────────────────

  const broadcastGroups = messages.reduce((acc, msg) => {
    if (msg.type === 'broadcast') {
      const key = `${msg.title}-${msg.createdAt}`;
      if (!acc[key]) {
        acc[key] = { ...msg, recipientCount: 0 };
      }
      acc[key].recipientCount++;
    }
    return acc;
  }, {} as Record<string, ClientMessage & { recipientCount: number }>);

  const individualMessages = messages.filter((m) => m.type === 'individual');
  const broadcastMessages = Object.values(broadcastGroups).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <MessageSquare className="size-5 text-violet-600" />
            <h1 className="text-lg font-semibold">Messages Clients</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setLoading(true);
              fetchMessages();
            }}
            disabled={loading}
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1 ml-12">
          Envoyer des messages aux clients
        </p>
      </header>

      <div className="flex-1 px-4 py-4 space-y-6 pb-8">
        {/* Compose Section */}
        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="individual" className="gap-1.5">
              <User className="size-4" />
              <span className="text-xs sm:text-sm">Individuel</span>
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="gap-1.5">
              <Megaphone className="size-4" />
              <span className="text-xs sm:text-sm">Diffusion globale</span>
            </TabsTrigger>
          </TabsList>

          {/* ─── Individual Mode ─────────────────────────────────── */}
          <TabsContent value="individual" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-select">Client destinataire</Label>
                  <Select value={indRecipientId} onValueChange={setIndRecipientId}>
                    <SelectTrigger id="client-select">
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.length === 0 ? (
                        <SelectItem value="__none" disabled>
                          Aucun client disponible
                        </SelectItem>
                      ) : (
                        clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            <div className="flex items-center gap-2">
                              <span>{client.name}</span>
                              <span className="text-muted-foreground text-xs">
                                {client.phone}
                              </span>
                              {client.suspended && (
                                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                                  Suspendu
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ind-title">Titre</Label>
                  <Input
                    id="ind-title"
                    placeholder="Titre du message"
                    value={indTitle}
                    onChange={(e) => setIndTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ind-message">Message</Label>
                  <Textarea
                    id="ind-message"
                    placeholder="Écrivez votre message..."
                    value={indMessage}
                    onChange={(e) => setIndMessage(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Allow copy toggle */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Copy className="size-4 text-muted-foreground" />
                    <Label htmlFor="ind-allow-copy" className="text-sm cursor-pointer">
                      Autoriser la copie
                    </Label>
                  </div>
                  <Switch
                    id="ind-allow-copy"
                    checked={indAllowCopy}
                    onCheckedChange={setIndAllowCopy}
                  />
                </div>

                <Button
                  onClick={handleIndividualSend}
                  disabled={sending || !indRecipientId || !indTitle.trim() || !indMessage.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {sending ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="size-4 mr-2" />
                      Envoyer le message
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Broadcast Mode ─────────────────────────────────── */}
          <TabsContent value="broadcast" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <Megaphone className="size-5 text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-700">
                    Ce message sera envoyé à{' '}
                    <span className="font-semibold">{activeClientCount} client(s)</span>{' '}
                    actif(s).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bcast-title">Titre de l&apos;annonce</Label>
                  <Input
                    id="bcast-title"
                    placeholder="Titre de l'annonce"
                    value={bcastTitle}
                    onChange={(e) => setBcastTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bcast-message">Message</Label>
                  <Textarea
                    id="bcast-message"
                    placeholder="Écrivez votre annonce..."
                    value={bcastMessage}
                    onChange={(e) => setBcastMessage(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Allow copy toggle */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Copy className="size-4 text-muted-foreground" />
                    <Label htmlFor="bcast-allow-copy" className="text-sm cursor-pointer">
                      Autoriser la copie
                    </Label>
                  </div>
                  <Switch
                    id="bcast-allow-copy"
                    checked={bcastAllowCopy}
                    onCheckedChange={setBcastAllowCopy}
                  />
                </div>

                <Button
                  onClick={() => setShowBroadcastConfirm(true)}
                  disabled={sending || !bcastTitle.trim() || !bcastMessage.trim() || activeClientCount === 0}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {sending ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Megaphone className="size-4 mr-2" />
                      Envoyer à tous les Clients
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* ─── Message History ─────────────────────────────────── */}
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            Historique des messages
          </h2>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-28" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Inbox className="size-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">Aucun message envoyé</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Envoyez votre premier message à un client
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {[...individualMessages, ...broadcastMessages].map((msg, index) => {
                  const isBroadcast = msg.type === 'broadcast';
                  const recipientCount = isBroadcast
                    ? (msg as ClientMessage & { recipientCount?: number }).recipientCount || 0
                    : 0;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                  isBroadcast
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-violet-100 text-violet-700'
                                }`}
                              >
                                {isBroadcast ? (
                                  <Megaphone className="size-4" />
                                ) : (
                                  <User className="size-4" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-sm truncate">
                                  {msg.title}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {isBroadcast
                                    ? `${recipientCount} client(s)`
                                    : msg.recipient?.name || 'Client inconnu'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {msg.allowCopy && (
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40" title="Copie autorisée">
                                  <Copy className="size-3 text-emerald-700 dark:text-emerald-400" />
                                </div>
                              )}
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  isBroadcast
                                    ? 'border-amber-300 text-amber-700'
                                    : 'border-violet-300 text-violet-700'
                                }`}
                              >
                                {isBroadcast ? 'Diffusion' : 'Individuel'}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                            {msg.message}
                          </p>

                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                            <Clock className="size-3" />
                            {formatTime(msg.createdAt)}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ─── Broadcast Confirmation Dialog ────────────────────────── */}
      <Dialog open={showBroadcastConfirm} onOpenChange={setShowBroadcastConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-amber-600" />
              Confirmer la diffusion
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir envoyer ce message ?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-3 rounded-lg bg-muted space-y-1">
              <p className="text-xs text-muted-foreground">Titre</p>
              <p className="text-sm font-medium">{bcastTitle}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted space-y-1">
              <p className="text-xs text-muted-foreground">Message</p>
              <p className="text-sm whitespace-pre-wrap">{bcastMessage}</p>
            </div>
            {bcastAllowCopy && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <Copy className="size-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700">Copie autorisée pour les destinataires</p>
              </div>
            )}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <Megaphone className="size-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700">
                <span className="font-semibold">{activeClientCount}</span> client(s) recevront ce message
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBroadcastConfirm(false)}
              disabled={sending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleBroadcastSend}
              disabled={sending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {sending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Megaphone className="size-4 mr-2" />
                  Confirmer l&apos;envoi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
