'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus, ShieldCheck, Activity, TrendingUp, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';

export default function AgentDashboardScreen() {
  const { goBack, user, navigateTo } = useAppStore();

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
                {user?.agentCode || 'N/A'}
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
