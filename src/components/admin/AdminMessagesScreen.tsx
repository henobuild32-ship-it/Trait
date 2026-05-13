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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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

interface AgentOption {
  id: string;
  name: string;
  phone: string;
  agentCode: string | null;
  suspended: boolean;
}

interface SentMessage {
  id: string;
  adminId: string;
  recipientId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  recipient: { id: string; name: string; phone: string } | null;
}

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

export default function AdminMessagesScreen() {
  const { goBack, admin } = useAppStore();

  // Data
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Broadcast dialog
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);

  // Individual form
  const [indRecipientId, setIndRecipientId] = useState('');
  const [indTitle, setIndTitle] = useState('');
  const [indMessage, setIndMessage] = useState('');

  // Broadcast form
  const [bcastTitle, setBcastTitle] = useState('');
  const [bcastMessage, setBcastMessage] = useState('');

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/agents?limit=200');
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!admin?.id) return;
    try {
      const res = await fetch(`/api/admin/messages?adminId=${admin.id}`);
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
    Promise.all([fetchAgents(), fetchMessages()]);
  }, [fetchAgents, fetchMessages]);

  const handleIndividualSend = async () => {
    if (!admin?.id) return;
    if (!indRecipientId) {
      toast.error('Veuillez sélectionner un agent');
      return;
    }
    if (!indTitle.trim() || !indMessage.trim()) {
      toast.error('Titre et message requis');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          action: 'individual',
          recipientId: indRecipientId,
          title: indTitle.trim(),
          message: indMessage.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Message envoyé avec succès');
        setIndRecipientId('');
        setIndTitle('');
        setIndMessage('');
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

  const handleBroadcastSend = async () => {
    if (!admin?.id) return;
    if (!bcastTitle.trim() || !bcastMessage.trim()) {
      toast.error('Titre et message requis');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          action: 'broadcast',
          title: bcastTitle.trim(),
          message: bcastMessage.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Diffusion envoyée');
        setBcastTitle('');
        setBcastMessage('');
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

  // Count of validated + non-suspended agents for broadcast
  const validAgentCount = agents.filter((a) => !a.suspended).length;

  // Group broadcast messages to show unique entries (same title+message+createdAt)
  const broadcastGroups = messages.reduce((acc, msg) => {
    if (msg.type === 'broadcast') {
      const key = `${msg.title}-${msg.createdAt}`;
      if (!acc[key]) {
        acc[key] = { ...msg, recipientCount: 0 };
      }
      acc[key].recipientCount++;
    }
    return acc;
  }, {} as Record<string, SentMessage & { recipientCount: number }>);

  const individualMessages = messages.filter((m) => m.type === 'individual');
  const broadcastMessages = Object.values(broadcastGroups).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <MessageSquare className="size-5 text-emerald-600" />
            <h1 className="text-lg font-semibold">Messages</h1>
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
          Envoyer des messages aux agents
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

          {/* Individual Mode */}
          <TabsContent value="individual" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-select">Agent destinataire</Label>
                  <Select value={indRecipientId} onValueChange={setIndRecipientId}>
                    <SelectTrigger id="agent-select">
                      <SelectValue placeholder="Sélectionner un agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.length === 0 ? (
                        <SelectItem value="__none" disabled>
                          Aucun agent disponible
                        </SelectItem>
                      ) : (
                        agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            <div className="flex items-center gap-2">
                              <span>{agent.name}</span>
                              <span className="text-muted-foreground text-xs">
                                {agent.phone}
                              </span>
                              {agent.suspended && (
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

          {/* Broadcast Mode */}
          <TabsContent value="broadcast" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <Megaphone className="size-5 text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-700">
                    Ce message sera envoyé à{' '}
                    <span className="font-semibold">{validAgentCount} agent(s)</span>{' '}
                    validé(s) et actif(s).
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

                <Button
                  onClick={() => setShowBroadcastConfirm(true)}
                  disabled={sending || !bcastTitle.trim() || !bcastMessage.trim() || validAgentCount === 0}
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
                      Envoyer à tous les Agents
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Message History */}
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
                Envoyez votre premier message à un agent
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {[...individualMessages, ...broadcastMessages].map((msg, index) => {
                  const isBroadcast = msg.type === 'broadcast';
                  const recipientCount = isBroadcast
                    ? (msg as SentMessage & { recipientCount?: number }).recipientCount || 0
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
                                    : 'bg-emerald-100 text-emerald-700'
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
                                    ? `${recipientCount} agent(s)`
                                    : msg.recipient?.name || 'Agent inconnu'}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] shrink-0 ${
                                isBroadcast
                                  ? 'border-amber-300 text-amber-700'
                                  : 'border-emerald-300 text-emerald-700'
                              }`}
                            >
                              {isBroadcast ? 'Diffusion' : 'Individuel'}
                            </Badge>
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

      {/* Broadcast Confirmation Dialog */}
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
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <Megaphone className="size-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700">
                <span className="font-semibold">{validAgentCount}</span> agent(s) recevront ce message
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
