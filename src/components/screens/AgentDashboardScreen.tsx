'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus, ShieldCheck, Activity, TrendingUp, DollarSign, Users, Clock, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export default function AgentDashboardScreen() {
  const { goBack, user, setUser, navigateTo } = useAppStore();
  const [checkingStatus, setCheckingStatus] = useState(false);

  const validationStatus = user?.validationStatus;
  const isSuspended = user?.suspended === true;

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch('/api/auth/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          toast.info('Statut mis à jour');
        }
      } else {
        toast.error('Erreur lors de la vérification du statut');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setCheckingStatus(false);
    }
  };

  // Blocking overlay for pending validation
  if (validationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-amber-50 dark:bg-amber-950/30 flex flex-col">
        <header className="sticky top-0 z-10 bg-amber-100/80 dark:bg-amber-950/80 backdrop-blur-md border-b border-amber-200 dark:border-amber-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Tableau de bord</h1>
              <Badge className="bg-amber-200 text-amber-800 border-amber-300 text-xs">
                Agent
              </Badge>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm"
          >
            <div className="w-20 h-20 rounded-full bg-amber-200 dark:bg-amber-800/60 flex items-center justify-center mx-auto mb-6">
              <Clock className="size-10 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-3">
              Compte en attente de validation
            </h2>
            <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed mb-8">
              Votre compte Agent est en attente de validation par l&apos;administrateur. Vous ne pouvez pas accéder aux fonctionnalités principales tant que votre compte n&apos;est pas validé.
            </p>
            <Button
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl px-8 h-11 cursor-pointer"
            >
              {checkingStatus ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : null}
              Vérifier le statut
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Blocking overlay for rejected validation
  if (validationStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-red-50 dark:bg-red-950/30 flex flex-col">
        <header className="sticky top-0 z-10 bg-red-100/80 dark:bg-red-950/80 backdrop-blur-md border-b border-red-200 dark:border-red-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Tableau de bord</h1>
              <Badge className="bg-red-200 text-red-800 border-red-300 text-xs">
                Agent
              </Badge>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm"
          >
            <div className="w-20 h-20 rounded-full bg-red-200 dark:bg-red-800/60 flex items-center justify-center mx-auto mb-6">
              <XCircle className="size-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-3">
              Compte refusé
            </h2>
            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
              Votre demande de compte Agent a été refusée. Raison : {user?.validationRejectReason || 'Non spécifiée'}
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Blocking overlay for suspended account
  if (isSuspended) {
    return (
      <div className="min-h-screen bg-red-50 dark:bg-red-950/30 flex flex-col">
        <header className="sticky top-0 z-10 bg-red-100/80 dark:bg-red-950/80 backdrop-blur-md border-b border-red-200 dark:border-red-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Tableau de bord</h1>
              <Badge className="bg-red-200 text-red-800 border-red-300 text-xs">
                Agent
              </Badge>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm"
          >
            <div className="w-20 h-20 rounded-full bg-red-200 dark:bg-red-800/60 flex items-center justify-center mx-auto mb-6">
              <XCircle className="size-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-3">
              Compte suspendu
            </h2>
            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
              Votre compte a été suspendu. Veuillez contacter l&apos;administrateur pour plus d&apos;informations.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Dépots aujourd\'hui',
      value: '$0.00',
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Retraits validés',
      value: '0',
      icon: ShieldCheck,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Clients actifs',
      value: '0',
      icon: Users,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Volume total',
      value: `$${(user?.realBalance ?? 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Tableau de bord</h1>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
              Agent
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 space-y-5 pb-8">
        {/* Agent info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-amber-500 to-amber-700 text-white">
            <CardContent className="p-5">
              <p className="text-sm text-amber-100">Code Agent</p>
              <p className="text-3xl font-bold font-mono tracking-wider mt-1">
                {user?.agentNumber || user?.agentCode || 'N/A'}
              </p>
              <p className="text-sm text-amber-200 mt-2">
                {user?.name || 'Agent'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className={`w-9 h-9 rounded-full ${stat.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`size-4 ${stat.color}`} />
                    </div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold mt-1">{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 text-emerald-600 border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                onClick={() => navigateTo('agent-deposit')}
              >
                <UserPlus className="size-4" />
                Effectuer un dépôt client
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 text-amber-700 border-amber-200 hover:bg-amber-50 cursor-pointer"
                onClick={() => navigateTo('agent-withdraw-validate')}
              >
                <ShieldCheck className="size-4" />
                Valider un retrait
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 text-violet-600 border-violet-200 hover:bg-violet-50 cursor-pointer"
                onClick={() => navigateTo('agent-activity')}
              >
                <Activity className="size-4" />
                Voir l'activité
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
