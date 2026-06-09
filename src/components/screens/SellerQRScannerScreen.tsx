'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Camera, CheckCircle2, Loader2, QrCode, XCircle, Lock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function SellerQRScannerScreen() {
  const { user, goBack } = useAppStore()
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanningRef = useRef(false)
  const [qrCodeData, setQrCodeData] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'USD' | 'FC'>('USD')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [showPinPrompt, setShowPinPrompt] = useState(false)
  const [clientPin, setClientPin] = useState('')

  function stopCamera() {
    scanningRef.current = false
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  useEffect(() => stopCamera, [])

  async function startCamera() {
    setCameraError('')
    setStatus('idle')

    if (!('BarcodeDetector' in window)) {
      setCameraError('Scanner caméra non supporté par ce navigateur. Collez le code QR manuellement.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
      scanningRef.current = true
      scanLoop()
    } catch {
      setCameraError("Impossible d'accéder à la caméra. Autorisez la caméra ou saisissez le code QR.")
    }
  }

  async function scanLoop() {
    const BarcodeDetectorCtor = (window as any).BarcodeDetector
    const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] })

    while (scanningRef.current) {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        try {
          const codes = await detector.detect(videoRef.current)
          const value = codes?.[0]?.rawValue
          if (value) {
            setQrCodeData(value)
            toast({ title: 'QR Code détecté', description: 'Vous pouvez confirmer le paiement.' })
            stopCamera()
            return
          }
        } catch {
          setCameraError('Lecture QR impossible. Réessayez ou saisissez le code manuellement.')
          stopCamera()
          return
        }
      }
      await new Promise((resolve) => window.setTimeout(resolve, 250))
    }
  }

  const handleScanAndPay = async (pinOverride?: string) => {
    if (!user?.id) {
      toast({ title: 'Erreur', description: 'Session vendeur introuvable', variant: 'destructive' })
      return
    }
    if (!qrCodeData.trim() || !amount || parseFloat(amount) <= 0) {
      toast({ title: 'Erreur', description: 'Veuillez scanner le QR Code et saisir un montant valide', variant: 'destructive' })
      return
    }

    const pinToSubmit = pinOverride || clientPin

    setStatus('loading')
    try {
      const res = await fetch('/api/payment/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: user.id,
          qrCode: qrCodeData.trim(),
          amount,
          currency,
          pin: pinToSubmit || undefined,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setStatus('success')
        setMessage(data.message || 'Paiement réussi')
        setQrCodeData('')
        setAmount('')
        setClientPin('')
        setShowPinPrompt(false)
      } else if (data.requirePin) {
        setStatus('idle')
        setShowPinPrompt(true)
        toast({ title: 'PIN requis', description: "Veuillez demander à l'enfant de saisir son code PIN." })
      } else {
        setStatus('error')
        setMessage(data.message || 'Erreur de paiement')
      }
    } catch {
      setStatus('error')
      setMessage('Erreur réseau')
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex items-center p-4 bg-white shadow-sm z-10">
        <Button variant="ghost" size="icon" onClick={() => goBack()} className="mr-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-bold text-gray-800">Scanner paiement</h2>
      </div>

      <div className="p-6 flex-1 flex flex-col items-center">
        <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 w-full max-w-sm mb-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600" />

          <h3 className="font-bold text-gray-800 mb-2">QR Code de la carte TRAIT</h3>
          <p className="text-sm text-gray-500 mb-5">Scannez la carte du client ou collez le code QR.</p>

          <div className="w-full aspect-square mx-auto border border-indigo-100 rounded-2xl flex items-center justify-center bg-indigo-50/50 mb-4 overflow-hidden">
            {cameraActive ? (
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            ) : (
              <div className="flex flex-col items-center gap-3 text-indigo-300">
                <QrCode className="w-16 h-16" />
                <Button type="button" onClick={startCamera} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Camera className="w-4 h-4 mr-2" />
                  Ouvrir caméra
                </Button>
              </div>
            )}
          </div>

          {cameraActive && (
            <Button type="button" variant="outline" onClick={stopCamera} className="w-full mb-4">
              Arrêter la caméra
            </Button>
          )}

          {cameraError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2 mb-4">{cameraError}</p>
          )}

          <div className="space-y-4">
            <Input
              placeholder="Code QR de la carte TRAIT"
              value={qrCodeData}
              onChange={(e) => setQrCodeData(e.target.value)}
              className="text-center"
            />
            <div className="grid grid-cols-2 gap-2">
              {(['USD', 'FC'] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={currency === value ? 'default' : 'outline'}
                  onClick={() => setCurrency(value)}
                  className={currency === value ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
                >
                  {value}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              placeholder={`Montant à payer (${currency})`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-center font-bold text-lg"
            />
            <Button
              onClick={handleScanAndPay}
              disabled={status === 'loading'}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6"
            >
              {status === 'loading' ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Traitement...</span>
              ) : 'Confirmer le paiement'}
            </Button>
          </div>
        </div>

        {status === 'success' && (
          <div className="flex items-center gap-3 text-green-600 bg-green-50 px-6 py-4 rounded-xl border border-green-100 animate-in fade-in slide-in-from-bottom-4">
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-semibold">{message}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-3 text-red-600 bg-red-50 px-6 py-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-bottom-4">
            <XCircle className="w-6 h-6" />
            <span className="font-semibold">{message}</span>
          </div>
        )}
      </div>

      {/* Dialogue Code PIN Enfant */}
      <Dialog open={showPinPrompt} onOpenChange={setShowPinPrompt}>
        <DialogContent className="mx-4 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="size-5 text-indigo-600" />
              Code PIN Enfant requis
            </DialogTitle>
            <DialogDescription>
              Cette carte appartient à un compte enfant. Veuillez demander à l&apos;enfant de saisir son code PIN à 4 chiffres pour valider l&apos;achat.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              maxLength={4}
              placeholder="Code PIN"
              value={clientPin}
              onChange={(e) => setClientPin(e.target.value.replace(/\D/g, ''))}
              className="h-12 font-mono tracking-widest text-center text-xl"
              required
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => {
                setShowPinPrompt(false)
                setClientPin('')
              }}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              disabled={clientPin.length !== 4}
              onClick={() => handleScanAndPay()}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
