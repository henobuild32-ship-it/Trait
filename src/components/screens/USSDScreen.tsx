'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Phone,
  PhoneCall,
  Delete,
  Info,
  Wallet,
  Send,
  ArrowDownToLine,
  Loader2,
  CheckCircle2,
  ArrowUpFromLine,
  Activity,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';

const KEYPAD_KEYS = [
  { num: '1', letters: '' },
  { num: '2', letters: 'ABC' },
  { num: '3', letters: 'DEF' },
  { num: '4', letters: 'GHI' },
  { num: '5', letters: 'JKL' },
  { num: '6', letters: 'MNO' },
  { num: '7', letters: 'PQRS' },
  { num: '8', letters: 'TUV' },
  { num: '9', letters: 'WXYZ' },
  { num: '*', letters: '' },
  { num: '0', letters: '+' },
  { num: '#', letters: '' },
];

interface PresetCode {
  code: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  getResponse: (user: { realBalance: number; bonusBalance: number; agentCode: string | null }) => string;
}

const CLIENT_PRESET_CODES: PresetCode[] = [
  {
    code: '*1709#',
    label: 'Menu Principal',
    icon: LayoutDashboard,
    getResponse: (user) =>
      `TRAIT - Menu Client\n\n1. Consulter solde\n2. Envoyer de l'argent\n3. Retirer de l'argent\n4. Déposer via agent\n0. Quitter`,
  },
  {
    code: '*1709*1#',
    label: 'Consulter solde',
    icon: Wallet,
    getResponse: (user) =>
      `Votre solde: ${(user.realBalance + user.bonusBalance).toFixed(2)} USD\n\nSolde réel: ${user.realBalance.toFixed(2)} USD\nSolde bonus: ${user.bonusBalance.toFixed(2)} USD`,
  },
  {
    code: '*1709*2#',
    label: 'Envoyer',
    icon: Send,
    getResponse: () =>
      `Envoyer de l'argent\n\nEntrez le numéro du destinataire:\n________________\n\n0. Retour    00. Suivant`,
  },
  {
    code: '*1709*3#',
    label: 'Retirer',
    icon: ArrowDownToLine,
    getResponse: () =>
      `Retrait\n\nEntrez le code agent (7 chiffres):\n________________\n\n0. Retour`,
  },
  {
    code: '*1709*4#',
    label: 'Dépôt via agent',
    icon: ArrowUpFromLine,
    getResponse: () =>
      `Dépôt via agent\n\nRapprochez-vous d'un agent Trait\npour effectuer votre dépôt.\n\nL'agent vous demandera votre\nnuméro de téléphone.\n\n0. Retour`,
  },
];

const AGENT_PRESET_CODES: PresetCode[] = [
  {
    code: '*1709#',
    label: 'Menu Principal',
    icon: LayoutDashboard,
    getResponse: (user) =>
      `TRAIT - Menu Agent\nCode: ${user.agentCode || 'N/A'}\n\n1. Dépôt client\n2. Valider retrait\n3. Voir activité\n0. Quitter`,
  },
  {
    code: '*1709*1#',
    label: 'Dépôt client',
    icon: ArrowUpFromLine,
    getResponse: () =>
      `Dépôt client\n\nEntrez le numéro du client:\n________________\n\n0. Retour    00. Suivant`,
  },
  {
    code: '*1709*2#',
    label: 'Valider retrait',
    icon: ArrowDownToLine,
    getResponse: () =>
      `Retraits en attente:\n\n1. Aucun retrait en attente\n\n0. Retour`,
  },
  {
    code: '*1709*3#',
    label: 'Voir activité',
    icon: Activity,
    getResponse: () =>
      `Activité récente:\n\nAucune transaction récente\n\n0. Retour`,
  },
];

export default function USSDScreen() {
  const { goBack, user } = useAppStore();
  const [dialInput, setDialInput] = useState('');
  const [isDialing, setIsDialing] = useState(false);
  const [response, setResponse] = useState('');
  const [showResponse, setShowResponse] = useState(false);

  const isAgent = user?.role === 'agent';
  const presetCodes = useMemo(() => (isAgent ? AGENT_PRESET_CODES : CLIENT_PRESET_CODES), [isAgent]);

  const addDigit = useCallback((digit: string) => {
    if (dialInput.length >= 15) return;
    setDialInput((prev) => prev + digit);
    setShowResponse(false);
    setResponse('');
  }, [dialInput.length]);

  const removeDigit = useCallback(() => {
    setDialInput((prev) => prev.slice(0, -1));
    setShowResponse(false);
    setResponse('');
  }, []);

  const dial = useCallback(() => {
    if (!dialInput) return;

    setIsDialing(true);
    setShowResponse(false);

    // Simulate dialing delay
    setTimeout(() => {
      const preset = presetCodes.find((p) => p.code === dialInput);
      if (preset && user) {
        setResponse(preset.getResponse(user));
      } else {
        setResponse(
          `Erreur\n\nLe code ${dialInput} n'est pas reconnu.\nVérifiez le code et réessayez.\n\n0. Retour`
        );
      }
      setShowResponse(true);
      setIsDialing(false);
    }, 1500);
  }, [dialInput, presetCodes, user]);

  const applyPreset = useCallback((code: string) => {
    setDialInput(code);
    setShowResponse(false);
    setResponse('');
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Phone className="size-5 text-emerald-600" />
            <h1 className="text-lg font-semibold">USSD</h1>
          </div>
          <Badge
            variant="outline"
            className="ml-auto text-xs border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            {isAgent ? 'Agent' : 'Client'}
          </Badge>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 space-y-4 pb-8">
        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-3 flex items-start gap-2">
              <Info className="size-4 text-emerald-700 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800">
                Composez un code USSD pour accéder aux services Trait{isAgent ? ' Agent' : ''}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Phone display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden border-2">
            {/* Status bar */}
            <div className="bg-gray-900 px-4 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 rounded-sm bg-emerald-500" />
              </div>
              <span className="text-[10px] text-gray-400 font-medium">
                TRAIT MOBILE
              </span>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-gray-500" />
                <div className="w-1 h-1 rounded-full bg-gray-500" />
                <div className="w-1 h-1 rounded-full bg-gray-500" />
                <div className="w-5 h-2.5 rounded-sm border border-gray-500 ml-1 relative">
                  <div className="absolute inset-0.5 right-1 bg-emerald-500 rounded-[1px]" />
                </div>
              </div>
            </div>

            {/* Display screen */}
            <div className="bg-gray-800 min-h-[180px] p-4 flex flex-col">
              <AnimatePresence mode="wait">
                {isDialing ? (
                  <motion.div
                    key="dialing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center gap-2"
                  >
                    <Loader2 className="size-8 text-emerald-400 animate-spin" />
                    <p className="text-gray-400 text-sm">Connexion en cours...</p>
                  </motion.div>
                ) : showResponse ? (
                  <motion.div
                    key="response"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="size-4 text-emerald-400" />
                      <span className="text-emerald-400 text-xs font-medium">
                        Service USSD
                      </span>
                    </div>
                    <pre className="text-green-400 text-sm whitespace-pre-wrap font-mono flex-1 leading-relaxed">
                      {response}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 self-end text-gray-400 border-gray-600 hover:bg-gray-700 text-xs"
                      onClick={() => {
                        setShowResponse(false);
                        setDialInput('');
                      }}
                    >
                      Terminer
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center"
                  >
                    <p className="text-gray-500 text-xs mb-2">Numérotation</p>
                    <p
                      className={`text-white font-mono text-2xl tracking-wider text-center break-all ${
                        dialInput.length > 0 ? '' : 'text-gray-600'
                      }`}
                    >
                      {dialInput || '____________'}
                    </p>
                    {dialInput.length > 0 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-gray-500 text-xs mt-2"
                      >
                        Appuyer pour composer
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>

        {/* Keypad */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {KEYPAD_KEYS.map((key) => (
              <button
                key={key.num}
                onClick={() => addDigit(key.num)}
                className="h-14 rounded-xl bg-card border shadow-sm hover:bg-accent active:scale-95 transition-all flex flex-col items-center justify-center"
              >
                <span className="text-xl font-semibold">{key.num}</span>
                {key.letters && (
                  <span className="text-[9px] tracking-widest text-muted-foreground">
                    {key.letters}
                  </span>
                )}
              </button>
            ))}

            {/* Call & delete row */}
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="size-14 rounded-xl"
                onClick={removeDigit}
                disabled={!dialInput}
              >
                <Delete className="size-5 text-muted-foreground" />
              </Button>
            </div>

            <div className="flex items-center justify-center">
              <Button
                size="icon"
                className="size-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all active:scale-95"
                onClick={dial}
                disabled={!dialInput || isDialing}
              >
                <PhoneCall className="size-6" />
              </Button>
            </div>

            <div className="flex items-center justify-center">
              <div className="size-14" /> {/* Spacer for symmetry */}
            </div>
          </div>
        </motion.div>

        {/* Preset codes */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-medium text-muted-foreground">
            Codes rapides
          </h3>
          <div className="space-y-2">
            {presetCodes.map((preset) => {
              const Icon = preset.icon;
              return (
                <Card
                  key={preset.code}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => applyPreset(preset.code)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Icon className="size-4 text-emerald-700" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{preset.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {preset.code}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {preset.code}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-2"
        >
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            ⚠️ Note: Les codes USSD sont disponibles sur les téléphones simples via le réseau GSM. 
            Cette interface est une simulation.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
