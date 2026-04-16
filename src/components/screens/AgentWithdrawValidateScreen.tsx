'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export default function AgentWithdrawValidateScreen() {
  const { goBack, user } = useAppStore();

  const pendingWithdrawals: Array<{ id: string; [key: string]: unknown }> = [
    // Demo placeholder — in production, fetch from API
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-amber-600" />
            <h1 className="text-lg font-semibold">Valider retrait</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {pendingWithdrawals.length === 0 ? (
            <Card className="border-border">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-lg font-semibold text-gray-900">Tout est à jour !</p>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Aucun retrait en attente de validation
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingWithdrawals.map((w) => (
                <Card key={w.id}>
                  <CardContent className="p-4">
                    <p>{JSON.stringify(w)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
