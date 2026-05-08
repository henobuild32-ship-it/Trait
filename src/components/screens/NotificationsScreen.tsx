'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Bell,
  DollarSign,
  Shield,
  Gift,
  AlertCircle,
  ShoppingBag,
  MessageSquare,
  CheckCheck,
  BellOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAppStore, type Notification } from '@/lib/store';

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  transaction: DollarSign,
  transfer_received: DollarSign,
  transfer_sent: DollarSign,
  withdrawal_validated: DollarSign,
  security: Shield,
  promo: Gift,
  system: AlertCircle,
  purchase: ShoppingBag,
  barter_accepted: MessageSquare,
  default: Bell,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  transaction: 'bg-emerald-100 text-emerald-600',
  transfer_received: 'bg-emerald-100 text-emerald-600',
  transfer_sent: 'bg-amber-100 text-amber-600',
  withdrawal_validated: 'bg-emerald-100 text-emerald-600',
  security: 'bg-red-100 text-red-600',
  promo: 'bg-violet-100 text-violet-600',
  system: 'bg-muted text-muted-foreground',
  purchase: 'bg-emerald-100 text-emerald-600',
  barter_accepted: 'bg-amber-100 text-amber-600',
  default: 'bg-muted text-muted-foreground',
};

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "il y a l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

export default function NotificationsScreen() {
  const { goBack, user, setNotifications, markAsRead } = useAppStore();
  const [notifications, setLocalNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const res = await fetch(
        `/api/notifications?userId=${user.id}`
      );
      const data = await res.json();

      if (data.success) {
        const mapped: Notification[] = data.notifications.map(
          (n: {
            id: string;
            title: string;
            message: string;
            type: string;
            read: boolean;
            createdAt: string;
          }) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type as Notification['type'],
            read: n.read,
            createdAt: n.createdAt,
          })
        );
        setLocalNotifications(mapped);
        setNotifications(mapped);
      }
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [user, setNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      markAsRead(id);
      setLocalNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // silent fail
    }
  };

  const handleMarkAll = async () => {
    if (!user) return;

    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications/mark-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();

      if (data.success) {
        setLocalNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
        setNotifications(
          notifications.map((n) => ({ ...n, read: true }))
        );
        toast.success(`${data.markedCount} notification(s) marquée(s) comme lue(s)`);
      }
    } catch {
      toast.error('Erreur');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <Bell className="size-5 text-emerald-600" />
            <h1 className="text-lg font-semibold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="bg-emerald-600 text-white border-0">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAll}
            disabled={markingAll || unreadCount === 0}
            className="text-emerald-600 text-xs"
          >
            <CheckCheck className="size-4" />
            Tout marquer lu
          </Button>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 pb-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <Skeleton className="size-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BellOff className="size-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">Aucune notification</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Vous n&apos;avez pas encore de notifications
            </p>
          </motion.div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {notifications.map((notif, index) => {
                const Icon =
                  NOTIFICATION_ICONS[notif.type] ||
                  NOTIFICATION_ICONS.default;
                const colorClass =
                  NOTIFICATION_COLORS[notif.type] ||
                  NOTIFICATION_COLORS.default;

                return (
                  <motion.button
                    key={notif.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => {
                      if (!notif.read) handleMarkAsRead(notif.id);
                    }}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left ${
                      notif.read
                        ? 'hover:bg-muted/50'
                        : 'bg-emerald-50/50 hover:bg-emerald-50'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}
                    >
                      <Icon className="size-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`text-sm font-medium leading-tight ${
                            notif.read ? 'text-muted-foreground' : ''
                          }`}
                        >
                          {notif.title}
                        </h3>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatRelativeTime(notif.createdAt)}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
