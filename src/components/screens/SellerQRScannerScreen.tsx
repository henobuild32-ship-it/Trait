'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, QrCode, CheckCircle2, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

import { useAppStore } from '@/lib/store'

export function SellerQRScannerScreen() {
  const { user, goBack } = useAppStore()
  const { toast } = useToast()
  const [qrCodeData, setQrCodeData] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleScanAndPay = async () => {
    if (!qrCodeData || !amount) {
      toast({ title: 'Erreur', description: 'Veuillez remplir le code QR et le montant', variant: 'destructive' })
      return
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/payment/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: user.id,
          qrCode: qrCodeData,
          amount: amount,
          currency: 'USD'
        })
      })
      const data = await res.json()
      
      if (data.success) {
        setStatus('success')
        setMessage('Paiement réussi')
        setQrCodeData('')
        setAmount('')
      } else {
        setStatus('error')
        setMessage(data.message || 'Erreur de paiement')
      }
    } catch (error) {
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
        <h2 className="text-xl font-bold text-gray-800">Scanner Paiement</h2>
      </div>

      <div className="p-6 flex-1 flex flex-col items-center">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 w-full max-w-sm mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          
          <h3 className="font-bold text-gray-800 mb-2">Scanner le QR Code de la Carte Trait</h3>
          <p className="text-sm text-gray-500 mb-6">Demandez au client de présenter sa Carte Trait</p>
          
          <div className="w-48 h-48 mx-auto border-4 border-dashed border-indigo-200 rounded-2xl flex items-center justify-center bg-indigo-50/50 mb-6 relative">
            <QrCode className="w-16 h-16 text-indigo-300" />
            <div className="absolute inset-0 bg-indigo-500/10 animate-pulse rounded-2xl"></div>
          </div>

          <div className="space-y-4">
            <Input 
              placeholder="Simulation: Entrez les données du QR Code" 
              value={qrCodeData}
              onChange={(e) => setQrCodeData(e.target.value)}
              className="text-center"
            />
            <Input 
              type="number"
              placeholder="Montant à payer (USD)" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-center font-bold text-lg"
            />
            <Button 
              onClick={handleScanAndPay} 
              disabled={status === 'loading'}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6"
            >
              {status === 'loading' ? 'Traitement...' : 'Confirmer le paiement'}
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
    </div>
  )
}
