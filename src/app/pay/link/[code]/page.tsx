'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  DollarSign,
  User,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

interface PaymentLinkDetails {
  amount: number
  currency: string
  description: string | null
  status: string
  owner: {
    id: string
    name: string
    pseudo: string
  }
}

export default function PayLinkPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [link, setLink] = useState<PaymentLinkDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!code) return

    // Fetch payment link details
    fetch(`/api/payments/links/${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.link) {
          setLink(data.link)
        } else {
          setError(data.message || 'Lien de paiement introuvable ou inactif')
        }
      })
      .catch(() => setError('Erreur lors du chargement des détails'))
      .finally(() => setLoading(false))

    // Check auth status
    fetch('/api/auth/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user) {
          setIsLoggedIn(true)
        }
      })
      .catch(() => {})
  }, [code])

  const handlePay = async () => {
    if (!isLoggedIn) {
      toast.info('Veuillez vous connecter pour procéder au paiement.')
      router.push(`/?pay_link=${code}`)
      return
    }

    setPaying(true)
    try {
      const res = await fetch(`/api/payments/links/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        toast.success('Paiement effectué avec succès !')
      } else {
        toast.error(data.message || 'Le paiement a échoué')
      }
    } catch {
      toast.error('Erreur réseau. Veuillez réessayer.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0D5C63] mx-auto mb-3" />
          <p className="text-muted-foreground">Chargement du lien de paiement...</p>
        </div>
      </div>
    )
  }

  if (error || !link) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-border">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Lien invalide ou expiré</h1>
            <p className="text-muted-foreground text-sm mb-6">
              {error || 'Ce lien de paiement n\'est plus disponible ou a dépassé son quota d\'utilisation.'}
            </p>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full rounded-xl"
            >
              Retour à l&apos;accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-border">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-2 animate-bounce">
              <ShieldCheck className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Paiement Réussi !</h1>
            <div className="rounded-xl bg-muted p-4 space-y-2 text-sm text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destinataire</span>
                <span className="font-semibold">{link.owner.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant payé</span>
                <span className="font-bold text-emerald-600">
                  {link.currency === 'FC' ? '' : '$'}{link.amount.toFixed(2)} {link.currency === 'FC' ? 'FC' : ''}
                </span>
              </div>
              {link.description && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description</span>
                  <span className="italic truncate max-w-[200px]">{link.description}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Merci d&apos;utiliser TRAIT pour vos transferts sécurisés.
            </p>
            <Button
              onClick={() => router.push('/')}
              className="w-full rounded-xl bg-[#0D5C63] hover:bg-[#083A3E] text-white"
            >
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-6">
      <Card className="max-w-md w-full border-border shadow-lg">
        <CardContent className="p-6 text-center">
          {/* Header */}
          <div className="w-20 h-20 rounded-full bg-[#0D5C63]/10 flex items-center justify-center mx-auto mb-4">
            <User className="h-10 w-10 text-[#0D5C63]" />
          </div>

          <h2 className="text-lg text-muted-foreground">Demande de paiement de</h2>
          <h1 className="text-2xl font-bold text-foreground mt-1">{link.owner.name}</h1>
          <p className="text-sm text-muted-foreground">@{link.owner.pseudo}</p>

          {/* Amount Box */}
          <div className="my-6 p-6 rounded-2xl bg-[#0D5C63]/5 dark:bg-[#0D5C63]/10 border border-[#0D5C63]/10">
            <p className="text-sm text-[#0D5C63] font-semibold uppercase tracking-wider mb-1">Montant demandé</p>
            <p className="text-4xl font-extrabold text-foreground">
              {link.currency === 'FC' ? '' : '$'}{link.amount.toFixed(2)}
              <span className="text-2xl font-bold ml-1">{link.currency}</span>
            </p>
            {link.description && (
              <p className="text-sm italic text-muted-foreground mt-3 border-t pt-3">
                &ldquo;{link.description}&rdquo;
              </p>
            )}
          </div>

          {/* Pay Button */}
          <Button
            onClick={handlePay}
            disabled={paying}
            className="w-full h-14 bg-[#0D5C63] hover:bg-[#083A3E] text-white rounded-2xl font-bold flex items-center justify-center gap-2 text-base shadow-md transition-all active:scale-[0.98]"
          >
            {paying ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Paiement en cours...
              </>
            ) : isLoggedIn ? (
              <>
                Confirmer le paiement
                <ArrowRight className="h-5 w-5 ml-1" />
              </>
            ) : (
              <>
                Se connecter pour payer
                <ArrowRight className="h-5 w-5 ml-1" />
              </>
            )}
          </Button>

          {/* Subtext */}
          {!isLoggedIn && (
            <p className="text-xs text-muted-foreground mt-4">
              Vous serez redirigé vers l&apos;application pour confirmer votre solde et saisir votre code PIN.
            </p>
          )}

          {/* Secure Badge */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Sécurisé par le protocole de chiffrement TRAIT</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
