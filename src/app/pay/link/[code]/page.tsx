'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ShieldCheck, AlertCircle, Loader2, ArrowRight,
  Wallet, Phone, CheckCircle2, Lock, Zap, Copy, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// ── Operator catalogue — add new operators here, nothing else to change ──────
const ALL_OPERATORS = [
  {
    id: 'wallet',
    label: 'Wallet TRAIT',
    logo: '💳',
    color: 'text-[#0D5C63]',
    bg: 'bg-[#0D5C63]/10',
    border: 'border-[#0D5C63]/30',
    ring: 'ring-[#0D5C63]/40',
    needsPhone: false,
    desc: 'Payer depuis votre solde TRAIT',
    needsAuth: true,
  },
  {
    id: 'mpesa',
    label: 'M-Pesa',
    logo: '📱',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-300 dark:border-emerald-700/40',
    ring: 'ring-emerald-400/40',
    needsPhone: true,
    desc: 'Mobile Money M-Pesa',
    needsAuth: false,
  },
  {
    id: 'orange',
    label: 'Orange Money',
    logo: '🟠',
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-300 dark:border-orange-700/40',
    ring: 'ring-orange-400/40',
    needsPhone: true,
    desc: 'Orange Money RDC',
    needsAuth: false,
  },
  {
    id: 'airtel',
    label: 'Airtel Money',
    logo: '📶',
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-300 dark:border-red-700/40',
    ring: 'ring-red-400/40',
    needsPhone: true,
    desc: 'Airtel Money RDC',
    needsAuth: false,
  },
  {
    id: 'afrimoney',
    label: 'Afrimoney',
    logo: '🏦',
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    border: 'border-purple-300 dark:border-purple-700/40',
    ring: 'ring-purple-400/40',
    needsPhone: true,
    desc: 'Afrimoney RDC',
    needsAuth: false,
  },
]

interface PaymentLinkDetails {
  amount: number
  currency: string
  description: string | null
  status: string
  allowedMethods: string
  owner: { id: string; name: string; pseudo: string }
}

type OperatorId = 'wallet' | 'mpesa' | 'orange' | 'airtel' | 'afrimoney'

export default function PayLinkPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [link, setLink] = useState<PaymentLinkDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loggedUser, setLoggedUser] = useState<any>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  const [selectedMethod, setSelectedMethod] = useState<OperatorId | null>(null)
  const [mobileNumber, setMobileNumber] = useState('')
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMethod, setSuccessMethod] = useState<OperatorId>('wallet')

  useEffect(() => {
    if (!code) return
    fetch(`/api/payments/links/${code}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.link) setLink(data.link)
        else setError(data.message || 'Lien introuvable ou expiré')
      })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))

    fetch('/api/auth/profile', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.user) { setIsLoggedIn(true); setLoggedUser(data.user) }
      })
      .catch(() => {})
  }, [code])

  const allowedIds = link?.allowedMethods
    ? link.allowedMethods.split(',').map(s => s.trim())
    : ALL_OPERATORS.map(o => o.id)

  const operators = ALL_OPERATORS.filter(o => allowedIds.includes(o.id))
  const selectedOp = ALL_OPERATORS.find(o => o.id === selectedMethod) || null

  const fmt = (amount: number, currency: string) =>
    currency === 'FC' ? `${amount.toLocaleString('fr-FR')} FC` : `$${amount.toFixed(2)}`

  const handlePay = async () => {
    if (!selectedMethod) { toast.error('Choisissez une méthode de paiement'); return }
    if (selectedOp?.needsPhone && !mobileNumber.trim()) {
      toast.error('Entrez votre numéro de téléphone'); return
    }
    if (selectedMethod === 'wallet' && !isLoggedIn) {
      toast.info('Connectez-vous pour payer via Wallet TRAIT')
      router.push(`/?pay_link=${code}`)
      return
    }

    setPaying(true)
    try {
      const res = await fetch(`/api/payments/links/${code}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: selectedMethod, mobileNumber: mobileNumber.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccessMethod(selectedMethod)
        setSuccess(true)
        toast.success('Paiement traité avec succès !')
      } else {
        toast.error(data.message || 'Paiement échoué')
      }
    } catch {
      toast.error('Erreur réseau. Réessayez.')
    } finally {
      setPaying(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
    toast.success('Lien copié !')
  }

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-[#0D5C63]/10 flex items-center justify-center mx-auto animate-pulse">
          <Wallet className="h-8 w-8 text-[#0D5C63]" />
        </div>
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    </div>
  )

  // ── Error ──
  if (error || !link) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-sm w-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold">Lien invalide ou expiré</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => router.push('/')} variant="outline" className="w-full rounded-xl">
            Retour à l'accueil
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  // ── Success ──
  if (success) {
    const op = ALL_OPERATORS.find(o => o.id === successMethod)
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-background dark:from-emerald-950/20 flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm">
          <Card className="border-emerald-200 dark:border-emerald-800/40 shadow-xl shadow-emerald-500/10">
            <CardContent className="p-8 text-center space-y-5">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto"
              >
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Paiement réussi !</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {successMethod === 'wallet'
                    ? 'Fonds transférés instantanément'
                    : `Demande ${op?.label} soumise avec succès`}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Destinataire</span>
                  <span className="font-bold">{link.owner.name}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-sm text-muted-foreground">Montant</span>
                  <span className="font-bold text-emerald-600 text-lg">{fmt(link.amount, link.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Via</span>
                  <Badge className={`${op?.bg} ${op?.color} border ${op?.border}`}>{op?.logo} {op?.label}</Badge>
                </div>
              </div>
              {successMethod !== 'wallet' && (
                <p className="text-xs text-muted-foreground bg-muted/30 rounded-xl p-3">
                  💡 Les fonds seront crédités après traitement par l'opérateur {op?.label} (quelques minutes).
                </p>
              )}
              <Button onClick={() => router.push('/')} className="w-full rounded-xl bg-[#0D5C63] hover:bg-[#0D5C63]/90 text-white">
                Retour à l'accueil
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // ── Main checkout page ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D5C63]/8 via-background to-background dark:from-[#0D5C63]/12">
      {/* Top nav */}
      <div className="bg-[#0D5C63] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <Zap className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm">TRAIT Pay</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleCopyLink} className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors">
            {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedLink ? 'Copié' : 'Copier'}
          </button>
          <div className="flex items-center gap-1 text-xs text-white/80">
            <Lock className="h-3 w-3" />
            <span>Sécurisé</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-5 pb-12">

        {/* Recipient & amount card */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Card className="border-border shadow-lg shadow-[#0D5C63]/5 overflow-hidden">
            <div className="bg-gradient-to-r from-[#0D5C63] to-[#14888F] p-6 text-white text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 ring-4 ring-white/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold">{(link.owner.name || '?')[0].toUpperCase()}</span>
              </div>
              <h2 className="text-xl font-bold">{link.owner.name}</h2>
              <p className="text-white/70 text-sm">@{link.owner.pseudo}</p>
            </div>
            <CardContent className="p-5 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Montant demandé</p>
              <p className="text-4xl font-extrabold text-foreground">{fmt(link.amount, link.currency)}</p>
              {link.description && (
                <p className="text-sm text-muted-foreground mt-3 italic border-t pt-3">&ldquo;{link.description}&rdquo;</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Method selection */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.08 }}>
          <p className="text-sm font-bold text-foreground mb-3">Choisissez votre mode de paiement</p>
          <div className="grid grid-cols-2 gap-2.5">
            {operators.map(op => (
              <button
                key={op.id}
                onClick={() => setSelectedMethod(op.id as OperatorId)}
                className={`relative p-3.5 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                  selectedMethod === op.id
                    ? `${op.border} ${op.bg} ring-2 ring-offset-2 ${op.ring}`
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                {selectedMethod === op.id && (
                  <div className={`absolute top-2 right-2 ${op.bg} rounded-full`}>
                    <CheckCircle2 className={`h-4 w-4 ${op.color}`} />
                  </div>
                )}
                <div className="text-2xl mb-2">{op.logo}</div>
                <p className={`text-xs font-bold leading-tight ${selectedMethod === op.id ? op.color : 'text-foreground'}`}>{op.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{op.desc}</p>
                {op.id === 'wallet' && isLoggedIn && loggedUser && (
                  <p className="text-[10px] font-semibold text-[#0D5C63] mt-1.5">
                    Solde: {link.currency === 'FC'
                      ? `${(loggedUser.realBalanceFC || 0).toLocaleString('fr-FR')} FC`
                      : `$${(loggedUser.realBalance || 0).toFixed(2)}`}
                  </p>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Phone input for mobile money */}
        <AnimatePresence>
          {selectedMethod && selectedOp?.needsPhone && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Numéro {selectedOp.label}
                </Label>
                <Input
                  type="tel"
                  placeholder="ex: +243 8X XXX XXXX"
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value)}
                  className="h-12 rounded-xl text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Un code de confirmation sera envoyé sur ce numéro.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wallet not logged in */}
        <AnimatePresence>
          {selectedMethod === 'wallet' && !isLoggedIn && (
            <motion.div
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3.5 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2.5"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Connectez-vous à TRAIT pour utiliser votre Wallet. Vous serez redirigé vers la connexion.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pay button */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
          <Button
            onClick={handlePay}
            disabled={!selectedMethod || paying}
            className="w-full h-14 bg-[#0D5C63] hover:bg-[#0D5C63]/90 text-white rounded-2xl font-bold text-base shadow-xl shadow-[#0D5C63]/20 transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {paying
              ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Traitement...</>
              : selectedMethod
                ? <><span>Payer {fmt(link.amount, link.currency)}</span><ArrowRight className="h-5 w-5 ml-2" /></>
                : 'Choisissez une méthode'
            }
          </Button>
        </motion.div>

        {/* Security footer */}
        <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /><span>Paiement chiffré</span></div>
          <div className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-emerald-500" /><span>100% sécurisé</span></div>
          <div className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-emerald-500" /><span>Instantané</span></div>
        </div>
      </div>
    </div>
  )
}
