'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Camera, CameraOff, CheckCircle2, Loader2, QrCode, XCircle, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import jsQR from 'jsqr'

export default function SellerQRScannerScreen() {
  const { user, goBack } = useAppStore()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanningRef = useRef(false)
  const animationRef = useRef(0)
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
    cancelAnimationFrame(animationRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  useEffect(() => stopCamera, [])

  async function startCamera() {
    setCameraError('')
    setStatus('idle')

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
      setCameraError("Impossible d'accéder à la caméra. Autorisez la caméra ou saisissez le code QR manuellement.")
    }
  }

  function scanLoop() {
    if (!scanningRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    if (video && canvas && video.readyState >= 2) {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)

      if (code) {
        setQrCodeData(code.data)
        toast('QR Code détecté', { description: 'Vous pouvez confirmer le paiement.' })
        stopCamera()
        return
      }
    }

    animationRef.current = requestAnimationFrame(scanLoop)
  }

  const handleScanAndPay = async (pinOverride?: string) => {
    if (!user?.id) {
      toast.error('Erreur', { description: 'Session service introuvable' })
      return
    }
    if (!qrCodeData.trim() || !amount || parseFloat(amount) <= 0) {
      toast.error('Erreur', { description: 'Veuillez scanner le QR Code et saisir un montant valide' })
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
        toast('PIN requis', { description: "Veuillez demander à l'enfant de saisir son code PIN." })
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

          <div className="w-full aspect-square mx-auto bg-black rounded-2xl mb-4 overflow-hidden relative shadow-lg">
            {cameraActive ? (
              <>
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline autoPlay />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-3/4 border-2 border-indigo-400/60 rounded-xl" />
                </div>
                <div className="absolute top-3 left-3 right-3 flex justify-center">
                  <span className="bg-indigo-600/80 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                    Placez le QR code dans le cadre
                  </span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted">
                <QrCode className="w-16 h-16 text-indigo-400" />
                <Button type="button" onClick={startCamera} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg rounded-xl">
                  <Camera className="w-4 h-4 mr-2" />
                  Ouvrir la caméra
                </Button>
              </div>
            )}
          </div>

          {cameraActive && (
            <Button type="button" variant="outline" onClick={stopCamera} className="w-full mb-4">
              <CameraOff className="w-4 h-4 mr-2" />
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
