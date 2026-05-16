'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Shield, Wifi } from 'lucide-react';

interface TraitCardProps {
  cardType: 'USD' | 'FC';
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  qrCode: string;
  balance: number;
  status?: string;
}

export default function TraitCard({
  cardType,
  cardNumber,
  cardHolder,
  expiryDate,
  cvv,
  qrCode,
  balance,
  status = 'active',
}: TraitCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const isUSD = cardType === 'USD';
  const isSuspended = status === 'suspended' || status === 'blocked';

  // Format card number: 4927 8613 5478 2190
  const formattedNumber = cardNumber.replace(/(.{4})/g, '$1 ').trim();

  // Color scheme
  const accentColor = isUSD ? '#3B82F6' : '#EF4444';
  const currencySymbol = isUSD ? '$' : '';
  const currencyLabel = isUSD ? 'USD' : 'FC';

  return (
    <div
      className="w-full cursor-pointer select-none"
      style={{ perspective: '1000px' }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full"
      >
        {/* FRONT */}
        <div
          className="w-full rounded-2xl overflow-hidden shadow-2xl relative"
          style={{
            backfaceVisibility: 'hidden',
            background: isUSD
              ? 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 40%, #0D2847 100%)'
              : 'linear-gradient(135deg, #1A0A0A 0%, #5F1E1E 40%, #470D0D 100%)',
            minHeight: '220px',
          }}
        >
          {/* World map dots */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `radial-gradient(circle, ${accentColor} 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }}
          />

          {/* Light streaks */}
          <div
            className="absolute top-0 right-0 w-48 h-48 opacity-20"
            style={{
              background: `radial-gradient(ellipse at top right, ${accentColor}, transparent 70%)`,
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-32 h-32 opacity-10"
            style={{
              background: `radial-gradient(ellipse at bottom left, ${accentColor}, transparent 70%)`,
            }}
          />

          {/* Card label */}
          <div className="absolute top-3 right-3 flex items-center gap-1">
            <div
              className="px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider uppercase"
              style={{
                backgroundColor: `${accentColor}30`,
                color: accentColor,
                border: `1px solid ${accentColor}40`,
              }}
            >
              CARTE {currencyLabel}
            </div>
          </div>

          {/* Suspended overlay */}
          {isSuspended && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 rounded-2xl">
              <div className="text-center">
                <Shield className="w-8 h-8 text-red-400 mx-auto mb-1" />
                <p className="text-white text-xs font-bold uppercase">
                  {status === 'suspended' ? 'Suspendue' : 'Bloquée'}
                </p>
              </div>
            </div>
          )}

          <div className="relative z-10 p-5 pt-4">
            {/* Logo */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <CreditCard className="w-4 h-4" style={{ color: accentColor }} />
                </div>
                <div>
                  <p className="text-white text-sm font-black tracking-wider leading-none">
                    TRAIT
                  </p>
                  <p className="text-white/40 text-[8px] font-medium tracking-wider mt-0.5">
                    CARTE NUMÉRIQUE
                  </p>
                </div>
              </div>
              <Wifi
                className="w-5 h-5 rotate-90"
                style={{ color: accentColor, opacity: 0.7 }}
              />
            </div>

            {/* Card number */}
            <div className="mb-4">
              <p className="text-white/40 text-[10px] font-medium tracking-wider mb-1">
                NUMÉRO CRYPTÉ
              </p>
              <p className="text-white text-lg font-mono font-bold tracking-[3px]">
                {formattedNumber}
              </p>
            </div>

            {/* Bottom: Name + QR */}
            <div className="flex items-end justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-white/40 text-[8px] font-medium tracking-wider mb-0.5">
                  NOM DU TITULAIRE
                </p>
                <p className="text-white text-xs font-bold tracking-wider truncate uppercase">
                  {cardHolder}
                </p>
              </div>

              {/* QR Code visual */}
              <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center ml-3 shrink-0">
                <div className="w-8 h-8 rounded bg-white/90 flex items-center justify-center">
                  <div
                    className="w-6 h-6 grid grid-cols-3 grid-rows-3 gap-[1px] p-0.5"
                    style={{ backgroundColor: isUSD ? '#0A1628' : '#1A0A0A' }}
                  >
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-[0.5px]"
                        style={{
                          backgroundColor: [0, 2, 4, 6, 8].includes(i)
                            ? (isUSD ? '#0A1628' : '#1A0A0A')
                            : [1, 3, 5, 7].includes(i)
                              ? (isUSD ? '#0A1628' : '#1A0A0A')
                              : 'transparent',
                          opacity: [0, 2, 4, 6, 8].includes(i) ? 1 : 0.5,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Balance & Security */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <div>
                <p className="text-white/40 text-[8px] font-medium tracking-wider">
                  SOLDE DISPONIBLE
                </p>
                <p className="text-white text-base font-bold">
                  {currencySymbol}
                  {balance.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  {!isUSD && (
                    <span className="text-xs font-medium ml-0.5">FC</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield
                  className="w-3.5 h-3.5"
                  style={{ color: accentColor, opacity: 0.7 }}
                />
                <p
                  className="text-[9px] font-semibold tracking-wider"
                  style={{ color: accentColor, opacity: 0.8 }}
                >
                  SÉCURISÉE PAR TRAIT
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: isUSD
              ? 'linear-gradient(135deg, #0D2847 0%, #1E3A5F 40%, #0A1628 100%)'
              : 'linear-gradient(135deg, #470D0D 0%, #5F1E1E 40%, #1A0A0A 100%)',
            minHeight: '220px',
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle, ${accentColor} 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative z-10 p-5 pt-4">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <CreditCard className="w-4 h-4" style={{ color: accentColor }} />
              </div>
              <p className="text-white text-sm font-black tracking-wider">TRAIT</p>
            </div>

            {/* Ownership note */}
            <p className="text-white/50 text-[8px] leading-relaxed italic mb-4">
              Cette carte est la propriété de TRAIT. Si vous la trouvez, veuillez la retourner.
            </p>

            {/* Signature strip */}
            <div className="mb-4">
              <p className="text-white/40 text-[8px] font-medium tracking-wider mb-1.5">
                SIGNATURE AUTORISÉE
              </p>
              <div className="bg-white/10 border border-white/20 rounded-md px-3 py-2">
                <p className="text-white/60 text-[10px] font-mono italic">
                  TRAIT CARD
                </p>
              </div>
            </div>

            {/* CVV */}
            <div className="mb-4">
              <p className="text-white/40 text-[8px] font-medium tracking-wider mb-1.5">
                CODE DE SÉCURITÉ (CCV)
              </p>
              <div
                className="inline-block rounded-md px-4 py-1.5"
                style={{ backgroundColor: `${accentColor}30` }}
              >
                <p className="text-white text-lg font-mono font-bold tracking-[4px]">
                  {cvv}
                </p>
              </div>
              <p className="text-white/30 text-[8px] mt-0.5">3 chiffres</p>
            </div>

            {/* Security features */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
              {[
                { icon: '🔒', label: 'Sécurité', desc: 'Protection avancée' },
                { icon: '🛡️', label: 'Confidentiel', desc: 'Ne partagez pas le CCV' },
                { icon: '✅', label: 'Utilisation', desc: 'En ligne et en magasin' },
                { icon: '📞', label: 'Support', desc: 'trait137@gmail.com' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span className="text-xs">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-white/70 text-[8px] font-semibold leading-none">
                      {item.label}
                    </p>
                    <p className="text-white/40 text-[7px] leading-tight mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Expiry */}
            <div className="flex items-center justify-between mt-3">
              <p className="text-white/30 text-[8px]">
                EXPIRE {expiryDate}
              </p>
              <p className="text-white/20 text-[7px]">
                {currencyLabel} • {isUSD ? 'Internationale' : 'Nationale'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tap to flip hint */}
      <p className="text-center text-[10px] text-muted-foreground mt-2">
        Appuyez pour retourner la carte
      </p>
    </div>
  );
}
