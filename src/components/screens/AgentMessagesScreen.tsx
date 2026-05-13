'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Mail,
  MailOpen,
  Clock,
  CheckCheck,
  User,
  Megaphone,
  MessageSquare,
  Inbox,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';

interface AgentMessage {
  id: string;
  adminId: string;
  recipientId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  admin: { id: string; name: string; username: string } | null;
}

type TabFilter = 'all' | 'unread';

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

export default function AgentMessagesScreen() {
  const { goBack, user } = useAppStore();

  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  // Detail dialog
  const [selectedMessage, setSelectedMessage] = useState<AgentMessage | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(`/api/agent/messages?userId=${user.id}`);
      const data = await res.json();

      if (data.success) {
        setMessages(data.messages);
      }
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    setMarkingAll(true);
    try {
      const res = await fetch('/api/agent/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
        toast.success(`${data.updatedCount} message(s) marqué(s) comme lu(s)`);
      }
    } catch {
      toast.error('Erreur');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkAsRead = async (msg: AgentMessage) => {
    if (!user?.id || msg.isRead) return;

    try {
      await fetch('/api/agent/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, messageIds: [msg.id] }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
      );
    } catch {
      // silent fail
    }
  };

  const handleOpenMessage = (msg: AgentMessage) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      handleMarkAsRead(msg);
    }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  // Filtered messages
  const filteredMessages =
    activeTab === 'unread'
      ? messages.filter((m) => !m.isRead)
      : messages;

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
            {unreadCount > 0 && (
              <Badge className="bg-emerald-600 text-white border-0">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markingAll || unreadCount === 0}
            className="text-emerald-600 text-xs"
          >
            {markingAll ? (
              <Loader2 className="size-4 mr-1 animate-spin" />
            ) : (
              <CheckCheck className="size-4 mr-1" />
            )}
            <span className="hidden sm:inline">Tout marquer lu</span>
          </Button>
        </div>
      </header>

      {/* Tab Filter */}
      <div className="px-4 pt-3">
        <div className="flex rounded-lg bg-muted p-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'all'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Tous
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({messages.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'unread'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Non lus
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({unreadCount})
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 pb-24">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-28" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMessages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              {activeTab === 'unread' ? (
                <MailOpen className="size-8 text-muted-foreground" />
              ) : (
                <Inbox className="size-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="font-medium text-lg">
              {activeTab === 'unread' ? 'Aucun message non lu' : 'Aucun message'}
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              {activeTab === 'unread'
                ? 'Tous vos messages ont été lus'
                : "Vous n'avez pas encore reçu de messages"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredMessages.map((msg, index) => {
                const isBroadcast = msg.type === 'broadcast';

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.04 }}
                    layout
                  >
                    <Card
                      className={`cursor-pointer hover:shadow-md transition-all ${
                        !msg.isRead
                          ? 'border-l-4 border-l-emerald-500 bg-emerald-50/30'
                          : ''
                      }`}
                      onClick={() => handleOpenMessage(msg)}
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {!msg.isRead && (
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                            )}
                            <h3
                              className={`text-sm leading-tight truncate ${
                                msg.isRead
                                  ? 'text-muted-foreground font-medium'
                                  : 'font-semibold'
                              }`}
                            >
                              {msg.title}
                            </h3>
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

                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {msg.message}
                        </p>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                            {msg.isRead ? (
                              <MailOpen className="size-3" />
                            ) : (
                              <Mail className="size-3" />
                            )}
                            {formatRelativeTime(msg.createdAt)}
                          </div>
                          {msg.admin && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="size-3" />
                              <span className="truncate max-w-[120px]">
                                {msg.admin.name}
                              </span>
                            </div>
                          )}
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

      {/* Message Detail Dialog */}
      <Dialog
        open={!!selectedMessage}
        onOpenChange={(open) => {
          if (!open) setSelectedMessage(null);
        }}
      >
        {selectedMessage && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                {selectedMessage.isRead ? (
                  <MailOpen className="size-5 text-emerald-600" />
                ) : (
                  <Mail className="size-5 text-emerald-600" />
                )}
                {selectedMessage.title}
              </DialogTitle>
              <DialogDescription>
                <div className="flex items-center gap-2 mt-1">
                  {selectedMessage.admin && (
                    <span className="text-xs text-muted-foreground">
                      De {selectedMessage.admin.name}
                    </span>
                  )}
                  <Separator orientation="vertical" className="h-3" />
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(selectedMessage.createdAt)}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ml-auto ${
                      selectedMessage.type === 'broadcast'
                        ? 'border-amber-300 text-amber-700'
                        : 'border-emerald-300 text-emerald-700'
                    }`}
                  >
                    {selectedMessage.type === 'broadcast' ? (
                      <span className="flex items-center gap-1">
                        <Megaphone className="size-3" /> Diffusion
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <User className="size-3" /> Individuel
                      </span>
                    )}
                  </Badge>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedMessage(null)}
              >
                <X className="size-4 mr-1" />
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
