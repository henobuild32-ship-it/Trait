'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Globe, Zap, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface CardOption {
  type: 'USD' | 'FC';
  name: string;
  currency: string;
  description: string;
  gradient: string;
  accent: string;
  icon: React.ElementType;
  features: string[];
}

const cardOptions: CardOption[] = [
  {
    type: 'USD',
    name: 'Carte TRAIT USD',
    currency: 'Dollar Américain',
    description: 'Carte numérique internationale pour vos paiements en dollars US partout dans le monde.',
    gradient: 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 40%, #0D2847 100%)',
    accent: '#14888F',
    icon: Globe,
    features: ['Paiements internationaux', 'Acceptée partout', 'Zéro frais de conversion'],
  },
  {
    type: 'FC',
    name: 'Carte TRAIT FC',
    currency: 'Franc Congolais',
    description: 'Carte numérique nationale pour vos transactions quotidiennes en Franc Congolais.',
    gradient: 'linear-gradient(135deg, #1A0A0A 0%, #5F1E1E 40%, #470D0D 100%)',
    accent: '#EF4444',
    icon: Zap,
    features: ['Paiements locaux', 'Marchands congolais', 'Transferts rapides'],
  },
];

export default function CardRequestScreen() {
  const { user, navigateTo } = useAppStore();
  const [selectedType, setSelectedType] = useState<'USD' | 'FC' | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!user?.id || !selectedType) return;

    setLoading(true);
    try {
      const res = await fetch('/api/cards/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, cardType: selectedType }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Demande de carte soumise avec succès !');
        navigateTo('home');
      } else {
        toast.error(data.message || 'Erreur lors de la demande');
      }
    } catch {
      toast.error('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => navigateTo('home')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Demander une carte</h1>
      </div>

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="px-4 mb-6"
      >
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-start gap-3">
            <Shield className="size-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Demande de carte</p>
              <p className="text-xs text-amber-700 mt-1">
                Votre demande sera examinée par notre équipe. Vous recevrez une notification une fois votre carte approuvée et activée.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Card Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
        className="px-4 mb-6"
      >
        <p className="text-sm font-medium text-foreground mb-3">Choisissez votre carte</p>
        <div className="space-y-4">
          {cardOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedType === option.type;

            return (
              <motion.button
                key={option.type}
                onClick={() => setSelectedType(option.type)}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left rounded-2xl overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'ring-2 ring-offset-2'
                    : 'border-border'
                }`}
                style={{
                  borderColor: isSelected ? option.accent : undefined,
                  ...(isSelected ? { '--tw-ring-color': option.accent } as React.CSSProperties : {}),
                }}
              >
                {/* Card visual header */}
                <div
                  className="relative p-5 pb-4"
                  style={{
                    background: option.gradient,
                    minHeight: '120px',
                  }}
                >
                  {/* World map dots */}
                  <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                      backgroundImage: `radial-gradient(circle, ${option.accent} 1px, transparent 1px)`,
                      backgroundSize: '20px 20px',
                    }}
                  />

                  {/* Light streak */}
                  <div
                    className="absolute top-0 right-0 w-32 h-32 opacity-20"
                    style={{
                      background: `radial-gradient(ellipse at top right, ${option.accent}, transparent 70%)`,
                    }}
                  />

                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${option.accent}20` }}
                        >
                          <CreditCard className="w-4 h-4" style={{ color: option.accent }} />
                        </div>
                        <span className="text-white text-sm font-black tracking-wider">
                          TRAIT
                        </span>
                      </div>
                      <h3 className="text-white text-lg font-bold">{option.name}</h3>
                      <p className="text-white/50 text-xs mt-0.5">{option.currency}</p>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        <CheckCircle2 className="w-6 h-6" style={{ color: option.accent }} />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Card details */}
                <div className="p-4 bg-card">
                  <p className="text-sm text-muted-foreground mb-3">
                    {option.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {option.features.map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: `${option.accent}15`,
                          color: option.accent,
                        }}
                      >
                        <Icon className="w-3 h-3" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
        className="px-4 pb-6"
      >
        <Button
          className="w-full h-12 font-semibold rounded-xl text-base"
          style={{
            backgroundColor: selectedType
              ? cardOptions.find((o) => o.type === selectedType)?.accent
              : undefined,
          }}
          onClick={handleSubmit}
          disabled={!selectedType || loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Traitement...
            </span>
          ) : (
            'Confirmer la demande'
          )}
        </Button>
      </motion.div>
    </div>
  );
}
