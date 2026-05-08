'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Activity, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';

export default function AgentActivityScreen() {
  const { goBack, user } = useAppStore();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-violet-600" />
            <h1 className="text-lg font-semibold">Mon activité</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-violet-500" />
              </div>
              <p className="text-lg font-semibold text-foreground">Aucune activité</p>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Les dépôts et validations de retrait apparaîtront ici
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
